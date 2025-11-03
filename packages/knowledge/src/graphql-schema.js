import { makeExecutableSchema } from '@graphql-tools/schema'
import { GraphQLScalarType, GraphQLError } from 'graphql'
import { DateTimeResolver, JSONResolver } from 'graphql-scalars'
import { Knowledge } from './knowledge.js'
import { Logger } from './logger.js'

// Custom scalar for coordinates [longitude, latitude]
const CoordinatesType = new GraphQLScalarType({
  name: 'Coordinates',
  description: 'Geographic coordinates as [longitude, latitude] array',
  serialize(value) {
    if (Array.isArray(value) && value.length >= 2) {
      return [parseFloat(value[0]), parseFloat(value[1])]
    }
    throw new GraphQLError('Coordinates must be [longitude, latitude] array')
  },
  parseValue(value) {
    if (Array.isArray(value) && value.length >= 2) {
      return [parseFloat(value[0]), parseFloat(value[1])]
    }
    throw new GraphQLError('Coordinates must be [longitude, latitude] array')
  }
})

// GraphQL Type Definitions
// @todo these are hardcoded and must be replaced with dynamically generated

const typeDefs = `
  scalar DateTime
  scalar JSON
  scalar Coordinates

  # Core entity metadata
  type Meta {
    label: String!
    slug: String
    content: String
    depiction: String
    view: String
    tags: [String!]
    aliases: [String!]
    provenance: String
    sponsorId: String
    permissions: Permission
    props: JSON
  }

  enum Permission {
    private
    protected
    public
    append
  }

  # Temporal information
  type Time {
    begins: DateTime
    ends: DateTime
    duration: String
  }

  # Geographic location
  type Location {
    lat: Float!
    lon: Float!
    alt: Float
    rad: Float
    point: GeoJSONPoint
  }

  type GeoJSONPoint {
    type: String!
    coordinates: Coordinates!
  }

  # Address information
  type Address {
    streetAddress: String
    city: String
    region: String
    postalCode: String
    country: String
    countryCode: String
    admin1: String
    admin2: String
    iso_3166_2: String
  }

  # Statistics and metrics
  type Stats {
    children: Int
    upvotes: Int
    visited: Int
    observers: Int
    activity: Float
    reputation: Float
    distance: Float
  }

  # Entity types
  type Thing {
    id: String!
    kind: String!
    meta: Meta!
    time: Time
    location: Location
    address: Address
    stats: Stats
    thing: JSON
  }

  type Party {
    id: String!
    kind: String!
    meta: Meta!
    time: Time
    location: Location
    address: Address
    stats: Stats
    party: JSON
  }

  type Place {
    id: String!
    kind: String!
    meta: Meta!
    time: Time
    location: Location
    address: Address
    stats: Stats
    place: JSON
  }

  type Group {
    id: String!
    kind: String!
    meta: Meta!
    time: Time
    location: Location
    address: Address
    stats: Stats
    group: JSON
  }

  type Org {
    id: String!
    kind: String!
    meta: Meta!
    time: Time
    location: Location
    address: Address
    stats: Stats
    org: JSON
  }

  type Edge {
    id: String!
    kind: String!
    meta: Meta!
    time: Time
    relation: Relation
  }

  # Relation data for edges
  type Relation {
    subject: String!
    predicate: String!
    object: String!
    rank: Int
    weight: Int
  }

  # Union type for all entities
  union Entity = Thing | Party | Place | Group | Org | Edge

  # Query inputs
  input NearbyInput {
    lat: Float!
    lon: Float!
    maxDistance: Float = 10000
  }

  input TimeRangeInput {
    after: DateTime
    before: DateTime
    during: DateTime
  }

  # Query type
  type Query {
    # Basic entity queries
    entity(id: String!): Entity
    entities(
      limit: Int = 20
      offset: Int = 0
      type: String
      filter: JSON
    ): [Entity!]!
    
    # Spatial queries
    entitiesNearby(
      location: NearbyInput!
      limit: Int = 20
      offset: Int = 0
      type: String
      filter: JSON
    ): [Entity!]!

    # Temporal queries
    entitiesByTimeRange(
      timeRange: TimeRangeInput!
      limit: Int = 20
      offset: Int = 0
      type: String
      filter: JSON
    ): [Entity!]!

    # Schema introspection
    entitySchemas: [String!]!
  }

  type ValidationResult {
    valid: Boolean!
    errors: [ValidationError!]
  }

  type ValidationError {
    message: String!
    path: String
  }
`

// Helper function to determine entity type from data
function getEntityType(entity) {
  // Use the kind field if available (new schema)
  if (entity.kind) {
    // Capitalize first letter for GraphQL type name
    return entity.kind.charAt(0).toUpperCase() + entity.kind.slice(1)
  }
  
  return 'Thing' // Default fallback
}

// Helper function to add __typename for union resolution
function addTypename(entity) {
  const type = getEntityType(entity)
  return { ...entity, __typename: type }
}

// GraphQL Resolvers
const resolvers = {
  DateTime: DateTimeResolver,
  JSON: JSONResolver,
  Coordinates: CoordinatesType,

  Entity: {
    __resolveType(entity) {
      return getEntityType(entity)
    }
  },

  Query: {
    async entity(_, { id }) {
      try {
        const entity = await Knowledge.getEntityById(id)
        return entity ? addTypename(entity) : null
      } catch (error) {
        Logger.error('GraphQL entity query error:', error)
        throw new GraphQLError(`Failed to fetch entity: ${error.message}`)
      }
    },

    async entities(_, { limit, offset, type, filter }) {
      try {
        const query = { 
          limit, 
          offset,
          ...filter 
        }
        
        const entities = await Knowledge.queryEntities(query)
        return entities.map(addTypename)
      } catch (error) {
        Logger.error('GraphQL entities query error:', error)
        throw new GraphQLError(`Failed to fetch entities: ${error.message}`)
      }
    },

    async entitiesNearby(_, { location, limit, offset, type, filter }) {
      try {
        const options = { limit, offset, ...filter }
        
        const entities = await Knowledge.findNearby(
          location.lat, 
          location.lon, 
          location.maxDistance,
          options
        )
        return entities.map(addTypename)
      } catch (error) {
        Logger.error('GraphQL nearby query error:', error)
        throw new GraphQLError(`Failed to fetch nearby entities: ${error.message}`)
      }
    },

    async entitiesByTimeRange(_, { timeRange, limit, offset, type, filter }) {
      try {
        const options = { limit, offset, ...filter }
        
        const entities = await Knowledge.findByTimeRange(timeRange, options)
        return entities.map(addTypename)
      } catch (error) {
        Logger.error('GraphQL time range query error:', error)
        throw new GraphQLError(`Failed to fetch entities by time range: ${error.message}`)
      }
    },

    async entitySchemas() {
      try {
        const { schemaManager } = await import('./schema-manager.js')
        await schemaManager.initialize()
        return schemaManager.getSchemaIds()
      } catch (error) {
        Logger.error('GraphQL schema query error:', error)
        throw new GraphQLError(`Failed to fetch schemas: ${error.message}`)
      }
    }
  }
}

// Create executable schema
export const knowledgeSchema = makeExecutableSchema({
  typeDefs,
  resolvers
})

export { typeDefs, resolvers }