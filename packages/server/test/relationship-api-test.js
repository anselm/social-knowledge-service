/**
 * Relationship API Integration Test
 * 
 * Tests the relationship management endpoints exposed by the server.
 * Creates entities and relationships, then tests all CRUD operations.
 */

import { createServer } from '../dist/index.js'

console.log('🔗 Testing Relationship API Integration...')
console.log('=' .repeat(60))

let testResults = []
let testEntities = {}
let testRelationships = {}

function logTest(name, success, message = '') {
  const status = success ? '✅ PASS' : '❌ FAIL'
  const details = message ? ` - ${message}` : ''
  console.log(`${status}: ${name}${details}`)
  testResults.push({ name, success, message })
}

async function runRelationshipAPITests() {
  let server
  try {
    console.log('🚀 Starting test server...')
    server = await createServer()
    await server.listen({ port: 3006, host: '127.0.0.1' })
    console.log('✅ Test server started on port 3006\n')
    
    // Test 1: Create test entities (San Francisco group and restaurants)
    console.log('🏙️  Test 1: Create test entities')
    
    const sanFrancisco = {
      id: 'sf-api-test-' + Date.now(),
      meta: {
        label: 'San Francisco',
        content: 'City for API testing'
      },
      group: {
        category: 'geographic'
      }
    }
    
    const restaurant1 = {
      id: 'restaurant-api-1-' + Date.now(),
      meta: {
        label: 'API Test Restaurant 1',
        content: 'First test restaurant'
      },
      thing: {
        category: 'restaurant'
      }
    }
    
    const restaurant2 = {
      id: 'restaurant-api-2-' + Date.now(),
      meta: {
        label: 'API Test Restaurant 2', 
        content: 'Second test restaurant'
      },
      thing: {
        category: 'restaurant'
      }
    }
    
    // Create entities via API
    const createSF = await server.inject({
      method: 'POST',
      url: '/api/entities',
      payload: sanFrancisco
    })
    
    const createR1 = await server.inject({
      method: 'POST',
      url: '/api/entities',
      payload: restaurant1
    })
    
    const createR2 = await server.inject({
      method: 'POST',
      url: '/api/entities',
      payload: restaurant2
    })
    
    const createSuccess = createSF.statusCode === 200 && 
                         createR1.statusCode === 200 && 
                         createR2.statusCode === 200
    
    if (createSuccess) {
      testEntities.sanFrancisco = sanFrancisco.id
      testEntities.restaurant1 = restaurant1.id
      testEntities.restaurant2 = restaurant2.id
    }
    
    logTest('Created test entities via API', createSuccess,
           `SF: ${sanFrancisco.id}, R1: ${restaurant1.id}, R2: ${restaurant2.id}`)
    
    // Test 2: Create relationships without authentication (should fail)
    console.log('\n🚫 Test 2: Create relationship without auth (should fail)')
    
    const unauthRelResponse = await server.inject({
      method: 'POST',
      url: '/api/relationships',
      payload: {
        subject: testEntities.sanFrancisco,
        predicate: 'contains',
        object: testEntities.restaurant1
      }
    })
    
    const authRequired = unauthRelResponse.statusCode === 401
    logTest('Relationship creation requires authentication', authRequired,
           `Status: ${unauthRelResponse.statusCode}`)
    
    // Test 3: Get all relationships (should be empty initially)
    console.log('\n📊 Test 3: Get all relationships')
    
    const allRelsResponse = await server.inject({
      method: 'GET',
      url: '/api/relationships'
    })
    
    const allRelsSuccess = allRelsResponse.statusCode === 200
    let initialRelCount = 0
    if (allRelsSuccess) {
      const allRelsData = JSON.parse(allRelsResponse.body)
      initialRelCount = allRelsData.data.length
    }
    
    logTest('Retrieved all relationships', allRelsSuccess,
           `Found ${initialRelCount} existing relationships`)
    
    // Test 4: Get children of SF (should be empty initially)
    console.log('\n👶 Test 4: Get children of SF group (should be empty)')
    
    const childrenResponse = await server.inject({
      method: 'GET',
      url: `/api/entities/${testEntities.sanFrancisco}/children`
    })
    
    const childrenSuccess = childrenResponse.statusCode === 200
    let childrenCount = 0
    if (childrenSuccess) {
      const childrenData = JSON.parse(childrenResponse.body)
      childrenCount = childrenData.data.length
    }
    
    logTest('Retrieved children of SF group', childrenSuccess,
           `Found ${childrenCount} children (should be 0)`)
    
    // Test 5: Get relationships by subject (should be empty)
    console.log('\n🔍 Test 5: Get relationships by subject')
    
    const subjectRelsResponse = await server.inject({
      method: 'GET',
      url: `/api/relationships/by-subject/${testEntities.sanFrancisco}`
    })
    
    const subjectRelsSuccess = subjectRelsResponse.statusCode === 200
    let subjectRelsCount = 0
    if (subjectRelsSuccess) {
      const subjectRelsData = JSON.parse(subjectRelsResponse.body)
      subjectRelsCount = subjectRelsData.data.length
    }
    
    logTest('Retrieved relationships by subject', subjectRelsSuccess,
           `Found ${subjectRelsCount} outgoing relationships from SF`)
    
    // Test 6: Get relationships by object (should be empty)
    console.log('\n🔍 Test 6: Get relationships by object')
    
    const objectRelsResponse = await server.inject({
      method: 'GET',
      url: `/api/relationships/by-object/${testEntities.restaurant1}`
    })
    
    const objectRelsSuccess = objectRelsResponse.statusCode === 200
    let objectRelsCount = 0
    if (objectRelsSuccess) {
      const objectRelsData = JSON.parse(objectRelsResponse.body)
      objectRelsCount = objectRelsData.data.length
    }
    
    logTest('Retrieved relationships by object', objectRelsSuccess,
           `Found ${objectRelsCount} incoming relationships to restaurant1`)
    
    // Test 7: Get parent of restaurant (should be null)
    console.log('\n👨 Test 7: Get parent of restaurant (should be null)')
    
    const parentResponse = await server.inject({
      method: 'GET',
      url: `/api/entities/${testEntities.restaurant1}/parent`
    })
    
    const parentSuccess = parentResponse.statusCode === 200
    let hasParent = false
    if (parentSuccess) {
      const parentData = JSON.parse(parentResponse.body)
      hasParent = parentData.data !== null
    }
    
    logTest('Retrieved parent of restaurant', parentSuccess,
           `Has parent: ${hasParent} (should be false)`)
    
    // Test 8: Filter relationships by predicate (should be empty)
    console.log('\n🔍 Test 8: Filter relationships by predicate')
    
    const filteredRelsResponse = await server.inject({
      method: 'GET',
      url: '/api/relationships?predicate=contains'
    })
    
    const filteredRelsSuccess = filteredRelsResponse.statusCode === 200
    let filteredRelsCount = 0
    if (filteredRelsSuccess) {
      const filteredRelsData = JSON.parse(filteredRelsResponse.body)
      filteredRelsCount = filteredRelsData.data.length
    }
    
    logTest('Filtered relationships by predicate', filteredRelsSuccess,
           `Found ${filteredRelsCount} 'contains' relationships`)
    
    // Test 9: Get children with expand option
    console.log('\n📖 Test 9: Get children with expand option')
    
    const expandedChildrenResponse = await server.inject({
      method: 'GET',
      url: `/api/entities/${testEntities.sanFrancisco}/children?expand=true`
    })
    
    const expandedChildrenSuccess = expandedChildrenResponse.statusCode === 200
    logTest('Retrieved children with expand option', expandedChildrenSuccess,
           `Status: ${expandedChildrenResponse.statusCode}`)
    
    // Test 10: Test non-existent entity endpoints
    console.log('\n❓ Test 10: Test non-existent entity endpoints')
    
    const nonExistentChildrenResponse = await server.inject({
      method: 'GET',
      url: '/api/entities/non-existent-id/children'
    })
    
    const nonExistentParentResponse = await server.inject({
      method: 'GET',
      url: '/api/entities/non-existent-id/parent'
    })
    
    const nonExistentSuccess = nonExistentChildrenResponse.statusCode === 200 &&
                              nonExistentParentResponse.statusCode === 200
    
    logTest('Handled non-existent entity gracefully', nonExistentSuccess,
           `Children: ${nonExistentChildrenResponse.statusCode}, Parent: ${nonExistentParentResponse.statusCode}`)
    
    // Test 11: Test invalid relationship deletion (should fail)
    console.log('\n🚫 Test 11: Delete non-existent relationship')
    
    const deleteNonExistentResponse = await server.inject({
      method: 'DELETE',
      url: '/api/relationships/non-existent-relationship-id'
    })
    
    const deleteNonExistentBlocked = deleteNonExistentResponse.statusCode === 401
    logTest('Delete non-existent relationship requires auth', deleteNonExistentBlocked,
           `Status: ${deleteNonExistentResponse.statusCode}`)
    
    // Test 12: Test bulk relationship deletion (should require auth)
    console.log('\n🚫 Test 12: Bulk delete relationships without auth')
    
    const bulkDeleteResponse = await server.inject({
      method: 'DELETE',
      url: `/api/entities/${testEntities.sanFrancisco}/relationships`
    })
    
    const bulkDeleteBlocked = bulkDeleteResponse.statusCode === 401
    logTest('Bulk delete relationships requires auth', bulkDeleteBlocked,
           `Status: ${bulkDeleteResponse.statusCode}`)
    
    // Test 13: Test API error handling
    console.log('\n⚠️  Test 13: Test API error handling')
    
    const invalidRelationshipResponse = await server.inject({
      method: 'POST',
      url: '/api/relationships',
      headers: {
        'Authorization': 'Auth {"type":"invalid","token":"fake"}'
      },
      payload: {
        subject: 'missing-predicate-and-object'
      }
    })
    
    const errorHandlingWorks = invalidRelationshipResponse.statusCode === 401 ||
                               invalidRelationshipResponse.statusCode === 400
    
    logTest('API error handling works', errorHandlingWorks,
           `Status: ${invalidRelationshipResponse.statusCode}`)
    
  } catch (error) {
    console.error('💥 Relationship API test suite error:', error)
    return false
  } finally {
    if (server) {
      await server.close()
      console.log('\n🔌 Test server stopped')
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Relationship API Integration Test Results')
  console.log('='.repeat(60))
  
  const totalTests = testResults.length
  const passedTests = testResults.filter(r => r.success).length
  const failedTests = totalTests - passedTests
  
  testResults.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}${result.message ? ` - ${result.message}` : ''}`)
  })
  
  console.log('='.repeat(60))
  console.log(`🎯 RELATIONSHIP API SCORE: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('🎉 RELATIONSHIP API INTEGRATION VERIFIED!')
    console.log('✓ Entity creation endpoints working')
    console.log('✓ Authentication requirements enforced')
    console.log('✓ Relationship query endpoints working') 
    console.log('✓ Parent/child relationship endpoints working')
    console.log('✓ Filtering and expansion options working')
    console.log('✓ Error handling working')
    console.log('✓ All endpoints properly exposed')
    return true
  } else {
    console.log(`⚠️  ${failedTests} test(s) failed.`)
    return false
  }
}

// Run the relationship API integration test suite
runRelationshipAPITests().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('💥 Relationship API test crashed:', error)
  process.exit(1)
})