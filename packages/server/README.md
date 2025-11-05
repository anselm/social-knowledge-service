# @social/server

HTTP server for the Social monorepo with GraphQL and authentication support.

## Features

- **Fastify HTTP Server** - Fast, efficient web server
- **GraphQL API** - Complete GraphQL endpoint with spatial/temporal queries
- **Authentication** - SIWE (Ethereum) and Magic.link support
- **Knowledge Integration** - Direct access to @social/knowledge package
- **Svelte Frontend** - Serves the web application

## Quick Start

```bash
# Install dependencies
npm install

# Build the server
npm run build

# Start in development mode
npm run dev

# Start in production mode
node dist/index.js
```

## Endpoints

### Core Services
- `GET /` - Svelte web application
- `GET /api/health` - Health check with server status
- `GET /healthz` - Simple health check
- `GET /api/graphql` - GraphQL endpoint
- `GET /api/graphiql` - GraphQL playground (development)

### Authentication
- `GET /api/auth/nonce` - Get nonce for SIWE authentication
- `POST /api/auth/verify` - Verify authentication (SIWE/Magic.link)
- `POST /api/auth/test` - Test authentication with current credentials
- `GET /api/auth/status` - Check authentication status and available methods

See [AUTH.md](./AUTH.md) for complete authentication documentation.

### Entity Management
- `GET /api/entities` - List all entities with optional filtering
  - Query params: `parentId`, `type`, `slug`, `title`, `limit`, `offset`
- `GET /api/entities/my` - Get entities created by authenticated user (requires auth)
- `GET /api/entities/children/:parentId` - Get child entities by parent ID  
- `GET /api/entities/by-slug/:slug` - Get entity by slug
- `GET /api/entities/slug` - Get root entity (slug: "/")
- `GET /api/entities/slug/*` - Get entity by slug path
- `GET /api/entities/:id` - Get entity by ID
- `POST /api/entities` - Create new entity (authentication optional)
- `PUT /api/entities/:id` - Update entity (requires auth + ownership)
- `DELETE /api/entities/:id` - Delete entity (requires auth + ownership)

### Relationship Management
- `GET /api/relationships` - Get all relationships with optional filtering
  - Query params: `predicate`, `creatorAddress`
- `GET /api/relationships/by-subject/:subjectId` - Get outgoing relationships from entity
  - Query params: `predicate` - filter by relationship type
- `GET /api/relationships/by-object/:objectId` - Get incoming relationships to entity
  - Query params: `predicate` - filter by relationship type
- `GET /api/entities/:parentId/children` - Get child entity IDs (using 'contains' relationships)
  - Query params: `expand=true` - return full entity objects instead of IDs
- `GET /api/entities/:childId/parent` - Get parent entity ID (using 'contains' relationships)
  - Query params: `expand=true` - return full entity object instead of ID
- `POST /api/relationships` - Create relationship between entities (requires auth)
  - Body: `{ subject, predicate, object, edge?, rank?, weight? }`
- `DELETE /api/relationships/:relationshipId` - Delete specific relationship (requires auth + ownership)
- `DELETE /api/entities/:entityId/relationships` - Delete all relationships for entity (requires auth + ownership)

### Query Examples

#### Basic Entity Queries
```bash
# Get all entities
curl http://localhost:8080/api/entities

# Get entities with pagination
curl "http://localhost:8080/api/entities?limit=10&offset=20"

# Get entity by ID
curl http://localhost:8080/api/entities/my-entity-id

# Get entity by slug
curl http://localhost:8080/api/entities/by-slug/my-slug
```

#### Relationship Queries
```bash
# Get all relationships
curl http://localhost:8080/api/relationships

# Get relationships of specific type
curl "http://localhost:8080/api/relationships?predicate=contains"

# Get children of a group (as IDs)
curl http://localhost:8080/api/entities/san-francisco/children

# Get children of a group (as full entities)
curl "http://localhost:8080/api/entities/san-francisco/children?expand=true"

# Get outgoing relationships from an entity
curl http://localhost:8080/api/relationships/by-subject/san-francisco

# Get incoming relationships to an entity
curl http://localhost:8080/api/relationships/by-object/restaurant-id
```

