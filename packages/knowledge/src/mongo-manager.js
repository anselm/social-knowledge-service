import { uuidv7 } from 'uuidv7'
import { Logger } from './logger.js'
import { Perms } from './perms.js'
import { MongoClient } from 'mongodb'
import { schemaManager } from './schema-manager.js'

/// MongoDB connection manager
class MongoManager {
  constructor() {
    this.connection = null
    this.db = null
    this.collection = null
    this.client = null
  }

  /// Initialize MongoDB connection
  /// @param flushDb - Whether to flush the database on initialization
  /// @returns Promise<void>
  async initialize(flushDb = false) {
    if (this.connection) return this.connection // Already initialized
    
    try {
      // Initialize schema manager first
      await schemaManager.initialize()
      
      const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017'
      const mongoDb = process.env.MONGO_DB || 'social_knowledge_server'
      const mongoCollection = process.env.MONGO_COLLECTION || 'entities'
      
      this.client = new MongoClient(mongoUrl)
      await this.client.connect()
      this.db = this.client.db(mongoDb)
      this.collection = this.db.collection(mongoCollection)
      
      // Check if we should flush the database
      const shouldFlushDb = flushDb || process.env.FLUSH_DB === 'true' || process.env.FLUSH_DB === '1'
      
      if (shouldFlushDb) {
        const deleteResult = await this.collection.deleteMany({})
        Logger.info(`🗑️  FLUSH_DB: Deleted ${deleteResult.deletedCount} documents from MongoDB collection`)
      }
      
      // Create indexes for efficient lookups
      await this.collection.createIndex({ id: 1 }, { unique: true })
      await this.collection.createIndex({ type: 1 })
      
      // Create spatial index for location queries
      await this.collection.createIndex({ "location.point": "2dsphere" })
      Logger.debug('🗺️  Created 2dsphere spatial index on location.point')
      
      // Create indexes for temporal queries
      await this.collection.createIndex({ "time.begins": 1 })
      await this.collection.createIndex({ "time.ends": 1 })
      Logger.debug('⏰ Created temporal indexes on time fields')
      
      this.connection = { db: this.db, collection: this.collection, client: this.client }
      
      Logger.info(`🗄️  Connected to MongoDB: ${mongoUrl}/${mongoDb}/${mongoCollection}`)
      return this.connection
    } catch (error) {
      Logger.error('Failed to connect to MongoDB:', error)
      throw error
    }
  }

  /// Close MongoDB connection
  async close() {
    if (this.client) {
      await this.client.close()
      this.connection = null
      this.db = null
      this.collection = null
      this.client = null
      Logger.info('🔌 MongoDB connection closed')
    }
  }

  /// Helper to merge objects deeply
  mergeDeep(target, overlay = {}) {
    const result = { ...target }
    for (const [k, v] of Object.entries(overlay || {})) {
      if (v === undefined) {
        delete result[k]
      } else if (this.isObj(v) && this.isObj(result[k])) {
        result[k] = this.mergeDeep(result[k], v)
      } else {
        result[k] = v
      }
    }
    return result
  }

  /// Check if value is an object
  isObj(v) {
    return v && typeof v === 'object' && !Array.isArray(v)
  }

  /// Build MongoDB query from simple object with spatial and temporal support
  buildMongoQuery(query) {
    if (!query || typeof query !== 'object') return {}
    
    const mongoQuery = {}
    
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue
      
      // Handle spatial queries
      if (key === '$near' && value.lat && value.lon) {
        // Convert lat/lon to MongoDB $near query
        mongoQuery['location.point'] = {
          $near: {
            $geometry: {
              type: "Point", 
              coordinates: [value.lon, value.lat]
            },
            $maxDistance: value.maxDistance || value.rad || 10000 // Default 10km
          }
        }
        continue
      }
      
      // Handle geoWithin queries (for radius searches)
      if (key === '$geoWithin' && value.lat && value.lon && value.radius) {
        mongoQuery['location.point'] = {
          $geoWithin: {
            $centerSphere: [[value.lon, value.lat], value.radius / 6378100] // radius in radians
          }
        }
        continue
      }
      
      // Handle temporal range queries
      if (key === '$timeRange') {
        const timeQuery = {}
        if (value.after) {
          timeQuery['time.begins'] = { $gte: new Date(value.after) }
        }
        if (value.before) {
          timeQuery['time.ends'] = { $lte: new Date(value.before) }
        }
        if (value.during) {
          // Entity active during specified time
          const duringDate = new Date(value.during)
          timeQuery.$and = [
            { $or: [{ 'time.begins': { $lte: duringDate } }, { 'time.begins': { $exists: false } }] },
            { $or: [{ 'time.ends': { $gte: duringDate } }, { 'time.ends': { $exists: false } }] }
          ]
        }
        Object.assign(mongoQuery, timeQuery)
        continue
      }
      
      // Handle regular MongoDB operators
      if (key.startsWith('$')) {
        mongoQuery[key] = value
        continue
      }
      
      // Handle nested object queries (like location.lat, meta.label)
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Check if this is a MongoDB operator object
        const hasOperators = Object.keys(value).some(k => k.startsWith('$'))
        if (hasOperators) {
          mongoQuery[key] = value
        } else {
          // Regular nested object - flatten it
          for (const [subKey, subValue] of Object.entries(value)) {
            if (subValue !== undefined && subValue !== null) {
              mongoQuery[`${key}.${subKey}`] = subValue
            }
          }
        }
        continue
      }
      
