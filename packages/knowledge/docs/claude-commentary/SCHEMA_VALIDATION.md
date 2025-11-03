# Knowledge Package - JSON Schema Validation

The Knowledge package now includes comprehensive JSON schema validation using AJV. All entities are automatically validated against their respective schemas before being saved to MongoDB.

## Available Schemas

The package includes the following core schemas:

- **meta** - Basic entity metadata (label, slug, content, tags, etc.)
- **time** - Temporal information (begins, ends, duration)
- **location** - Geographic coordinates (lat, lon, alt, rad)
- **address** - Human-readable address information
- **stats** - Analytics and computed metrics
- **thing** - Non-living entities (objects, items, etc.)
- **party** - Living entities (humans, animals, AI agents)
- **group** - Collections (folders, playlists, communities)
- **edge** - Relationships between entities

## Usage Examples

### Basic Entity Creation with Validation

```javascript
import { Knowledge } from '@social/knowledge'

// Create a valid thing entity
const validThing = {
  id: 'my-cool-gadget',
  meta: {
    label: 'My Cool Gadget',
    content: 'A really useful device'
  },
  thing: {
    category: 'electronics',
    brand: 'TechCorp'
  }
}

// This will validate against the thing schema automatically
await Knowledge.addEntity(validThing)
```

### Manual Validation

```javascript
import { Knowledge } from '@social/knowledge'

const entity = {
  id: 'test-entity',
  meta: {
    // Missing required 'label' field - will fail validation
  },
  thing: {
    category: 'test'
  }
}

// Check validation without saving
const result = await Knowledge.validateEntity(entity)
if (!result.valid) {
  console.log('Validation errors:', result.errors)
  // Output: [{ message: "must have required property 'label'" }]
}
```

### Skipping Validation

```javascript
import { Knowledge } from '@social/knowledge'

// Sometimes you might want to save without validation
const entity = {
  id: 'legacy-data',
  someOldFormat: 'that doesn\'t match schemas'
}

// Skip validation by setting validate: false
await Knowledge.addEntity(entity, { validate: false })
```

### Using Schema Manager Directly

```javascript
import { schemaManager } from '@social/knowledge'

// Initialize if not already done
await schemaManager.initialize()

// Get all available schema IDs
const schemaIds = schemaManager.getSchemaIds()
console.log('Available schemas:', schemaIds)

// Validate against a specific schema
const result = schemaManager.validate('ka://schemas/core/party/1.0.0', {
  id: 'john-doe',
  meta: {
    label: 'John Doe'
  },
  party: {
    firstName: 'John',
    lastName: 'Doe'
  }
})

console.log('Valid:', result.valid)
if (!result.valid) {
  console.log('Errors:', result.errors)
}
```

### Entity Types and Schema Detection

The system automatically determines which schema to validate against:

1. **Explicit type field**: If `entity.type` is set, uses `ka://schemas/core/{type}/1.0.0`
2. **Structure-based detection**:
   - Contains `thing` property → thing schema
   - Contains `party` property → party schema  
   - Contains `group` property → group schema
   - Contains `subject`, `predicate`, `object` → edge schema

### Common Schema Properties

All entity schemas share these common optional properties:

- `id` - Unique identifier (auto-generated if not provided)
- `meta` - Basic metadata (label is required)
- `time` - Temporal information
- `address` - Human-readable address
- `location` - Geographic coordinates
- `stats` - Analytics and metrics

### Error Handling

Validation errors are thrown during save operations:

```javascript
try {
  await Knowledge.addEntity(invalidEntity)
} catch (error) {
  console.log('Validation failed:', error.message)
  // Handle validation error appropriately
}
```

### Schema File Location

Schemas are defined in `/packages/knowledge/schemas/base-schemas.json` and are automatically loaded during initialization.

## Configuration

The schema validation system is configured with:

- **AJV v8** with format support
- **Strict mode disabled** for flexibility
- **All errors reported** for comprehensive feedback
- **Meta-schema validation disabled** for compatibility

Schema validation runs automatically on all entity save operations unless explicitly disabled.