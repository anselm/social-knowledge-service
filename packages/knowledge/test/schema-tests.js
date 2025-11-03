#!/usr/bin/env node

import { schemaManager } from '../src/schema-manager.js'

console.log('🧪 Testing JSON Schema Loading...')

async function testSchemaLoading() {
  try {
    // Initialize schema manager
    await schemaManager.initialize()
    
    // Get all loaded schema IDs
    const schemaIds = schemaManager.getSchemaIds()
    console.log(`✅ Loaded ${schemaIds.length} schemas:`, schemaIds)
    
    // Test that specific schemas are loaded
    const expectedSchemas = ['meta', 'time', 'location', 'address', 'stats', 'thing', 'party', 'group', 'edge']
    
    for (const schemaName of expectedSchemas) {
      const schema = schemaManager.getSchema(schemaName)
      if (schema) {
        console.log(`✅ Schema '${schemaName}' loaded correctly`)
      } else {
        throw new Error(`❌ Schema '${schemaName}' not found`)
      }
    }
    
    console.log('🎉 All schema tests passed!')
    return true
    
  } catch (error) {
    console.error('❌ Schema test failed:', error.message)
    return false
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testSchemaLoading().then(success => {
    process.exit(success ? 0 : 1)
  })
}

export { testSchemaLoading }