      // Regular field query
      mongoQuery[key] = value
    }
    
    return mongoQuery
  }

  /// Enhance entity with GeoJSON point data for spatial queries
  /// @param entity - Entity object to enhance
  enhanceLocationData(entity) {
    if (entity.location && entity.location.lat !== undefined && entity.location.lon !== undefined) {
      // Only add point if it doesn't already exist
      if (!entity.location.point) {
        entity.location.point = {
          type: "Point",
          coordinates: [entity.location.lon, entity.location.lat] // GeoJSON: [longitude, latitude]
        }
        
        // Add altitude if present
        if (entity.location.alt !== undefined) {
          entity.location.point.coordinates.push(entity.location.alt)
        }
        
        Logger.debug(`🗺️  Enhanced entity ${entity.id || 'new'} with GeoJSON point: [${entity.location.lon}, ${entity.location.lat}]`)
      }
    }
  }

  /// Validate entity against JSON schema
  /// @param entity - Entity object to validate
  /// @throws Error if validation fails
  validateEntity(entity) {
    if (!entity || typeof entity !== 'object') {
      throw new Error('Entity must be an object')
    }

    // Determine schema based on entity structure
    let schemaId = null
    
    // Check for explicit type field
    if (entity.type) {
      schemaId = `ka://schemas/core/${entity.type}/1.0.0`
    }
    // Infer type from entity structure
    else if (entity.thing) {
      schemaId = 'ka://schemas/core/thing/1.0.0'
    } else if (entity.party) {
      schemaId = 'ka://schemas/core/party/1.0.0'
    } else if (entity.group) {
      schemaId = 'ka://schemas/core/group/1.0.0'
    } else if (entity.subject && entity.predicate && entity.object) {
      schemaId = 'ka://schemas/core/edge/1.0.0'
    }

    // Skip validation if we can't determine the schema
    if (!schemaId) {
      Logger.debug(`⚠️  No schema found for entity, skipping validation: ${entity.id || 'unknown'}`)
      return
    }

    try {
      const result = schemaManager.validate(schemaId, entity)
      
      if (!result.valid) {
        const errorMessages = result.errors?.map(err => 
          `${err.instancePath}: ${err.message}`
        ).join(', ') || 'Unknown validation error'
        
        throw new Error(`Entity validation failed for schema ${schemaId}: ${errorMessages}`)
      }
      
      Logger.debug(`✅ Entity validated against schema ${schemaId}`)
    } catch (error) {
      Logger.error(`❌ Validation error:`, error.message)
      throw error
    }
  }

  /// Save an entity to MongoDB
  /// @param entity - Entity object to save
  /// @param options - Options object with validation settings
  /// @returns Promise<void>
  async saveEntity(entity, options = {}) {
    await this.initialize()
    
    if (!entity) return
    
    // Validate entity schema if validation is enabled (default: true)
    if (options.validate !== false) {
      this.validateEntity(entity)
    }

    // Enhance location with GeoJSON point for spatial queries
    this.enhanceLocationData(entity)

    // Generate ID if not provided
    if (!entity.id) {
      entity.id = `${uuidv7()}`
    }

    // Handle obliterate operation
    if (entity.obliterate) {
      const result = await this.collection.deleteOne({ id: entity.id })
      if (result.deletedCount > 0) {
        Logger.info(`🗑️  Deleted entity ${entity.id} from MongoDB`)
      }
      return
    }

    const existing = await this.collection.findOne({ id: entity.id })

    // Check write permissions
    if (!Perms.write(entity, existing)) {
      Logger.error('No write permissions', entity, existing)
      return
    }

    // Create or update entity
    if (existing) {
      // Merge with existing document
      const merged = this.mergeDeep({ ...existing }, entity)
      
      // Remove undefined fields (MongoDB doesn't like them)
      const cleanDoc = JSON.parse(JSON.stringify(merged))
      
      // Remove the _id field to avoid MongoDB immutable field error
      delete cleanDoc._id
      
      await this.collection.replaceOne({ id: entity.id }, cleanDoc)
      Logger.info(`📝 Updated entity ${entity.id} in MongoDB`)
    } else {
      // Clean the document before inserting
      const cleanDoc = JSON.parse(JSON.stringify(entity))
      
      await this.collection.insertOne(cleanDoc)
      Logger.info(`💾 Created entity ${entity.id} in MongoDB`)
    }
  }

  /// Query entities from MongoDB
  /// @param query - Query object with optional limit and offset
  /// @returns Promise<Array> - Array of matching entities
  async queryEntities(query = {}) {
    await this.initialize()
    
    // Extract pagination parameters and exclude from actual query
    const { limit, offset, ...actualQuery } = query
    
    const mongoQuery = this.buildMongoQuery(actualQuery)

    console.log("******* server looking for", mongoQuery)

    let queryBuilder = this.collection.find(mongoQuery)
    
    // Apply pagination if provided
    if (offset && parseInt(offset) > 0) {
      queryBuilder = queryBuilder.skip(parseInt(offset))
    }
    if (limit && parseInt(limit) > 0) {
      queryBuilder = queryBuilder.limit(parseInt(limit))
    }
    
    const candidates = await queryBuilder.toArray()
    
    Logger.info(`🔍 MongoDB query found ${candidates.length} results`)
    return candidates
  }

  /// Delete an entity from MongoDB
  /// @param id - The entity ID to delete
  /// @returns Promise<boolean> - true if entity was deleted, false if not found
  async deleteEntity(id) {
    await this.initialize()
    
    const result = await this.collection.deleteOne({ id })
    
    if (result.deletedCount === 1) {
      Logger.info(`🗑️  Entity '${id}' deleted from MongoDB`)
      return true
    } else {
      Logger.warn(`⚠️  Entity '${id}' not found for deletion`)
      return false
    }
  }
}

// Export singleton instance
export const mongoManager = new MongoManager()