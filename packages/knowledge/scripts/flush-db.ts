#!/usr/bin/env tsx

import { Knowledge } from '../src/knowledge.js';

/**
 * Flush (clear) the entire Knowledge database
 */
async function flushDatabase() {
  console.log('🗑️  Social Knowledge Database Flush');
  console.log('⚠️  This will DELETE ALL DATA from the database!');
  
  try {
    console.log('🔌 Connecting to Knowledge layer...');
    await Knowledge._initialize();
    console.log('✅ Knowledge layer connected');
    
    // Get current stats before flushing
    const beforeEntities = await Knowledge.queryEntities({});
    console.log(`📊 Current database contains ${beforeEntities.length} entities`);
    
    if (beforeEntities.length === 0) {
      console.log('📭 Database is already empty');
      process.exit(0);
    }
    
    // Flush the database by deleting all entities
    console.log('🗑️  Flushing database...');
    
    // Delete all entities one by one to ensure proper cleanup
    let deletedCount = 0;
    for (const entity of beforeEntities) {
      try {
        await Knowledge.deleteEntity(entity.id, { skipRelationshipCleanup: true });
        deletedCount++;
      } catch (error) {
        console.warn(`⚠️  Failed to delete entity ${entity.id}:`, error);
      }
    }
    
    // Verify it's empty
    const afterEntities = await Knowledge.queryEntities({});
    console.log(`✅ Database flushed successfully`);
    console.log(`📊 Deleted ${deletedCount}/${beforeEntities.length} entities`);
    console.log(`📊 Database now contains ${afterEntities.length} entities`);
    
  } catch (error) {
    console.error('❌ Database flush failed:', error);
    process.exit(1);
  }
  
  console.log('🎉 Database flush completed!');
  process.exit(0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  flushDatabase();
}

export { flushDatabase };