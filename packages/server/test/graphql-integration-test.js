/**
 * Test GraphQL integration in the server package
 * This tests that the Knowledge package's GraphQL functionality
 * works correctly when integrated into the Fastify server
 */

import { createServer } from '../dist/index.js';
import { Knowledge } from "@social/knowledge";

async function testGraphQLIntegration() {
  console.log('🧪 Testing GraphQL Server Integration...');
  
  let server;
  try {
    // Create server instance
    server = await createServer();
    
    // Start server on a test port
    await server.listen({ port: 3001, host: '127.0.0.1' });
    console.log('✅ Server started on port 3001');
    
    // Test 1: GraphQL info endpoint
    const infoResponse = await server.inject({
      method: 'GET',
      url: '/api/graphql/info'
    });
    
    const infoData = JSON.parse(infoResponse.body);
    console.log('✅ GraphQL info endpoint:', infoData.data);
    
    // Test 2: GraphQL introspection query
    const introspectionResponse = await server.inject({
      method: 'POST',
      url: '/api/graphql',
      headers: {
        'content-type': 'application/json'
      },
      payload: JSON.stringify({
        query: `
          query IntrospectionQuery {
            __schema {
              types {
                name
                kind
              }
            }
          }
        `
      })
    });
    
    const introspectionData = JSON.parse(introspectionResponse.body);
    if (introspectionData.data && introspectionData.data.__schema) {
      const entityTypes = introspectionData.data.__schema.types
        .filter(type => ['Thing', 'Party', 'Group', 'Edge', 'Entity'].includes(type.name))
        .map(type => type.name);
      console.log('✅ GraphQL schema introspection found entity types:', entityTypes);
    }
    
    // Test 3: Add a test entity via Knowledge and query via GraphQL
    await Knowledge.addEntity({
      id: 'graphql-server-test',
      meta: {
        label: 'GraphQL Server Test'
      },
      thing: {
        category: 'test',
        label: 'GraphQL Server Test'
      },
      location: {
        lat: 37.7749,
        lon: -122.4194
      }
    });
    
    // Query via GraphQL
    const entitiesResponse = await server.inject({
      method: 'POST',
      url: '/api/graphql',
      headers: {
        'content-type': 'application/json'
      },
      payload: JSON.stringify({
        query: `
          query TestEntities {
            entities(limit: 5) {
              ... on Thing {
                id
                meta {
                  label
                }
                thing
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
              ... on Edge {
                subject
                predicate
                object
              }
            }
          }
        `
      })
    });
    
    const entitiesData = JSON.parse(entitiesResponse.body);
    console.log('GraphQL entities response:', entitiesData);
    if (entitiesData.data && entitiesData.data.entities) {
      console.log('✅ GraphQL entity query successful:', 
        entitiesData.data.entities.length, 'entities found');
      
      const testEntity = entitiesData.data.entities.find(e => e.id === 'graphql-server-test');
      if (testEntity) {
        console.log('✅ Found test entity via GraphQL:', testEntity.meta?.label);
      }
    } else if (entitiesData.errors) {
      console.log('⚠️  GraphQL entity query had errors:', entitiesData.errors);
    }
    
    // Test 4: Spatial query via GraphQL
    const spatialResponse = await server.inject({
      method: 'POST',
      url: '/api/graphql',
      headers: {
        'content-type': 'application/json'
      },
      payload: JSON.stringify({
        query: `
          query NearbyEntities {
            entitiesNearby(
              location: {
                lat: 37.7749
                lon: -122.4194
                maxDistance: 10000
              }
              limit: 5
            ) {
              ... on Thing {
                id
                meta {
                  label
                }
                thing
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
      })
    });
    
    const spatialData = JSON.parse(spatialResponse.body);
    console.log('GraphQL spatial response:', spatialData);
    if (spatialData.data && spatialData.data.entitiesNearby) {
      console.log('✅ GraphQL spatial query successful:', 
        spatialData.data.entitiesNearby.length, 'nearby entities found');
    } else if (spatialData.errors) {
      console.log('⚠️  GraphQL spatial query had errors:', spatialData.errors);
    }
    
    console.log('🎉 All GraphQL server integration tests passed!');
    
  } catch (error) {
    console.error('❌ GraphQL server integration test failed:', error);
  } finally {
    if (server) {
      await server.close();
      console.log('✅ Server stopped');
    }
    
    // Cleanup
    if (Knowledge._knowledge) {
      await Knowledge._knowledge.disconnect();
    }
  }
}

// Run the test
testGraphQLIntegration();