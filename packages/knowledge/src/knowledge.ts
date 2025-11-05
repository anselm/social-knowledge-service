// Load environment variables from .env file in monorepo root
// Current path: packages/knowledge/src/knowledge.ts
// Target path: .env (at monorepo root)
// Need to go up: ../../.env
// @todo concerned about this explicit path
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import { Logger } from './logger.js'
import { mongoManager } from './mongo-manager.js'
import { relationshipManager } from './relationship-manager.js'

// Track initialization state
// Prevents double initialization of Knowledge services
let initialized = false

///
/// Knowledge API
/// Allows loading/saving/querying a concrete collection of stereotypical social artifacts
///

export class Knowledge {
  
  static async _initialize() {
    if(initialized) return
    initialized = true
    await mongoManager.initialize()
    await relationshipManager.initialize()
    Logger.info("📦 Knowledge layer initialized")
  }

  ///
  /// Create or update an entity
  /// @param entity - Entity object with optional id (will auto-generate if not provided)
  /// @param options - Options including validation settings
  /// @returns Promise<void>
  /// 
  /// Automatically manages:
  /// - Created/updated timestamps in entity.meta
  /// - Default label generation
  /// - Permission checking for updates (based on entity.meta.creatorAddress)
  ///

  static async addEntity(entity: {
    id?: string
    kind?: string
    [key: string]: any
  }, options: {
    validation?: boolean
    kind?: string
    [key: string]: any
  } = {}): Promise<void> {
    await Knowledge._initialize()
    
    // Check if this is an update to an existing entity
    let isUpdate = false
    let existingEntity = null
    if (entity.id) {
      existingEntity = await Knowledge.getEntityById(entity.id)
      
      if (existingEntity) {
        isUpdate = true
        // Entity exists - check creator ownership
        const existingCreator = existingEntity.meta?.creatorAddress
        const requestingCreator = entity.meta?.creatorAddress
        
        if (existingCreator && requestingCreator && existingCreator !== requestingCreator) {
          throw new Error(`Access denied: Entity '${entity.id}' can only be modified by its creator (${existingCreator})`)
        }
        
        Logger.info(`🔒 Update authorized for entity '${entity.id}' by creator ${requestingCreator || 'anonymous'}`)
      }
    }
    
    // Initialize meta object if it doesn't exist
    if (!entity.meta) {
      entity.meta = {}
    }
    
    // Manage entity.kind field
    // Priority: 1) explicit options.kind, 2) existing entity.kind, 3) preserved from existing entity, 4) auto-detect, 5) default 'thing'
    if (options.kind) {
      // Explicit kind provided in options
      entity.kind = options.kind
      Logger.info(`🏷️  Entity kind set to '${entity.kind}' via options`)
    } else if (entity.kind) {
      Logger.info(`🏷️  Entity kind already set to '${entity.kind}'`)
    } else {
      // No kind set on entity, try to determine it
      if (isUpdate && existingEntity?.kind) {
        // For updates, preserve existing kind unless explicitly overridden
        entity.kind = existingEntity.kind
        Logger.info(`🏷️  Entity kind preserved as '${entity.kind}' from existing entity`)
      } else {
        // Default to thing
        entity.kind = "thing"
        Logger.info(`🏷️  Entity kind auto-detected as '${entity.kind}'`)
      }
    }
    
    // Set default label if missing
    if (!entity.meta.label) {
      entity.meta.label = entity.name || entity.id || 'Untitled'
    }
    
    // Auto-manage timestamps
    const now = new Date().toISOString()
    
    if (!isUpdate) {
      // New entity - set created timestamp
      entity.meta.created = now
      entity.meta.updated = now
    } else {
      // Existing entity - only update the updated timestamp
      entity.meta.updated = now
      // Preserve existing created timestamp if it exists
    }
    
    await mongoManager.saveEntity(entity, options)
    Logger.info(`💾 Entity ${entity.id || 'auto-generated'} added/updated ${entity.meta?.creatorAddress ? `by ${entity.meta.creatorAddress}` : ''}`)
  }

  ///
  /// Query entities with optional filters
  /// @param query - MongoDB-style query object
  /// @returns Promise<any[]> - Array of matching entities
  ///

  static async queryEntities(query: any = {}): Promise<any[]> {
    await Knowledge._initialize()
    const results = await mongoManager.queryEntities(query)
    Logger.info(`🔍 Query returned ${results?.length || 0} entities`)
    return results || []
  }

  ///
  /// Get an entity by its unique slug
  /// @param slug - The slug to search for
  /// @returns Promise<any | null> - The entity or null if not found
  ///

  static async getEntityBySlug(slug: string): Promise<any | null> {
    await Knowledge._initialize()
    const results = await mongoManager.queryEntities({ "meta.slug": slug })
    const entity = results?.[0] || null
    Logger.info(`🎯 Entity with slug '${slug}': ${entity ? 'found' : 'not found'}`)
    return entity
  }

