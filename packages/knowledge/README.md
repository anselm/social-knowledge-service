# Social Knowledge Server

## About

Entity management library with JSON schema validation for social artifacts (posts, people, places, things, collections). Supports SIWE authentication and MongoDB storage.

Refer to the ongoing thoughts around [DESIGN](DESIGN.md) here.

## Features

- **JSON Schema Validation** - Automatic validation using AJV with several core schemas
- **MongoDB Integration** - Direct operations without event bus dependency  
- **Entity Types** - thing, party, group, edge...
- **Spatial Queries** - GeoJSON Point auto-generation and MongoDB 2dsphere indexing
- **Temporal Queries** - Time range queries with automatic date parsing
- **Pagination** - Built-in limit/offset support for large result sets

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

## General usage

```javascript
import { Knowledge } from '@social/knowledge'

// Create entity with validation
await Knowledge.addEntity({
  meta: { label: 'My Cool Gadget', props: { vendor:'alibaba' } },
  location: { lat: 37.7749, lon: -122.4194 }
})

// Update existing entity
await Knowledge.addEntity({
  id: 'existing-entity-id',
  meta: { label: 'Updated Gadget' }
})

// Spatial queries - find nearby entities
const nearby = await Knowledge.findNearby(37.7749, -122.4194, 10000)

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

// Validation
const result = await Knowledge.validateEntity(entity)

// Create entity
await Knowledge.addEntity({ 
  meta: { 
    label: 'My Entity',
    creatorAddress: '0x123...'
  }
})

// Update entity (5 minutes later)
await Knowledge.addEntity({ 
  id: 'entity-id',
  meta: { 
    label: 'Updated Entity',
    creatorAddress: '0x123...'
  }
})
```

