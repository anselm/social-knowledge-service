# Edge Schema Migration - November 3, 2025

## Overview

Migrated edge entities from a simple flat structure to a richer, more consistent entity model that conforms to the general entity pattern used throughout the system.

## Schema Changes

### Before (Old Schema)
```json
{
  "id": "edge-id",
  "subject": "entity-1",
  "predicate": "contains", 
  "object": "entity-2",
  "rank": 1,
  "weight": 10,
  "time": { "begins": "2025-11-03T..." },
  "meta": { "creatorAddress": "0x..." }
}
```

### After (New Schema)
```json
{
  "id": "edge-id",
  "kind": "edge",
  "meta": {
    "label": "entity-1 contains entity-2",
    "created": "2025-11-03T...",
    "updated": "2025-11-03T...",
    "creatorAddress": "0x..."
  },
  "time": {
    "begins": "2025-11-03T..."
  },
  "relation": {
    "subject": "entity-1",
    "predicate": "contains",
    "object": "entity-2", 
    "rank": 1,
    "weight": 10
  }
}
```

## Key Changes

### 1. Standard Entity Structure
- Added `kind: "edge"` field for type identification
- Enhanced `meta` object with standard fields (`label`, `created`, `updated`)
- Relationship data moved to `relation` sub-object

### 2. Field Migrations
- `subject`, `predicate`, `object` → `relation.subject`, `relation.predicate`, `relation.object`
- `rank`, `weight` → `relation.rank`, `relation.weight`
- `meta.creatorAddress` preserved in same location
- `time` structure preserved

### 3. Schema Validation
- Updated edge detection in `mongo-manager.js`
- Changed from `entity.edge` to `entity.relation` or `entity.kind === 'edge'`
- Maintains backward compatibility during transition

## Code Updates

### Relationship Manager (`packages/knowledge/src/relationship-manager.js`)

#### Database Indexes
```javascript
// Old indexes
{ subject: 1 }
{ object: 1 }  
{ predicate: 1 }

// New indexes  
{ "relation.subject": 1 }
{ "relation.object": 1 }
{ "relation.predicate": 1 }
```

#### Query Patterns
```javascript
// Old queries
{ subject: subjectId }
{ object: objectId }

// New queries
{ "relation.subject": subjectId }
{ "relation.object": objectId }
```

#### Entity Creation
```javascript
// Old structure
{
  id,
  subject: data.subject,
  predicate: data.predicate,
  object: data.object
}

// New structure
{
  id,
  kind: "edge",
  meta: { 
    label: `${subject} ${predicate} ${object}`,
    created: timestamp,
    updated: timestamp 
  },
  relation: {
    subject: data.subject,
    predicate: data.predicate, 
    object: data.object
  }
}
```

### MongoDB Manager (`packages/knowledge/src/mongo-manager.js`)

#### Schema Detection
```javascript
// Old detection
else if (entity.edge) {
  schemaId = 'ka://schemas/core/edge/1.0.0'
}

// New detection  
else if (entity.relation || (entity.kind === 'edge')) {
  schemaId = 'ka://schemas/core/edge/1.0.0'
}
```

## API Compatibility

### Server Layer
The HTTP API layer continues to work unchanged:

```javascript
// POST /api/relationships still accepts:
{
  "subject": "entity-1",
  "predicate": "contains", 
  "object": "entity-2"
}

// But internally creates new edge structure
```

### Knowledge Layer
All public methods maintain same signatures:
- `Knowledge.createRelationship(subject, predicate, object, options)`
- `Knowledge.getRelationshipsBySubject(subjectId, predicate)`
- `Knowledge.getRelationshipsByObject(objectId, predicate)`

## Migration Notes

### Database Migration
Existing edges in old format will need migration:
```javascript
// Migration script needed to transform:
db.relationships.updateMany(
  { subject: { $exists: true } },
  [{
    $set: {
      kind: "edge",
      "meta.label": { $concat: ["$subject", " ", "$predicate", " ", "$object"] },
      "meta.created": "$time.begins", 
      "meta.updated": "$time.begins",
      relation: {
        subject: "$subject",
        predicate: "$predicate", 
        object: "$object",
        rank: "$rank",
        weight: "$weight"
      }
    },
    $unset: ["subject", "predicate", "object", "rank", "weight"]
  }]
)
```

### Testing Required
- Relationship creation and querying
- Edge validation against new schema
- Server API endpoints for relationships
- Parent/child hierarchies (`getChildren`, `getParent`)

## Benefits

1. **Consistency**: Edges now follow same entity pattern as parties, groups, things
2. **Metadata**: Automatic timestamp management and rich metadata support
3. **Extensibility**: Standard entity structure allows future enhancements
4. **Validation**: Proper schema validation with JSON Schema
5. **Separation**: Clear separation between entity metadata and relationship data

## Breaking Changes

### Internal APIs
- Direct database queries need field path updates
- Custom relationship processing code needs `relation.` prefix
- Schema validation logic updated

### External APIs  
- **No breaking changes** to REST endpoints
- **No breaking changes** to Knowledge class public methods
- Database indexes require rebuilding for performance

## Rollout Plan

1. ✅ Update schema definitions
2. ✅ Update relationship-manager.js  
3. ✅ Update mongo-manager.js validation
4. ✅ Verify compilation and builds
5. 🔄 Test with fresh database 
6. 🔄 Create migration script for existing data
7. 🔄 Update documentation and examples