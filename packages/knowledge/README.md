# Social Knowledge Service 

## About

A pure entity management library with JSON schema validation for social artifacts (posts, people, places, things, collections). Supports SIWE authentication and MongoDB storage.

Refer to the ongoing thoughts around [DESIGN](DESIGN.md) here.

## Features

- **JSON Schema Validation** - Automatic validation using AJV with several core schemas
- **MongoDB Integration** - Direct operations without event bus dependency  
- **Entity Types** - thing, party, group, edge...
- **Spatial Queries** - GeoJSON Point auto-generation and MongoDB 2dsphere indexing
- **Temporal Queries** - Time range queries with automatic date parsing
- **Pagination** - Built-in limit/offset support for large result sets
- **SIWE** - Authentication using Sign in with Ethereum or Magic.link
- **Serverless** - A pure library used by a separate server

## Configuration

Environment variables are loaded from the monorepo root `.env` file. Key variables:
- `MONGODB_URI` - MongoDB Atlas connection string 
- `LOG_LEVEL` - Logging verbosity (trace, debug, info, warn, error)

## Seeding Data 🌱

**Critical for development**: The Knowledge layer requires seed data to function properly. Always run seeding commands after fresh database setup.

### Quick Start
```bash
# From Knowledge package directory
npm run seed:root     # Create essential root entity (always run first)
npm run seed:berkeley # Load Berkeley sample data (22 posts + relationships)

# Or from monorepo root
npm run seed:berkeley # Runs Knowledge seeding from any directory
```

### Available Seed Commands
- `seed:root` - Creates the essential root entity (`/`) - **always run this first**
- `seed:berkeley` - Loads sample Berkeley-area posts and relationships 
- `seed:all` - Loads all available seed data
- `seed:force` - Force reload even if data exists
- `seed:stats` - Show database statistics after seeding

### Why Seeding Matters
- **Root entity required**: The `/` entity serves as the hierarchical root for all content
- **Development data**: Provides realistic sample data for UI testing
- **Relationship structure**: Demonstrates parent-child relationships and spatial data
- **Atlas connection**: All seed commands now properly connect to MongoDB Atlas

**Pro tip**: Run `npm run seed:berkeley` after any database reset to get a fully functional development environment.

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

