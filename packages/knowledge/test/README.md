# Test Summary

## Available Tests

### `npm test`
Runs complete test suite with schema loading, validation, and spatial/temporal tests.

### `npm run test:schemas` 
Tests JSON schema loading from `schemas/base-schemas.json`:
- Verifies all 9 schemas load correctly
- Checks schema accessibility by name
- Validates schema structure

### `npm run test:validation`
Tests JSON schema validation functionality:
- Valid entity validation (thing, party, group, edge)
- Invalid entity rejection with error details
- Schema detection and error reporting

### `npm run test:spatial`
Tests spatial and temporal query functionality:
- GeoJSON Point auto-generation from lat/lon
- MongoDB 2dsphere spatial indexing
- Spatial queries ($near, distance-based)
- Temporal range queries (after, before, during)
- Pagination (limit, offset)

## Test Results

All tests passing:
- ✅ 9 schemas loaded (meta, time, location, address, stats, thing, party, group, edge)
- ✅ Valid entities pass validation
- ✅ Invalid entities properly rejected with detailed errors
- ✅ All entity types (thing, party, group, edge) validated correctly
- ✅ GeoJSON Point auto-generated from lat/lon coordinates  
- ✅ Spatial queries find nearby entities correctly
- ✅ Temporal queries filter by time ranges
- ✅ Pagination limit/offset working correctly

## Running Tests

```bash
# Full test suite
npm test

# Individual test suites
npm run test:schemas
npm run test:validation
npm run test:spatial
```

**Note:** Spatial/temporal tests require MongoDB running (uses Docker Compose).