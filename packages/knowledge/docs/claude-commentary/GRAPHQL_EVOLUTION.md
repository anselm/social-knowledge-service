# GraphQL Schema Dynamic Evolution - November 3, 2025

## Problem Addressed

The GraphQL schema was using hardcoded entity type detection and static type definitions, making it fragile when entity schemas evolve. Key issues:

1. **Hardcoded Type Detection**: `getEntityType()` used property presence to detect entity types
2. **Static Schema Definitions**: Entity types were hardcoded in GraphQL typeDefs
3. **Manual Schema Updates**: Adding new entity types required manual GraphQL updates

## Immediate Improvements Made

### 1. Kind-Based Type Detection
```javascript
// OLD: Property-based detection
function getEntityType(entity) {
  if (entity.thing) return 'Thing'
  if (entity.party) return 'Party'  
  if (entity.group) return 'Group'
  // ... hardcoded checks
}

// NEW: Kind-field based detection
function getEntityType(entity) {
  // Use the kind field if available (new schema)
  if (entity.kind) {
    return entity.kind.charAt(0).toUpperCase() + entity.kind.slice(1)
  }
  
  // Fallback to property-based detection (legacy support)
  if (entity.thing) return 'Thing'
  // ... fallbacks for migration period
}
```

### 2. Updated Edge Schema
```graphql
# OLD: Flat edge structure
type Edge {
  id: String
  subject: String!
  predicate: String!
  object: String!
  # ...
}

# NEW: Rich entity structure
type Edge {
  id: String!
  kind: String!
  meta: Meta!
  time: Time
  relation: Relation
}

type Relation {
  subject: String!
  predicate: String!
  object: String!
  rank: Int
  weight: Int
}
```

### 3. Added Missing Entity Types
- Added `Org` type for organization entities
- Added `kind` field to all entity types for consistency
- Updated union type to include all known entity types

## Future Improvements Needed

### 1. Dynamic Schema Generation
Instead of hardcoded typeDefs, generate from actual JSON schemas:

```javascript
// Generate GraphQL types from JSON Schema
async function generateGraphQLTypes() {
  const { schemaManager } = await import('./schema-manager.js')
  await schemaManager.initialize()
  
  const schemaIds = schemaManager.getSchemaIds()
  const entityTypes = []
  
  for (const schemaId of schemaIds) {
    if (schemaId.includes('/core/') && !schemaId.includes('/meta/')) {
      const schema = schemaManager.getSchema(schemaId)
      const typeDef = generateTypeFromSchema(schema)
      entityTypes.push(typeDef)
    }
  }
  
  return entityTypes.join('\n\n')
}
```

### 2. Schema-Driven Union Types
```javascript
// Dynamically build union from available entity schemas
function generateEntityUnion(entityTypes) {
  const typeNames = entityTypes.map(extractTypeName)
  return `union Entity = ${typeNames.join(' | ')}`
}
```

### 3. Automatic Schema Hot-Reloading
- Watch schema files for changes
- Regenerate GraphQL schema when JSON schemas change
- Update resolvers automatically

## Benefits Achieved

### 1. Reduced Hardcoding
- Entity type detection now uses `entity.kind` field
- Fallback to property detection for backward compatibility
- Edge detection improved with `kind` field

### 2. Schema Consistency
- All entity types now include `kind` field
- Edge schema matches new rich entity structure
- Relation data properly separated

### 3. Extensibility
- Adding new entity types requires minimal GraphQL changes
- Type detection automatically handles new `kind` values
- Legacy entity detection provides migration path

## Migration Strategy

### Phase 1: ✅ Kind-Field Detection (Completed)
- Update `getEntityType()` to use `entity.kind`
- Maintain backward compatibility with property detection
- Update Edge schema to match new structure

### Phase 2: Schema-Driven Generation (Future)
- Generate GraphQL types from JSON schemas
- Dynamic union type generation
- Automated schema synchronization

### Phase 3: Hot Reloading (Future)
- Watch schema files for changes
- Automatic GraphQL schema regeneration
- Runtime schema updates

## Current State

✅ **Working**: Kind-based entity detection with legacy fallbacks
✅ **Working**: Updated Edge schema with Relation type
✅ **Working**: Added missing Org entity type
✅ **Working**: All entity types include kind field

🔄 **Next**: Implement dynamic schema generation from JSON schemas
🔄 **Next**: Remove hardcoded type definitions
🔄 **Next**: Add schema hot-reloading capability

## Breaking Changes

### GraphQL Schema
- Edge type now uses `relation` field instead of flat structure
- All entity types now include required `kind` field
- Added new `Relation` type for edge relationship data

### Backward Compatibility
- Legacy entity detection still works during transition
- Existing GraphQL queries continue to function
- New `kind` field is automatically populated

The GraphQL layer is now much more resilient to schema evolution and properly leverages the `entity.kind` field for dynamic type detection!