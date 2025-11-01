
import { Logger } from '@social/logger'
import { Bus } from '@social/bus'
import { mongo_db, mongo_query } from './mongo-db.js'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

async function main() {
  Logger.info("🚀 Starting services layer tests")
  
  // Create a fresh bus instance
  const bus = new Bus()
  
  // Attach the database observers
  bus.observers.push(mongo_db as any)
  bus.observers.push(mongo_query as any)
  Logger.info("📦 Attached database observers to bus")
  
  // Run some brief tests
  Logger.info("🧪 Running database tests...")
  
  // Test 1: Create a simple entity
  await bus.event({
    kid: '', // will auto-generate
    name: 'Test Entity 1',
    type: 'test',
    data: { message: 'Hello from the database!', timestamp: new Date().toISOString() }
  })
  
  // Test 2: Create another entity with specific kid
  await bus.event({
    kid: 'test-entity-2',
    name: 'Test Entity 2', 
    type: 'test',
    data: { counter: 42, environment: 'test' }
  })
  
  // Test 3: Query all entities
  const allEntities = await bus.event({
    query: {} // empty query should match all
  })
  Logger.info(`📊 Database query returned ${allEntities?.length || 0} total entities`)
  
  // Test 4: Query test entities by type
  const testEntities = await bus.event({
    query: { type: 'test' }
  })
  Logger.info(`🔍 Found ${testEntities?.length || 0} test entities`)
  
  // Test 5: Update an entity
  await bus.event({
    kid: 'test-entity-2',
    data: { counter: 100, updated: true, lastModified: new Date().toISOString() }
  })
  
  // Test 6: Query the updated entity
  const updatedResults = await bus.event({
    query: { kid: 'test-entity-2' }
  })
  const updatedEntity = updatedResults?.[0]
  Logger.info(`✏️  Updated entity counter: ${updatedEntity?.data?.counter}`)
  Logger.info(`📅 Last modified: ${updatedEntity?.data?.lastModified}`)
  
  // Test 7: Query with nested data
  const counterEntities = await bus.event({
    query: { 'data.counter': 100 }
  })
  Logger.info(`🎯 Found ${counterEntities?.length || 0} entities with counter=100`)
  
  Logger.info("✅ All database tests completed successfully")
  Logger.info("🏁 Services layer ready - persistence layer active")
}

// Run the tests and exit
main().catch((error) => {
  Logger.error("❌ Database services test failed:", error)
  process.exit(1)
})
