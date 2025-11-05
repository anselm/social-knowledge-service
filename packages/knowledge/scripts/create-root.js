import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file in monorepo root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { Knowledge } from '../dist/knowledge.js';

async function createRootEntity() {
  try {
    await Knowledge._initialize();
    console.log('🔍 Checking for existing root entity...');
    
    // Check if root already exists
    const existing = await Knowledge.queryEntities({ 'meta.slug': '/' });
    if (existing.length > 0) {
      console.log('✅ Root entity already exists:', existing[0].id);
      return;
    }
    
    console.log('📝 Loading root entity from seed-data/root.info.js...');
    
    // Load the root entity from the actual seed file
    const rootSeedFile = path.join(__dirname, '../seed-data/root.info.js');
    const fileUrl = `file://${rootSeedFile}`;
    const module = await import(fileUrl);
    
    if (!module.root) {
      throw new Error('No root export found in root.info.js');
    }
    
    const rootEntity = module.root;
    console.log('📋 Loaded root entity:', rootEntity.meta?.label);
    
    await Knowledge.addEntity(rootEntity);
    console.log('✅ Root entity created successfully from seed data');
    
    // Verify it was created
    const verification = await Knowledge.queryEntities({ 'meta.slug': '/' });
    console.log('🔍 Verification - found entities with slug "/":', verification.length);
    
  } catch (error) {
    console.error('❌ Failed to create root entity:', error.message);
    console.error(error);
  }
}

createRootEntity().then(() => {
  console.log('✅ Root entity setup complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});