  ///
  /// Check if a slug is available (not taken by any entity)
  /// @param slug - The slug to check
  /// @returns Promise<boolean> - true if slug is available, false if taken
  ///

  static async isSlugAvailable(slug: string): Promise<boolean> {
    await Knowledge._initialize()
    const results = await mongoManager.queryEntities({ "meta.slug": slug })
    const available = !results || results.length === 0
    Logger.info(`🔗 Slug '${slug}': ${available ? 'available' : 'taken'}`)
    return available
  }

  ///
  /// Get an entity by its id (unique ID)
  /// @param id - The id to search for  
  /// @returns Promise<any | null> - The entity or null if not found
  ///

  static async getEntityById(id: string): Promise<any | null> {
    await Knowledge._initialize()
    const results = await mongoManager.queryEntities({ id })
    const entity = results?.[0] || null
    Logger.info(`🎯 Entity with id '${id}': ${entity ? 'found' : 'not found'}`)
    return entity
  }

  ///
  /// Get entities created by a specific user
  /// @param creatorAddress - The creator address to search for
  /// @param options - Query options (limit, offset, etc.)
  /// @returns Promise<any[]> - Array of entities created by this user
  ///

  static async getEntitiesByCreator(creatorAddress: string, options: {
    limit?: number
    offset?: number
    [key: string]: any
  } = {}): Promise<any[]> {
    await Knowledge._initialize()
    const query = { 
      'meta.creatorAddress': creatorAddress,
      ...options // Include limit, offset, etc. in the query
    }
    const results = await mongoManager.queryEntities(query)
    Logger.info(`👤 Found ${results?.length || 0} entities created by ${creatorAddress}`)
    return results || []
  }

  ///
  /// Update an entity by id
  /// @param id - The entity ID to update
  /// @param updates - Object with fields to update
  /// @param options - Options including validation settings and creator information
  /// @returns Promise<void>
  ///

  static async updateEntity(id: string, updates: any, options: {
    creatorAddress?: string
    validation?: boolean
    [key: string]: any
  } = {}): Promise<void> {
    await Knowledge._initialize()
    
    // Check creator ownership before allowing update
    const existingEntity = await Knowledge.getEntityById(id)
    
    if (!existingEntity) {
      throw new Error(`Entity with id '${id}' not found`)
    }
    
    const existingCreator = existingEntity.meta?.creatorAddress
    const requestingCreator = options.creatorAddress
    
    // @todo consolidate security and allow more flexibility
    if (existingCreator && requestingCreator && existingCreator !== requestingCreator) {
      throw new Error(`Access denied: Entity '${id}' can only be modified by its creator (${existingCreator})`)
    }
  
    Logger.info(`🔒 Update authorized for entity '${id}' by creator ${requestingCreator || 'anonymous'}`)
    
    await mongoManager.saveEntity({ 
      id, 
      ...updates,
      lastModified: new Date().toISOString()
    }, options)
    Logger.info(`✏️  Entity ${id} updated`)
  }

  ///
  /// Delete an entity by id
  /// @param id - The entity ID to delete
  /// @param options - Options including creator information
  /// @returns Promise<void>
  ///

  static async deleteEntity(id: string, options: {
    creatorAddress?: string
    [key: string]: any
  } = {}): Promise<void> {
    await Knowledge._initialize()
    
    // Check creator ownership before allowing deletion
    const existingEntity = await Knowledge.getEntityById(id)
    
    if (!existingEntity) {
      throw new Error(`Entity with id '${id}' not found`)
    }
    
    const existingCreator = existingEntity.meta?.creatorAddress
    const requestingCreator = options.creatorAddress
    
    // @todo consolidate security and allow more flexibility
    if (existingCreator && requestingCreator && existingCreator !== requestingCreator) {
      throw new Error(`Access denied: Entity '${id}' can only be deleted by its creator (${existingCreator})`)
    }
    
    Logger.info(`🔒 Delete authorized for entity '${id}' by creator ${requestingCreator || 'anonymous'}`)
    
    await mongoManager.deleteEntity(id)
    Logger.info(`🗑️  Entity ${id} deleted`)
  }

  ///
  /// Validate an entity against its JSON schema
  /// @param entity - Entity object to validate
  /// @returns { valid: boolean, errors?: Array } - Validation result
  ///

