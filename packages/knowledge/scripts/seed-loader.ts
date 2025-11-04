#!/usr/bin/env node

/**
 * Seed Data Loader
 * 
 * Loads seed data from packages/knowledge/seed-data/ directories
 * and creates entities in the Knowledge layer database.
 * 
 * Usage:
 *   npm run seed:load                    # Load all seed data
 *   npm run seed:load berkeley           # Load specific location
 *   npm run seed:load berkeley --force   # Force reload even if exists
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Knowledge } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SeedOptions {
  force?: boolean;
  location?: string;
  verbose?: boolean;
}

class SeedLoader {
  private options: SeedOptions;

  constructor(options: SeedOptions = {}) {
    this.options = {
      force: false,
      verbose: false,
      ...options
    };
  }

  /**
   * Initialize the Knowledge layer
   */
  async init() {
    console.log('🔌 Connecting to Knowledge layer...');
    await Knowledge._initialize();
    console.log('✅ Knowledge layer connected');
  }

  /**
   * Clean up and close connections
   */
  async cleanup() {
    // Knowledge layer uses static methods, no cleanup needed
    console.log('🔌 Knowledge layer cleanup complete');
  }

  /**
   * Find all seed data directories
   */
  findSeedDirectories(): string[] {
    const seedDataPath = path.join(__dirname, '../seed-data');
    
    if (!fs.existsSync(seedDataPath)) {
      console.log('📁 No seed-data directory found');
      return [];
    }

    const dirs = fs.readdirSync(seedDataPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    console.log(`📁 Found seed directories: ${dirs.join(', ')}`);
    return dirs;
  }

  /**
   * Load entities from a seed data file
   */
  async loadSeedFile(filePath: string): Promise<any[]> {
    try {
      const fileUrl = `file://${filePath}`;
      const module = await import(fileUrl);
      
      const entities: any[] = [];
      
      // Extract all exports that look like entities
      for (const [exportName, exportValue] of Object.entries(module)) {
        if (exportName === 'default') continue;
        
        if (Array.isArray(exportValue)) {
          // Array of entities
          entities.push(...exportValue);
        } else if (exportValue && typeof exportValue === 'object' && (exportValue as any).id) {
          // Single entity
          entities.push(exportValue);
        }
      }

      if (this.options.verbose) {
        console.log(`  📄 Loaded ${entities.length} entities from ${path.basename(filePath)}`);
      }

      return entities;
    } catch (error) {
      console.error(`❌ Failed to load ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Check if an entity already exists
   */
  async entityExists(entityId: string): Promise<boolean> {
    try {
      const result = await Knowledge.getEntityById(entityId);
      return !!result;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create or update an entity
   */
  async createEntity(entity: any): Promise<boolean> {
    try {
      // Check if entity already exists
      const exists = await this.entityExists(entity.id);
      
      if (exists && !this.options.force) {
        if (this.options.verbose) {
          console.log(`  ⏭️  Skipping existing entity: ${entity.id}`);
        }
        return true;
      }

      // Create or update the entity
      if (exists && this.options.force) {
        await Knowledge.updateEntity(entity.id, entity);
        console.log(`  🔄 Updated entity: ${entity.id}`);
      } else {
        await Knowledge.addEntity(entity);
        console.log(`  ✅ Created entity: ${entity.id}`);
      }

      return true;
    } catch (error) {
      console.error(`  ❌ Failed to create entity ${entity.id}:`, error);
      return false;
    }
  }

  /**
   * Create relationship edges
   */
  async createRelations(relations: any[]): Promise<void> {
    if (!relations || relations.length === 0) return;

    console.log(`🔗 Creating ${relations.length} relations...`);
    
    for (const relation of relations) {
      try {
        const exists = await this.entityExists(relation.id);
        
        if (exists && !this.options.force) {
          if (this.options.verbose) {
            console.log(`  ⏭️  Skipping existing relation: ${relation.id}`);
          }
          continue;
        }

        if (exists && this.options.force) {
          await Knowledge.updateEntity(relation.id, relation);
          console.log(`  🔄 Updated relation: ${relation.id}`);
        } else {
          await Knowledge.addEntity(relation);
          console.log(`  ✅ Created relation: ${relation.id}`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to create relation ${relation.id}:`, error);
      }
    }
  }

  /**
   * Load seed data from a specific location
   */
  async loadLocation(locationName: string): Promise<void> {
    // Always load root first when loading a specific location
    console.log('🏠 Ensuring root entity is loaded first...');
    await this.loadRootSeedFiles();
    
    const seedDir = path.join(__dirname, '../seed-data', locationName);
    const infoFile = path.join(seedDir, 'info.js');

    if (!fs.existsSync(infoFile)) {
      console.log(`📄 No info.js file found in ${locationName}`);
      return;
    }

    console.log(`🌱 Loading seed data for: ${locationName}`);
    
    const entities = await this.loadSeedFile(infoFile);
    
    if (entities.length === 0) {
      console.log(`  📄 No entities found in ${locationName}/info.js`);
      return;
    }

    // Separate entities from relations
    const regularEntities = entities.filter(e => e.kind !== 'edge');
    const relations = entities.filter(e => e.kind === 'edge');

    console.log(`  📊 Found ${regularEntities.length} entities and ${relations.length} relations`);

    // Create regular entities first
    let created = 0;
    for (const entity of regularEntities) {
      const success = await this.createEntity(entity);
      if (success) created++;
    }

    // Then create relations
    await this.createRelations(relations);

    console.log(`✅ Completed ${locationName}: ${created}/${regularEntities.length} entities created`);
  }

  /**
   * Load all seed data
   */
  async loadAll(): Promise<void> {
    // First load root-level seed files
    await this.loadRootSeedFiles();
    
    // Then load location-specific seed data
    const locations = this.findSeedDirectories();
    
    if (locations.length === 0) {
      console.log('📄 No seed data locations found');
    } else {
      for (const location of locations) {
        await this.loadLocation(location);
      }
    }
  }

  /**
   * Load root-level seed files (like root.info.js)
   */
  async loadRootSeedFiles(): Promise<void> {
    const seedDataPath = path.join(__dirname, '../seed-data');
    const rootInfoFile = path.join(seedDataPath, 'root.info.js');

    if (fs.existsSync(rootInfoFile)) {
      console.log('🌱 Loading root seed data');
      
      const entities = await this.loadSeedFile(rootInfoFile);
      
      if (entities.length === 0) {
        console.log('  📄 No entities found in root.info.js');
        return;
      }

      // Separate entities from relations
      const regularEntities = entities.filter(e => e.kind !== 'edge');
      const relations = entities.filter(e => e.kind === 'edge');

      console.log(`  📊 Found ${regularEntities.length} entities and ${relations.length} relations`);

      // Create regular entities first
      let created = 0;
      for (const entity of regularEntities) {
        const success = await this.createEntity(entity);
        if (success) created++;
      }

      // Then create relations
      await this.createRelations(relations);

      console.log(`✅ Completed root: ${created}/${regularEntities.length} entities created`);
    }
  }

  /**
   * Show statistics about current database
   */
  async showStats(): Promise<void> {
    try {
      const entities = await Knowledge.queryEntities({});
      console.log('\n📊 Current Database Statistics:');
      console.log(`  Total entities: ${entities.length}`);
      
      // Group by kind
      const kindCounts: Record<string, number> = {};
      for (const entity of entities) {
        const kind = entity.kind || 'unknown';
        kindCounts[kind] = (kindCounts[kind] || 0) + 1;
      }
      
      if (Object.keys(kindCounts).length > 0) {
        console.log('  By kind:');
        for (const [kind, count] of Object.entries(kindCounts)) {
          console.log(`    ${kind}: ${count}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to get database statistics:', error);
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): { options: SeedOptions & { statsOnly?: boolean }; locations: string[] } {
  const args = process.argv.slice(2);
  const options: SeedOptions & { statsOnly?: boolean } = {};
  const locations: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--stats' || arg === '-s') {
      options.statsOnly = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Seed Data Loader

Usage:
  npm run seed:load                         # Load all seed data (root + all locations)
  npm run seed:load berkeley                # Load root + berkeley
  npm run seed:load berkeley portland       # Load root + multiple locations
  npm run seed:load berkeley --force        # Force reload even if exists
  npm run seed:stats                        # Show database statistics only

Options:
  --force, -f    Force reload entities even if they exist
  --verbose, -v  Show detailed logging
  --stats, -s    Show database statistics only (no loading)
  --help, -h     Show this help message

Examples:
  npm run seed:all                         # Load everything
  npm run seed:root                        # Load only root entity from seed data
  npm run seed:berkeley                    # Load root + berkeley
  npm run seed:location berkeley portland  # Load root + multiple locations
`);
      process.exit(0);
    } else {
      locations.push(arg);
    }
  }

  return { options, locations };
}

/**
 * Main function
 */
async function main() {
  const { options, locations } = parseArgs();
  
  console.log('🌱 Social Knowledge Seed Loader');
  console.log(`⚙️  Options: ${JSON.stringify(options)}`);
  if (locations.length > 0) {
    console.log(`📍 Locations: ${locations.join(', ')}`);
  }
  
  const loader = new SeedLoader(options);
  
  try {
    await loader.init();
    
    if (options.statsOnly) {
      await loader.showStats();
    } else if (locations.length > 0) {
      // Load specific locations (root will be loaded automatically)
      for (const location of locations) {
        await loader.loadLocation(location);
      }
      await loader.showStats();
    } else {
      // Load all seed data
      await loader.loadAll();
      await loader.showStats();
    }
    
  } catch (error) {
    console.error('❌ Seed loading failed:', error);
    process.exit(1);
  } finally {
    await loader.cleanup();
  }
  
  console.log('🎉 Seed loading completed!');
  process.exit(0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { SeedLoader };