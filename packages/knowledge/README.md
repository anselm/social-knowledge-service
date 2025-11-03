# Social Knowledge Server

## About

Entity management library with JSON schema validation for social artifacts (posts, people, places, things, collections). Supports SIWE authentication and MongoDB storage.

## Features

- **JSON Schema Validation** - Automatic validation using AJV with 9 core schemas
- **MongoDB Integration** - Direct operations without event bus dependency  
- **Entity Types** - thing, party, group, edge with shared meta/time/location/address/stats
- **SIWE Authentication** - Sign in With Ethereum (ERC-4361)
- **Structured Logging** - Uses Pino for fast, structured JSON logging
- **Spatial Queries** - GeoJSON Point auto-generation and MongoDB 2dsphere indexing
- **Temporal Queries** - Time range queries with automatic date parsing
- **Pagination** - Built-in limit/offset support for large result sets

## Quick Start

```javascript
import { Knowledge } from '@social/knowledge'

// Create entity with validation
await Knowledge.addEntity({
  meta: { label: 'My Cool Gadget' },
  location: { lat: 37.7749, lon: -122.4194 }, // Auto-generates GeoJSON point
  thing: { category: 'electronics' }
})

// Spatial queries - find nearby entities
const nearby = await Knowledge.findNearby(37.7749, -122.4194, 10000) // 10km radius

// Temporal queries - find events in time range
const activeEvents = await Knowledge.findByTimeRange({
  during: '2025-11-01T00:00:00Z'
})

// Pagination support
const results = await Knowledge.queryEntities({ 
  type: 'thing', 
  limit: 10, 
  offset: 20 
})

// Manual validation
const result = await Knowledge.validateEntity(entity)
```

## Configuration

### Environment Variables

- `LOG_LEVEL` - Set logging level (debug, info, warn, error). Default: 'info'
- `MONGO_URL` - MongoDB connection URL. Default: 'mongodb://localhost:27017'
- `MONGO_DB` - Database name. Default: 'social_knowledge_server'
- `FLUSH_DB` - Set to 'true' to clear database on startup

## Testing

```bash
npm test                # Run all tests
npm run test:schemas    # Test schema loading
npm run test:validation # Test validation logic
```

## Documentation

- [Design Document](20251102-DESIGN.md)
- [Schema Validation Guide](SCHEMA_VALIDATION.md)  
- [API Documentation](docs/)