#### Authenticated Operations
```bash
# Create a relationship (requires authentication)
curl -X POST http://localhost:8080/api/relationships \
  -H "Authorization: Auth {\"type\":\"siwe\",\"message\":\"...\",\"signature\":\"...\",\"nonce\":\"...\"}" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "san-francisco-group-id",
    "predicate": "contains", 
    "object": "restaurant-id"
  }'

# Delete a relationship (requires auth + ownership)
curl -X DELETE http://localhost:8080/api/relationships/relationship-id \
  -H "Authorization: Auth {\"type\":\"siwe\",\"message\":\"...\",\"signature\":\"...\",\"nonce\":\"...\"}"
```

## Configuration

### Environment Variables

```bash
# Server configuration
PORT=8080
HOST=0.0.0.0
NODE_ENV=development

# Authentication (optional)
MAGIC_SECRET_KEY=sk_live_...

# Database
MONGODB_URI=mongodb://localhost:27017
MONGODB_NAME=social-appliance
MONGODB_COLLECTION=entities
```

### Docker Development

```bash
# Start MongoDB
docker compose up mongo -d

# Start the server
npm run dev
```

## API Reference

### Complete Endpoint List

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `GET` | `/` | No | Svelte web application |
| `GET` | `/api/health` | No | Health check with server status |
| `GET` | `/healthz` | No | Simple health check |
| `GET` | `/api/graphql` | No | GraphQL endpoint |
| `GET` | `/api/graphiql` | No | GraphQL playground (development) |
| **Authentication** | | | |
| `GET` | `/api/auth/nonce` | No | Get nonce for SIWE authentication |
| `POST` | `/api/auth/verify` | No | Verify authentication (SIWE/Magic.link) |
| `POST` | `/api/auth/test` | No | Test authentication with current credentials |
| `GET` | `/api/auth/status` | No | Check authentication status and available methods |
| **Entity Management** | | | |
| `GET` | `/api/entities` | No | List all entities with optional filtering |
| `GET` | `/api/entities/my` | Yes | Get entities created by authenticated user |
| `GET` | `/api/entities/children/:parentId` | No | Get child entities by parent ID |
| `GET` | `/api/entities/by-slug/:slug` | No | Get entity by slug |
| `GET` | `/api/entities/slug` | No | Get root entity (slug: "/") |
| `GET` | `/api/entities/slug/*` | No | Get entity by slug path |
| `GET` | `/api/entities/:id` | No | Get entity by ID |
| `POST` | `/api/entities` | Optional | Create new entity |
| `PUT` | `/api/entities/:id` | Yes | Update entity (requires ownership) |
| `DELETE` | `/api/entities/:id` | Yes | Delete entity (requires ownership) |
| **Relationship Management** | | | |
| `GET` | `/api/relationships` | No | Get all relationships with optional filtering |
| `GET` | `/api/relationships/by-subject/:subjectId` | No | Get outgoing relationships from entity |
| `GET` | `/api/relationships/by-object/:objectId` | No | Get incoming relationships to entity |
| `GET` | `/api/entities/:parentId/children` | No | Get child entity IDs (using 'contains' relationships) |
| `GET` | `/api/entities/:childId/parent` | No | Get parent entity ID (using 'contains' relationships) |
| `POST` | `/api/relationships` | Yes | Create relationship between entities |
| `DELETE` | `/api/relationships/:relationshipId` | Yes | Delete specific relationship (requires ownership) |
| `DELETE` | `/api/entities/:entityId/relationships` | Yes | Delete all relationships for entity (requires ownership) |

## Testing

```bash
# Test authentication system
npm run test:auth

# Test GraphQL integration  
npm run test:graphql

# Test complete auth integration
npm run test:auth:integration
```

## Architecture

The server integrates multiple packages:

- **@social/knowledge** - Data layer with MongoDB, spatial queries, validation
- **pino** - Structured logging

### GraphQL Schema

The server exposes the complete Knowledge package schema via GraphQL:

- Entity types: Thing, Party, Group, Edge
- Spatial queries: `entitiesNearby(location, maxDistance)`
- Temporal queries: `entitiesByTimeRange(timeRange)`
- Full introspection and playground support

### Authentication Flow

1. **SIWE**: Get nonce → Sign message → Verify signature
2. **Magic.link**: Get DID token → Verify with Magic service

All endpoints support authentication via:
- `Authorization: Bearer <token>` header
- `Authorization: Auth <json>` header  
- Request body `auth` field

## Documentation

- [AUTH.md](./AUTH.md) - Complete authentication guide
- [GraphQL Schema](http://localhost:8080/api/graphiql) - Interactive schema explorer
- [@social/knowledge](../knowledge/) - Data layer documentation
