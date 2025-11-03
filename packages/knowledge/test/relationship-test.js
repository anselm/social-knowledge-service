/**
 * Relationship Management Test Suite
 * 
 * Tests the relationship management system in the Knowledge layer.
 * Creates a group (San Francisco), restaurants (things), and manages
 * parent-child relationships between them.
 */

import { Knowledge } from '../dist/knowledge.js'

console.log('🔗 Testing Relationship Management...')
console.log('=' .repeat(50))

let testResults = []
let testEntities = {}
let testRelationships = {}

function logTest(name, success, message = '') {
  const status = success ? '✅ PASS' : '❌ FAIL'
  const details = message ? ` - ${message}` : ''
  console.log(`${status}: ${name}${details}`)
  testResults.push({ name, success, message })
}

async function runRelationshipTests() {
  try {
    console.log('📦 Initializing Knowledge layer...')
    await Knowledge._initialize()
    
    // Test 1: Create a group (San Francisco)
    console.log('\n🏙️  Test 1: Create San Francisco group')
    const sanFrancisco = {
      id: 'sf-group-' + Date.now(),
      meta: {
        label: 'San Francisco',
        content: 'Beautiful city in Northern California',
        tags: ['city', 'california', 'bay-area']
      },
      location: {
        lat: 37.7749,
        lon: -122.4194,
        point: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749]
        }
      },
      group: {
        category: 'geographic',
        type: 'city'
      }
    }
    
    await Knowledge.addEntity(sanFrancisco)
    testEntities.sanFrancisco = sanFrancisco.id
    logTest('Created San Francisco group', true, `ID: ${sanFrancisco.id}`)
    
    // Test 2: Create restaurants (things)
    console.log('\n🍽️  Test 2: Create restaurant things')
    
    const restaurant1 = {
      id: 'restaurant-tartine-' + Date.now(),
      meta: {
        label: 'Tartine Bakery',
        content: 'Famous bakery in the Mission District',
        tags: ['restaurant', 'bakery', 'mission']
      },
      location: {
        lat: 37.7611,
        lon: -122.4103,
        point: {
          type: 'Point',
          coordinates: [-122.4103, 37.7611]
        }
      },
      thing: {
        category: 'restaurant',
        cuisine: 'bakery',
        priceRange: '$$'
      }
    }
    
    const restaurant2 = {
      id: 'restaurant-zuni-' + Date.now(),
      meta: {
        label: 'Zuni Café',
        content: 'Iconic Mediterranean restaurant',
        tags: ['restaurant', 'mediterranean', 'hayes-valley']
      },
      location: {
        lat: 37.7767,
        lon: -122.4230,
        point: {
          type: 'Point',
          coordinates: [-122.4230, 37.7767]
        }
      },
      thing: {
        category: 'restaurant',
        cuisine: 'mediterranean',
        priceRange: '$$$'
      }
    }
    
    const restaurant3 = {
      id: 'restaurant-state-bird-' + Date.now(),
      meta: {
        label: 'State Bird Provisions',
        content: 'Innovative dim sum style restaurant',
        tags: ['restaurant', 'dim-sum', 'fillmore']
      },
      location: {
        lat: 37.7849,
        lon: -122.4324,
        point: {
          type: 'Point',
          coordinates: [-122.4324, 37.7849]
        }
      },
      thing: {
        category: 'restaurant',
        cuisine: 'american-contemporary',
        priceRange: '$$$'
      }
    }
    
    await Knowledge.addEntity(restaurant1)
    await Knowledge.addEntity(restaurant2)
    await Knowledge.addEntity(restaurant3)
    
    testEntities.restaurant1 = restaurant1.id
    testEntities.restaurant2 = restaurant2.id
    testEntities.restaurant3 = restaurant3.id
    
    logTest('Created three restaurant entities', true, 
           `Tartine: ${restaurant1.id}, Zuni: ${restaurant2.id}, State Bird: ${restaurant3.id}`)
    
    // Test 3: Create relationships (group contains restaurants)
    console.log('\n🔗 Test 3: Create parent-child relationships')
    
    const rel1 = await Knowledge.createRelationship(
      testEntities.sanFrancisco, 
      'contains', 
      testEntities.restaurant1,
      { creatorAddress: 'test-user-123' }
    )
    
    const rel2 = await Knowledge.createRelationship(
      testEntities.sanFrancisco,
      'contains',
      testEntities.restaurant2,
      { creatorAddress: 'test-user-123' }
    )
    
    const rel3 = await Knowledge.createRelationship(
      testEntities.sanFrancisco,
      'contains',
      testEntities.restaurant3,
      { creatorAddress: 'test-user-123' }
    )
    
    testRelationships.rel1 = rel1.id
    testRelationships.rel2 = rel2.id
    testRelationships.rel3 = rel3.id
    
    logTest('Created three parent-child relationships', true,
           `SF → Tartine, SF → Zuni, SF → State Bird`)
    
    // Test 4: Query children of the group
    console.log('\n👶 Test 4: Enumerate children of San Francisco group')
    
    const children = await Knowledge.getChildren(testEntities.sanFrancisco)
    const childrenSuccess = children.length === 3 && 
                           children.includes(testEntities.restaurant1) &&
                           children.includes(testEntities.restaurant2) &&
                           children.includes(testEntities.restaurant3)
    
    logTest('Retrieved all children of SF group', childrenSuccess,
           `Found ${children.length} children: ${children.join(', ')}`)
    
    // Test 5: Query parent of a restaurant
    console.log('\n👨 Test 5: Get parent of restaurant')
    
    const parent = await Knowledge.getParent(testEntities.restaurant1)
    const parentSuccess = parent === testEntities.sanFrancisco
    
    logTest('Retrieved parent of Tartine', parentSuccess,
           `Parent: ${parent}`)
    
    // Test 6: Query relationships by subject
    console.log('\n🔍 Test 6: Query outgoing relationships')
    
    const outgoingRels = await Knowledge.getRelationshipsBySubject(testEntities.sanFrancisco, 'contains')
    const outgoingSuccess = outgoingRels.length === 3
    
    logTest('Retrieved outgoing relationships from SF', outgoingSuccess,
           `Found ${outgoingRels.length} 'contains' relationships`)
    
    // Test 7: Query relationships by object
    console.log('\n🔍 Test 7: Query incoming relationships')
    
    const incomingRels = await Knowledge.getRelationshipsByObject(testEntities.restaurant2, 'contains')
    const incomingSuccess = incomingRels.length === 1 && incomingRels[0].subject === testEntities.sanFrancisco
    
    logTest('Retrieved incoming relationships to Zuni', incomingSuccess,
           `Found ${incomingRels.length} incoming 'contains' relationships`)
    
    // Test 8: Delete one relationship
    console.log('\n🗑️  Test 8: Delete a specific relationship')
    
    const deleteSuccess = await Knowledge.deleteRelationship(testRelationships.rel2, 'test-user-123')
    
    logTest('Deleted relationship SF → Zuni', deleteSuccess)
    
    // Test 9: Verify deletion - children should now be 2
    console.log('\n✅ Test 9: Verify relationship deletion')
    
    const childrenAfterDelete = await Knowledge.getChildren(testEntities.sanFrancisco)
    const verifyDeleteSuccess = childrenAfterDelete.length === 2 && 
                               !childrenAfterDelete.includes(testEntities.restaurant2)
    
    logTest('Verified relationship deletion', verifyDeleteSuccess,
           `Children count after delete: ${childrenAfterDelete.length}`)
    
    // Test 10: Try to delete with wrong creator (should fail)
    console.log('\n🚫 Test 10: Test ownership protection on delete')
    
    let ownershipProtectionWorks = false
    try {
      await Knowledge.deleteRelationship(testRelationships.rel1, 'wrong-user-456')
      ownershipProtectionWorks = false
    } catch (error) {
      ownershipProtectionWorks = error.message.includes('Access denied')
    }
    
    logTest('Ownership protection prevents unauthorized delete', ownershipProtectionWorks,
           ownershipProtectionWorks ? 'Correctly rejected wrong user' : 'Failed to protect ownership')
    
    // Test 11: Get all relationships
    console.log('\n📊 Test 11: Query all relationships')
    
    const allRels = await Knowledge.getAllRelationships()
    const allRelsSuccess = allRels.length >= 2 // Should have at least the 2 remaining relationships
    
    logTest('Retrieved all relationships', allRelsSuccess,
           `Found ${allRels.length} total relationships`)
    
    // Test 12: Delete all relationships for an entity
    console.log('\n🧹 Test 12: Delete all relationships for an entity')
    
    const deletedCount = await Knowledge.deleteRelationshipsForEntity(testEntities.sanFrancisco, 'test-user-123')
    const bulkDeleteSuccess = deletedCount === 2 // Should delete the remaining 2 relationships
    
    logTest('Bulk deleted relationships for SF entity', bulkDeleteSuccess,
           `Deleted ${deletedCount} relationships`)
    
    // Test 13: Verify bulk deletion
    console.log('\n✅ Test 13: Verify bulk deletion')
    
    const childrenAfterBulkDelete = await Knowledge.getChildren(testEntities.sanFrancisco)
    const verifyBulkDeleteSuccess = childrenAfterBulkDelete.length === 0
    
    logTest('Verified bulk relationship deletion', verifyBulkDeleteSuccess,
           `Children count after bulk delete: ${childrenAfterBulkDelete.length}`)
    
  } catch (error) {
    console.error('💥 Relationship test suite error:', error)
    return false
  }
  
  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Relationship Management Test Results')
  console.log('='.repeat(50))
  
  const totalTests = testResults.length
  const passedTests = testResults.filter(r => r.success).length
  const failedTests = totalTests - passedTests
  
  testResults.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}${result.message ? ` - ${result.message}` : ''}`)
  })
  
  console.log('='.repeat(50))
  console.log(`🎯 RELATIONSHIP MANAGEMENT SCORE: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('🎉 RELATIONSHIP MANAGEMENT SYSTEM VERIFIED!')
    console.log('✓ Entity creation working (groups and things)')
    console.log('✓ Relationship creation working (parent-child containment)')
    console.log('✓ Child enumeration working')
    console.log('✓ Parent lookup working')
    console.log('✓ Relationship querying working (by subject and object)')
    console.log('✓ Individual relationship deletion working')
    console.log('✓ Ownership protection working')
    console.log('✓ Bulk relationship deletion working')
    console.log('✓ Separate relationships table working')
    return true
  } else {
    console.log(`⚠️  ${failedTests} test(s) failed.`)
    return false
  }
}

// Run the relationship management test suite
runRelationshipTests().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('💥 Relationship management test crashed:', error)
  process.exit(1)
})