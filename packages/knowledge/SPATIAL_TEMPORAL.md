# Spatial and Temporal Query Examples

## Spatial Queries

### Automatic GeoJSON Point Generation

When you create an entity with `location.lat` and `location.lon`, the system automatically generates a GeoJSON Point for MongoDB spatial indexing:

```javascript
import { Knowledge } from '@social/knowledge'

// Input: Simple lat/lon
await Knowledge.addEntity({
  id: 'coffee-shop',
  meta: { label: 'Blue Bottle Coffee' },
  location: {
    lat: 37.7749,
    lon: -122.4194,
    alt: 52  // Optional altitude
  },
  thing: { category: 'business' }
})

// Automatically generates location.point:
// {
//   type: "Point", 
//   coordinates: [-122.4194, 37.7749, 52]  // [lon, lat, alt]
// }
```

### Find Nearby Entities

```javascript
// Find entities within 10km of San Francisco
const nearby = await Knowledge.findNearby(37.7749, -122.4194, 10000)

// Find coffee shops within 5km
const nearbyCoffee = await Knowledge.findNearby(37.7749, -122.4194, 5000, {
  'thing.category': 'business',
  'meta.tags': 'coffee'
})
```

### Advanced Spatial Queries

```javascript
// Custom spatial query using MongoDB operators
const results = await Knowledge.queryEntities({
  $near: {
    lat: 37.7749,
    lon: -122.4194,
    maxDistance: 15000  // 15km
  },
  'thing.category': 'restaurant'
})

// Geo-within circular area
const inArea = await Knowledge.queryEntities({
  $geoWithin: {
    lat: 37.7749,
    lon: -122.4194,
    radius: 5000  // 5km radius
  }
})
```

## Temporal Queries

### Time Range Queries

```javascript
// Find events happening after a specific date
const futureEvents = await Knowledge.findByTimeRange({
  after: '2025-12-01T00:00:00Z'
})

// Find events that ended before a date
const pastEvents = await Knowledge.findByTimeRange({
  before: '2025-01-01T00:00:00Z'
})

// Find events active during a specific time
const activeEvents = await Knowledge.findByTimeRange({
  during: '2025-11-15T00:00:00Z'
})

// Complex time range - events between two dates
const rangeEvents = await Knowledge.findByTimeRange({
  after: '2025-01-01T00:00:00Z',
  before: '2025-12-31T23:59:59Z'
})
```

### Creating Time-Aware Entities

```javascript
await Knowledge.addEntity({
  id: 'conference-2025',
  meta: { label: 'Tech Conference 2025' },
  time: {
    begins: '2025-06-15T09:00:00Z',
    ends: '2025-06-17T18:00:00Z',
    duration: 'P3D'  // ISO 8601 duration (3 days)
  },
  thing: { category: 'event' }
})
```

## Pagination

### Large Result Sets

```javascript
// Get first 20 results
const page1 = await Knowledge.queryEntities({
  'thing.category': 'business',
  limit: 20,
  offset: 0
})

// Get next 20 results
const page2 = await Knowledge.queryEntities({
  'thing.category': 'business', 
  limit: 20,
  offset: 20
})

// Combine with spatial queries
const nearbyPage1 = await Knowledge.findNearby(37.7749, -122.4194, 10000, {
  limit: 10,
  offset: 0
})
```

## Combined Queries

### Spatial + Temporal + Pagination

```javascript
// Find recent events near San Francisco
const recentNearbyEvents = await Knowledge.queryEntities({
  $near: {
    lat: 37.7749,
    lon: -122.4194,
    maxDistance: 20000
  },
  $timeRange: {
    after: '2025-01-01T00:00:00Z'
  },
  'thing.category': 'event',
  limit: 25,
  offset: 0
})
```

### MongoDB Index Creation

The system automatically creates these indexes for optimal performance:

```javascript
// Spatial index for location queries
db.entities.createIndex({ "location.point": "2dsphere" })

// Temporal indexes
db.entities.createIndex({ "time.begins": 1 })
db.entities.createIndex({ "time.ends": 1 })

// Basic indexes
db.entities.createIndex({ id: 1 }, { unique: true })
db.entities.createIndex({ type: 1 })
```

## Query Performance Tips

1. **Use spatial indexes**: Always provide lat/lon for automatic GeoJSON point generation
2. **Time range optimization**: Use `begins` and `ends` fields for efficient temporal queries
3. **Pagination**: Always use `limit` for large result sets to avoid memory issues
4. **Combined filters**: Combine spatial, temporal, and entity filters in single queries for best performance
5. **Index-friendly queries**: Structure queries to use the available indexes (id, type, location.point, time fields)