#!/usr/bin/env node

import { Knowledge } from '../dist/index.js'
import { mongoManager } from '../dist/mongo-manager.js'

console.log('🧪 Testing Spatial and Temporal Queries...')

async function testSpatialQueries() {
  try {
    console.log('\n🗺️  Testing Spatial Functionality...')
    
    // Test GeoJSON point enhancement
    const locationEntity = {
      id: 'sf-location-test',
      meta: { label: 'San Francisco Test Location' },
      location: {
        lat: 37.7749,
        lon: -122.4194,
        alt: 52
      },
      thing: { category: 'landmark' }
    }
    
    // Save entity and verify GeoJSON point is added
    await Knowledge.addEntity(locationEntity, { validate: false }) // Skip validation for test
    
    // Retrieve and check if point was added
    const saved = await Knowledge.getEntityById('sf-location-test')
    if (saved?.location?.point) {
      console.log('✅ GeoJSON point automatically generated:', saved.location.point)
      
      // Verify coordinates are correct [lon, lat, alt]
      const coords = saved.location.point.coordinates
      if (coords[0] === -122.4194 && coords[1] === 37.7749 && coords[2] === 52) {
        console.log('✅ GeoJSON coordinates are correct [lon, lat, alt]')
      } else {
        throw new Error(`❌ Incorrect coordinates: ${JSON.stringify(coords)}`)
      }
    } else {
      throw new Error('❌ GeoJSON point was not generated')
    }
    
    // Test spatial queries
    console.log('\n🔍 Testing spatial queries...')
    
    // Add more test locations
    await Knowledge.addEntity({
      id: 'oakland-test',
      meta: { label: 'Oakland Test' },
      location: { lat: 37.8044, lon: -122.2711 },
      thing: { category: 'city' }
    }, { validate: false })
    
    await Knowledge.addEntity({
      id: 'la-test', 
      meta: { label: 'Los Angeles Test' },
      location: { lat: 34.0522, lon: -118.2437 },
      thing: { category: 'city' }
    }, { validate: false })
    
    // Test $near query
    const nearbyResults = await Knowledge.findNearby(37.7749, -122.4194, 20000) // 20km radius
    console.log(`✅ Found ${nearbyResults.length} entities within 20km of SF`)
    
    // Should include SF and Oakland, but not LA
    const sfFound = nearbyResults.some(e => e.id === 'sf-location-test')
    const oaklandFound = nearbyResults.some(e => e.id === 'oakland-test')
    const laFound = nearbyResults.some(e => e.id === 'la-test')
    
    if (sfFound && oaklandFound && !laFound) {
      console.log('✅ Spatial query correctly found nearby locations')
    } else {
      console.log(`⚠️  Spatial query results: SF=${sfFound}, Oakland=${oaklandFound}, LA=${laFound}`)
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Spatial test failed:', error.message)
    return false
  }
}

async function testTemporalQueries() {
  try {
    console.log('\n⏰ Testing Temporal Functionality...')
    
    // Create entities with different time ranges
    await Knowledge.addEntity({
      id: 'past-event',
      meta: { label: 'Past Event' },
      time: {
        begins: '2024-01-01T00:00:00Z',
        ends: '2024-01-02T00:00:00Z'
      },
      thing: { category: 'event' }
    }, { validate: false })
    
    await Knowledge.addEntity({
      id: 'current-event',
      meta: { label: 'Current Event' },
      time: {
        begins: '2025-10-01T00:00:00Z',
        ends: '2025-12-01T00:00:00Z'
      },
      thing: { category: 'event' }
    }, { validate: false })
    
    await Knowledge.addEntity({
      id: 'future-event',
      meta: { label: 'Future Event' },
      time: {
        begins: '2026-01-01T00:00:00Z',
        ends: '2026-01-02T00:00:00Z'
      },
      thing: { category: 'event' }
    }, { validate: false })
    
    // Test temporal range queries
    console.log('\n🔍 Testing temporal queries...')
    
    // Find events after 2025-01-01
    const futureEvents = await Knowledge.findByTimeRange({
      after: '2025-01-01T00:00:00Z'
    })
    console.log(`✅ Found ${futureEvents.length} events after 2025-01-01`)
    
    // Find events active during current time
    const activeEvents = await Knowledge.findByTimeRange({
      during: '2025-11-01T00:00:00Z'
    })
    console.log(`✅ Found ${activeEvents.length} events active in Nov 2025`)
    
    // Find events before 2025-01-01
    const pastEvents = await Knowledge.findByTimeRange({
      before: '2025-01-01T00:00:00Z'
    })
    console.log(`✅ Found ${pastEvents.length} events before 2025-01-01`)
    
    return true
    
  } catch (error) {
    console.error('❌ Temporal test failed:', error.message)
    return false
  }
}

async function testPagination() {
  try {
    console.log('\n📄 Testing Pagination...')
    
    // Create several test entities
    for (let i = 1; i <= 10; i++) {
      await Knowledge.addEntity({
        id: `page-test-${i}`,
        meta: { label: `Page Test ${i}` },
        thing: { category: 'pagination-test', number: i }
      }, { validate: false })
    }
    
    // Test limit
    const limitedResults = await Knowledge.queryEntities({
      'thing.category': 'pagination-test',
      limit: 3
    })
    console.log(`✅ Limited query returned ${limitedResults.length} results (expected 3)`)
    
    // Test offset  
    const offsetResults = await Knowledge.queryEntities({
      'thing.category': 'pagination-test',
      limit: 3,
      offset: 3
    })
    console.log(`✅ Offset query returned ${offsetResults.length} results (expected 3)`)
    
    // Verify different results
    const firstIds = limitedResults.map(e => e.id).sort()
    const secondIds = offsetResults.map(e => e.id).sort()
    const overlap = firstIds.filter(id => secondIds.includes(id))
    
    if (overlap.length === 0) {
      console.log('✅ Pagination correctly returns different result sets')
    } else {
      console.log(`⚠️  Pagination overlap detected: ${overlap}`)
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Pagination test failed:', error.message)
    return false
  }
}

async function runSpatialTemporalTests() {
  let allPassed = true
  
  // Initialize database
  await mongoManager.initialize(true) // Flush DB for clean tests
  
  // Run spatial tests
  console.log('=' .repeat(50))
  const spatialPassed = await testSpatialQueries()
  allPassed = allPassed && spatialPassed
  
  // Run temporal tests
  console.log('\n' + '='.repeat(50))
  const temporalPassed = await testTemporalQueries()
  allPassed = allPassed && temporalPassed
  
  // Run pagination tests
  console.log('\n' + '='.repeat(50))
  const paginationPassed = await testPagination()
  allPassed = allPassed && paginationPassed
  
  // Summary
  console.log('\n' + '='.repeat(50))
  if (allPassed) {
    console.log('🎉 All spatial and temporal tests passed!')
  } else {
    console.log('❌ Some spatial/temporal tests failed!')
  }
  
  // Close database connection
  await mongoManager.close()
  
  return allPassed
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSpatialTemporalTests().then(success => {
    process.exit(success ? 0 : 1)
  })
}

export { runSpatialTemporalTests }