  static async validateEntity(entity: any): Promise<{ valid: boolean, errors?: Array<any> }> {
    await Knowledge._initialize()
    
    try {
      // Use the schema manager's validation through mongo manager
      mongoManager.validateEntity(entity)
      return { valid: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { 
        valid: false, 
        errors: [{ message }] 
      }
    }
  }

  ///
  /// Find entities near a geographic location
  /// @param lat - Latitude
  /// @param lon - Longitude  
  /// @param maxDistance - Maximum distance in meters (default: 10000)
  /// @param options - Additional query options (limit, offset, etc.)
  /// @returns Promise<Array> - Array of nearby entities
  ///

  static async findNearby(lat: number, lon: number, maxDistance = 10000, options: any = {}): Promise<any[]> {
    await Knowledge._initialize()
    
    const query = {
      $near: { lat, lon, maxDistance },
      ...options
    }
    
    const results = await mongoManager.queryEntities(query)
    Logger.info(`🗺️  Found ${results?.length || 0} entities within ${maxDistance}m of [${lat}, ${lon}]`)
    return results || []
  }

  ///
  /// Find entities active during a time range
  /// @param timeQuery - Time query object { after?, before?, during? }
  /// @param options - Additional query options (limit, offset, etc.)
  /// @returns Promise<Array> - Array of matching entities
  ///

  static async findByTimeRange(timeQuery: { after?: string, before?: string, during?: string }, options: any = {}): Promise<any[]> {
    await Knowledge._initialize()
    
    const query = {
      $timeRange: timeQuery,
      ...options
    }
    
    const results = await mongoManager.queryEntities(query)
    Logger.info(`⏰ Found ${results?.length || 0} entities matching time criteria`)
    return results || []
  }

  ///
  /// RELATIONSHIP MANAGEMENT
  ///

  ///
  /// Create a relationship between two entities
  /// @param subject - ID of the subject entity
  /// @param predicate - flavor of relationship (e.g., 'contains', 'memberOf', 'likes')
  /// @param object - ID of the object entity
  /// @param options - Additional options (creatorAddress, edge data, etc.)
  /// @returns Promise<Object> - The created relationship
  ///

  static async createRelationship(subject: string, predicate: string, object: string, options: any = {}): Promise<any> {
    await Knowledge._initialize()
    
    const relationshipData = {
      subject,
      predicate,
      object,
      ...options
    }
    
    return await relationshipManager.createRelationship(relationshipData)
  }

  ///
  /// Get relationships by subject (outgoing relationships)
  /// @param subjectId - ID of the subject entity
  /// @param predicate - Optional predicate filter
  /// @returns Promise<Array> - Array of relationships
  ///

  static async getRelationshipsBySubject(subjectId: string, predicate?: string): Promise<any[]> {
    await Knowledge._initialize()
    return await relationshipManager.getRelationshipsBySubject(subjectId, predicate)
  }

  ///
  /// Get relationships by object (incoming relationships)
  /// @param objectId - ID of the object entity
  /// @param predicate - Optional predicate filter
  /// @returns Promise<Array> - Array of relationships
  ///

  static async getRelationshipsByObject(objectId: string, predicate?: string): Promise<any[]> {
    await Knowledge._initialize()
    return await relationshipManager.getRelationshipsByObject(objectId, predicate)
  }

  ///
  /// Get children of a parent entity (entities contained by this entity)
  /// @param parentId - ID of the parent entity
  /// @returns Promise<Array> - Array of child entity IDs
  ///

  static async getChildren(parentId: string): Promise<string[]> {
    await Knowledge._initialize()
    return await relationshipManager.getChildren(parentId)
  }

  ///
  /// Get parent of a child entity (entity that contains this entity)
  /// @param childId - ID of the child entity
  /// @returns Promise<string|null> - ID of parent entity or null
  ///

  static async getParent(childId: string): Promise<string | null> {
    await Knowledge._initialize()
    return await relationshipManager.getParent(childId)
  }

  ///
  /// Delete a specific relationship
  /// @param relationshipId - ID of the relationship to delete
  /// @param creatorAddress - Address of the user requesting deletion (for ownership check)
  /// @returns Promise<boolean> - True if deleted, false if not found
  ///

  static async deleteRelationship(relationshipId: string, creatorAddress?: string): Promise<boolean> {
    await Knowledge._initialize()
    return await relationshipManager.deleteRelationship(relationshipId, creatorAddress)
  }

  ///
  /// Delete all relationships involving a specific entity
  /// @param entityId - ID of the entity
  /// @param creatorAddress - Address of the user requesting deletion (for ownership check)
  /// @returns Promise<number> - Number of relationships deleted
  ///

  static async deleteRelationshipsForEntity(entityId: string, creatorAddress?: string): Promise<number> {
    await Knowledge._initialize()
    return await relationshipManager.deleteRelationshipsForEntity(entityId, creatorAddress)
  }

  ///
  /// Get all relationships (with optional filtering)
  /// @param filters - Optional filters (predicate, creatorAddress)
  /// @returns Promise<Array> - Array of relationships
  ///

  static async getAllRelationships(filters: any = {}): Promise<any[]> {
    await Knowledge._initialize()
    return await relationshipManager.getAllRelationships(filters)
  }

}
