import fs from 'fs'
import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { pathToFileURL } from 'url';
import { Logger } from '@social/basic';

export class SeedLoader {
  constructor(bus) {
    if (!bus) {
      throw new Error('SeedLoader requires a bus instance to be provided');
    }
    this.bus = bus;
    this.loadedEntities = [];
  }

  async loadSeedDataRecurse(seedDataPath) {
    if (!fs.existsSync(seedDataPath)) {
      Logger.error(`Seed data directory NOT found at: ${seedDataPath}`);
      Logger.info('Current directory contents:');
      try {
        const cwdFiles = await readdir(process.cwd());
        Logger.info(`  ${cwdFiles.join(', ')}`);
      } catch (e) {
        Logger.error('Could not read current directory');
      }
      return
    }

    Logger.info('🌱 Seed data directory found! Loading seed data...');

    try {
      const files = await readdir(seedDataPath);
      Logger.info(`Seed data directory contains ${files.length} files/folders: ${files.join(', ')}`);
      
      // Look for info.js files recursively
      const infoFiles = [];
      async function findInfoFiles(dir) {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory()) {
            await findInfoFiles(fullPath);
          } else if (entry.name === 'info.js' || entry.name.endsWith('.info.js')) {
            infoFiles.push(fullPath);
          }
        }
      }
      await findInfoFiles(seedDataPath);
      Logger.info(`Found ${infoFiles.length} info.js files`);
      
