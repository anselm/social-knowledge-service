#!/usr/bin/env node

import { graphql } from 'graphql'
import { knowledgeSchema } from '../dist/graphql-schema.js'
import { mongoManager } from '../dist/mongo-manager.js'

console.log('🧪 Testing GraphQL Schema...')

async function testGraphQLSchema() {
  try {
    // Initialize database
    await mongoManager.initialize(true) // Flush DB for clean tests
    
    console.log('\n📊 Testing GraphQL introspection...')
    
    // Test schema introspection
    const introspectionQuery = `
      query {
        entitySchemas
      }
    `
    
    const introspectionResult = await graphql({
      schema: knowledgeSchema,
      source: introspectionQuery
    })
    
    if (introspectionResult.errors) {
      throw new Error(`Introspection failed: ${introspectionResult.errors.map(e => e.message).join(', ')}`)
    }
    
    console.log('✅ Schema introspection successful:', introspectionResult.data.entitySchemas)
    
    console.log('\n🗺️  Testing spatial queries via GraphQL...')
    
    // Create test entities via GraphQL-like data (but using Knowledge API for setup)
    const { Knowledge } = await import('../dist/index.js')
    
    await Knowledge.addEntity({
      id: 'graphql-test-sf',
      meta: { label: 'SF GraphQL Test' },
      location: { lat: 37.7749, lon: -122.4194 },
      thing: { category: 'test-location' }
    }, { validate: false })
    
    // Test GraphQL spatial query
    const spatialQuery = `
      query {
        entitiesNearby(
          location: { lat: 37.7749, lon: -122.4194, maxDistance: 10000 }
          limit: 5
        ) {
          __typename
          ... on Thing {
            id
            meta {
              label
            }
            location {
              lat
              lon
              point {
                type
                coordinates
              }
            }
          }
        }
      }
    `
    
    const spatialResult = await graphql({
      schema: knowledgeSchema,
      source: spatialQuery
    })
    
    if (spatialResult.errors) {
      throw new Error(`Spatial query failed: ${spatialResult.errors.map(e => e.message).join(', ')}`)
    }
    
    console.log('✅ GraphQL spatial query successful:')
    console.log('   Found entities:', spatialResult.data.entitiesNearby.length)
    console.log('   First entity:', spatialResult.data.entitiesNearby[0]?.meta?.label)
    
    console.log('\n⏰ Testing temporal queries via GraphQL...')
    
    // Create test event
    await Knowledge.addEntity({
      id: 'graphql-test-event',
      meta: { label: 'GraphQL Test Event' },
      time: {
        begins: '2025-11-01T00:00:00Z',
        ends: '2025-11-30T23:59:59Z'
      },
      thing: { category: 'test-event' }
    }, { validate: false })
    
    // Test GraphQL temporal query
    const temporalQuery = `
      query {
        entitiesByTimeRange(
          timeRange: { during: "2025-11-15T12:00:00Z" }
          limit: 5
        ) {
          __typename
          ... on Thing {
            id
            meta {
              label
            }
            time {
              begins
              ends
            }
          }
        }
      }
    `
    
    const temporalResult = await graphql({
      schema: knowledgeSchema,
      source: temporalQuery
    })
    
    if (temporalResult.errors) {
      throw new Error(`Temporal query failed: ${temporalResult.errors.map(e => e.message).join(', ')}`)
    }
    
    console.log('✅ GraphQL temporal query successful:')
    console.log('   Found entities:', temporalResult.data.entitiesByTimeRange.length)
    console.log('   First event:', temporalResult.data.entitiesByTimeRange[0]?.meta?.label)
    
    console.log('\n🔍 Testing basic entity queries...')
    
    // Test basic entity query
    const entityQuery = `
      query {
        entities(limit: 3) {
          __typename
          ... on Thing {
            id
            meta {
              label
            }
          }
          ... on Party {
            id
            meta {
              label
            }
          }
          ... on Group {
            id
            meta {
              label
            }
          }
        }
      }
    `
    
    const entityResult = await graphql({
      schema: knowledgeSchema,
      source: entityQuery
    })
    
    if (entityResult.errors) {
      throw new Error(`Entity query failed: ${entityResult.errors.map(e => e.message).join(', ')}`)
    }
    
    console.log('✅ GraphQL entity query successful:')
    console.log('   Found entities:', entityResult.data.entities.length)
    entityResult.data.entities.forEach(entity => {
      console.log(`   - ${entity.__typename}: ${entity.meta.label}`)
    })
    
    return true
    
  } catch (error) {
    console.error('❌ GraphQL test failed:', error.message)
    return false
  } finally {
    // Close database connection
    await mongoManager.close()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testGraphQLSchema().then(success => {
    process.exit(success ? 0 : 1)
  })
}

export { testGraphQLSchema }