      if (infoFiles.length > 0) {
        await this.loadSeedData(seedDataPath);
        Logger.info('🌱 Seed data loaded successfully');
        
        // Verify root entity was created
        const rootEntities = await this.bus.event({ 
          filter: 'query', 
          query: { slug: '/' } 
        });
        if (rootEntities && rootEntities.length > 0) {
          Logger.info(`✅ Root entity verified: ${rootEntities[0].id}`);
        } else {
          Logger.warn('⚠️  Root entity not found after seed data load');
        }
      } else {
        Logger.warn('No info.js files found in seed data directory');
      }
    } catch (seedError) {
      Logger.error('Failed to load seed data:', seedError);
      Logger.error('Stack trace:', seedError.stack);
    }
  }

  async loadSeedData(folderPath) {
    Logger.info(`🌱 Loading seed data from: ${folderPath}`);
    
    try {
      const files = await this.scanForInfoFiles(folderPath);
      
      if (files.length === 0) {
        Logger.warn('No info.js files found in seed data folder');
        return;
      }
      
      Logger.info(`Found ${files.length} seed files to process`);
      
      for (const file of files) {
        await this.processFile(file);
      }
      
      Logger.info('🌱 Seed data loading complete');
      this.printEntityTree();
    } catch (error) {
      Logger.error('Error loading seed data:', error);
    }
  }

  async scanForInfoFiles(folderPath, files = []) {
    try {
      const entries = await readdir(folderPath);
      
      for (const entry of entries) {
        const fullPath = join(folderPath, entry);
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          await this.scanForInfoFiles(fullPath, files);
        } else if (stats.isFile() && (entry === 'info.js' || entry.endsWith('.info.js'))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      Logger.warn(`Could not read directory ${folderPath}:`, error);
    }
    
    return files;
  }

  async processFile(filePath) {
    try {
      Logger.debug(`Processing file: ${filePath}`);
      
      // Convert to file URL for dynamic import
      const fileUrl = pathToFileURL(filePath).href;
      const module = await import(fileUrl);
      
      // Process all exports (including default)
      for (const [key, value] of Object.entries(module)) {
        await this.processExport(value, filePath, key);
      }
    } catch (error) {
      Logger.error(`Error processing ${filePath}:`, error);
    }
  }

  async processExport(data, filePath, exportName = 'default') {
    if (Array.isArray(data)) {
      for (const entity of data) {
        await this.processEntity(entity, filePath);
      }
    } else if (data && typeof data === 'object') {
      await this.processEntity(data, filePath);
    }
  }

  async processEntity(entity, filePath) {
    // Check if entity has an ID
    if (!entity.id) {
      Logger.warn(`Skipping entity without ID in ${filePath}`);
      return;
    }
    
    try {
      // Ensure parent exists if specified
      if (entity.parentId) {
        await this.ensureParentExists(entity.parentId);
      }
      
      // Check if entity already exists
      const existing = await this.findExistingEntity(entity);
      
      if (existing) {
        await this.updateExistingEntity(existing, entity);
      } else {
        await this.createNewEntity(entity);
      }
    } catch (error) {
      Logger.error(`Error processing entity ${entity.id}:`, error);
    }
  }

  async ensureParentExists(parentId) {
    const existingParents = await this.bus.event({ 
      filter: 'query', 
      query: { id: parentId } 
    });
    
    if (!existingParents || existingParents.length === 0) {
      // Create placeholder parent
      await this.bus.event({
        id: parentId,
        type: 'group',
        title: `Placeholder for ${parentId}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      Logger.info(`Created placeholder parent: ${parentId}`);
    }
  }

  async findExistingEntity(entity) {
    // Special handling for root entity - check by slug first
    if (entity.slug === '/' && entity.type === 'group') {
      const existing = await this.bus.event({ 
        filter: 'query', 
        query: { slug: '/' } 
      });
      if (existing && existing.length > 0 && existing[0].id !== entity.id) {
        Logger.warn(`Root entity exists with different ID. Existing: ${existing[0].id}, New: ${entity.id}`);
        return existing[0];
      }
    }
    
    // Check by id
    const existingById = await this.bus.event({ 
      filter: 'query', 
      query: { id: entity.id } 
    });
    
    return existingById && existingById.length > 0 ? existingById[0] : null;
  }

  async updateExistingEntity(existing, entity) {
    const updateId = existing.id;
    
    // Merge the new data with existing entity
    const mergedEntity = { ...existing, ...entity, id: updateId };
    
    await this.bus.event(mergedEntity);
    
    this.loadedEntities.push({
      id: updateId,
      slug: entity.slug || existing.slug,
      type: entity.type || existing.type,
      title: entity.title || existing.title,
      parentId: entity.parentId || existing.parentId,
      action: 'updated'
    });
    
    Logger.info(`Updated entity: ${updateId}`);
  }

  async createNewEntity(entity) {
    // Check slug uniqueness if slug provided
    if (entity.slug) {
      const existingSlug = await this.bus.event({ 
        filter: 'query', 
        query: { slug: entity.slug } 
      });
      if (existingSlug && existingSlug.length > 0) {
        Logger.warn(`Slug already exists: ${entity.slug}, skipping`);
        return;
      }
    }
    
    // Set timestamps if not provided
    entity.createdAt = entity.createdAt || new Date().toISOString();
    entity.updatedAt = entity.updatedAt || new Date().toISOString();
    
    // Send entity to bus for creation
    await this.bus.event(entity);
    
    this.loadedEntities.push({
      id: entity.id,
      slug: entity.slug,
      type: entity.type,
      title: entity.title,
      parentId: entity.parentId,
      action: 'created'
    });
    
    Logger.info(`Created entity: ${entity.id}`);
  }

  printEntityTree() {
    Logger.info('\n📊 Loaded Entity Tree:');
    console.log('─────────────────────\n');
    
    // Build a map of entities by ID
    const entityMap = new Map();
    const rootEntities = [];
    
    this.loadedEntities.forEach(entity => {
      entityMap.set(entity.id, { ...entity, children: [] });
    });
    
        // Build parent-child relationships
    this.loadedEntities.forEach(entity => {
      const entityId = entity.id;
      if (entity.parentId && entityMap.has(entity.parentId)) {
        entityMap.get(entity.parentId).children.push(entityId);
      } else if (!entity.parentId) {
        rootEntities.push(entityId);
      }
    });
    
    // Print tree recursively
    const printEntity = (id, indent = '') => {
      const entity = entityMap.get(id);
      if (!entity) return;
      
      const marker = entity.action === 'created' ? '✨' : '📝';
      const typeLabel = `[${entity.type || 'unknown'}]`;
      const title = entity.title || entity.slug || 'Untitled';
      const slugInfo = entity.slug ? ` (${entity.slug})` : '';
      
      console.log(`${indent}${marker} ${typeLabel} ${title}${slugInfo}`);
      
      // Print children
      entity.children.forEach((childId, index) => {
        const isLast = index === entity.children.length - 1;
        const childIndent = indent + (isLast ? '  ' : '│ ');
        printEntity(childId, childIndent);
      });
    };
    
    // Print root entities
    rootEntities.forEach(id => printEntity(id));
    
    // Print orphaned entities
    const orphaned = this.loadedEntities.filter(e => 
      e.parentId && !entityMap.has(e.parentId)
    );
    
    if (orphaned.length > 0) {
      console.log('\n🔗 Entities with external parents:');
      orphaned.forEach(entity => {
        const marker = entity.action === 'created' ? '✨' : '📝';
        const typeLabel = `[${entity.type || 'unknown'}]`;
        const title = entity.title || entity.slug || 'Untitled';
        const slugInfo = entity.slug ? ` (${entity.slug})` : '';
        console.log(`  ${marker} ${typeLabel} ${title}${slugInfo} (parent: ${entity.parentId})`);
      });
    }
    
    console.log(`\nTotal entities processed: ${this.loadedEntities.length}`);
  }
}


