import { uuidv7 } from 'uuidv7'
import { Logger } from './logger.js'
import { mongoManager } from './mongo-manager.js'
import { schemaManager } from './schema-manager.js'

/// Relationship management for the Knowledge layer
/// Handles creation, querying, and deletion of relationships between entities
class RelationshipManager {
  constructor() {
    this.relationshipsCollection = null
  }

  /// Initialize the relationships collection
  /// @param flushDb - Whether to flush the relationships on initialization
  /// @returns Promise<void>
  async initialize(flushDb = false) {
    if (this.relationshipsCollection) return // Already initialized
    
    try {
      // Ensure mongo-manager is initialized
      await mongoManager.initialize()
      
      // Get the relationships collection
      this.relationshipsCollection = mongoManager.db.collection('relationships')
      
      // Check if we should flush the relationships
      const shouldFlushDb = flushDb || process.env.FLUSH_DB === 'true' || process.env.FLUSH_DB === '1'
      
      if (shouldFlushDb) {
        const deleteResult = await this.relationshipsCollection.deleteMany({})
        Logger.info(`🗑️  FLUSH_DB: Deleted ${deleteResult.deletedCount} relationships from MongoDB`)
      }
      
      // Create indexes for efficient relationship queries
      await this.relationshipsCollection.createIndex({ id: 1 }, { unique: true })
      await this.relationshipsCollection.createIndex({ subject: 1 })
      await this.relationshipsCollection.createIndex({ object: 1 })
      await this.relationshipsCollection.createIndex({ predicate: 1 })
      await this.relationshipsCollection.createIndex({ subject: 1, predicate: 1 })
      await this.relationshipsCollection.createIndex({ object: 1, predicate: 1 })
      
      Logger.info('🔗 Relationships collection initialized with indexes')
      
    } catch (error) {
      Logger.error('Failed to initialize relationship manager:', error)
      throw error
    }
  }

  /// Create a new relationship between two entities
  /// @param {Object} relationshipData - The relationship data
  /// @param {string} relationshipData.subject - ID of the subject entity
  /// @param {string} relationshipData.predicate - Type of relationship (e.g., 'contains', 'memberOf')
  /// @param {string} relationshipData.object - ID of the object entity
  /// @param {string} [relationshipData.creatorAddress] - Address of the creator
  /// @param {Object} [relationshipData.edge] - Additional edge-specific data
  /// @returns Promise<Object> - The created relationship
  async createRelationship(relationshipData) {
    await this.initialize()
    
    // Generate ID if not provided
    const id = relationshipData.id || uuidv7()
    
    const relationship = {
      id,
      subject: relationshipData.subject,
      predicate: relationshipData.predicate,
      object: relationshipData.object,
      time: {
        begins: new Date().toISOString()
      },
      ...relationshipData.creatorAddress && {
        meta: {
          creatorAddress: relationshipData.creatorAddress
        }
      },
      ...relationshipData.edge && { edge: relationshipData.edge },
      ...relationshipData.rank && { rank: relationshipData.rank },
      ...relationshipData.weight && { weight: relationshipData.weight }
    }
    
    // Validate against edge schema
    const isValid = schemaManager.validate('ka://schemas/core/edge/1.0.0', relationship)
    if (!isValid) {
      const errors = schemaManager.getValidationErrors('ka://schemas/core/edge/1.0.0')
      throw new Error(`Relationship validation failed: ${JSON.stringify(errors)}`)
    }
    
    // Check if relationship already exists
    const existing = await this.relationshipsCollection.findOne({
      subject: relationship.subject,
      predicate: relationship.predicate,
      object: relationship.object
    })
    
    if (existing) {
      throw new Error(`Relationship already exists: ${relationship.subject} ${relationship.predicate} ${relationship.object}`)
    }
    
    // Insert the relationship
    await this.relationshipsCollection.insertOne(relationship)
    
    Logger.info(`🔗 Created relationship: ${relationship.subject} ${relationship.predicate} ${relationship.object}`)
    return relationship
  }

  /// Get relationships by subject (outgoing relationships)
  /// @param {string} subjectId - ID of the subject entity
  /// @param {string|undefined} [predicate] - Optional predicate filter
  /// @returns Promise<Array> - Array of relationships
  async getRelationshipsBySubject(subjectId, predicate) {
    await this.initialize()
    
    const query = { subject: subjectId }
    if (predicate) {
      query.predicate = predicate
    }
    
    const relationships = await this.relationshipsCollection.find(query).toArray()
    Logger.debug(`🔍 Found ${relationships.length} relationships for subject ${subjectId}`)
    return relationships
  }

  /// Get relationships by object (incoming relationships)
  /// @param {string} objectId - ID of the object entity
  /// @param {string|undefined} [predicate] - Optional predicate filter
  /// @returns Promise<Array> - Array of relationships
  async getRelationshipsByObject(objectId, predicate) {
    await this.initialize()
    
    const query = { object: objectId }
    if (predicate) {
      query.predicate = predicate
    }
    
    const relationships = await this.relationshipsCollection.find(query).toArray()
    Logger.debug(`🔍 Found ${relationships.length} relationships for object ${objectId}`)
    return relationships
  }

  /// Get children of a parent entity (entities that have this entity as their parent)
  /// @param {string} parentId - ID of the parent entity
  /// @returns Promise<Array> - Array of child entity IDs
  async getChildren(parentId) {
    const relationships = await this.getRelationshipsBySubject(parentId, 'contains')
    return relationships.map(rel => rel.object)
  }

  /// Get parent of a child entity (entity that contains this entity)
  /// @param {string} childId - ID of the child entity
  /// @returns Promise<string|null> - ID of parent entity or null
  async getParent(childId) {
    const relationships = await this.getRelationshipsByObject(childId, 'contains')
    return relationships.length > 0 ? relationships[0].subject : null
  }

  /// Delete a specific relationship
  /// @param {string} relationshipId - ID of the relationship to delete
  /// @param {string|undefined} [creatorAddress] - Address of the user requesting deletion (for ownership check)
  /// @returns Promise<boolean> - True if deleted, false if not found
  async deleteRelationship(relationshipId, creatorAddress) {
    await this.initialize()
    
    // Find the relationship first
    const relationship = await this.relationshipsCollection.findOne({ id: relationshipId })
    if (!relationship) {
      return false
    }
    
    // Check ownership if creatorAddress is provided
    if (creatorAddress && relationship.meta?.creatorAddress !== creatorAddress) {
      throw new Error(`Access denied: Only the creator can delete this relationship`)
    }
    
    const result = await this.relationshipsCollection.deleteOne({ id: relationshipId })
    
    if (result.deletedCount > 0) {
      Logger.info(`🗑️  Deleted relationship: ${relationshipId}`)
      return true
    }
    
    return false
  }

  /// Delete all relationships involving a specific entity
  /// @param {string} entityId - ID of the entity
  /// @param {string|undefined} [creatorAddress] - Address of the user requesting deletion (for ownership check)
  /// @returns Promise<number> - Number of relationships deleted
  async deleteRelationshipsForEntity(entityId, creatorAddress) {
    await this.initialize()
    
    const query = {
      $or: [
        { subject: entityId },
        { object: entityId }
      ]
    }
    
    // If creatorAddress is provided, only delete relationships created by that user
    if (creatorAddress) {
      query['meta.creatorAddress'] = creatorAddress
    }
    
    const result = await this.relationshipsCollection.deleteMany(query)
    
    Logger.info(`🗑️  Deleted ${result.deletedCount} relationships for entity ${entityId}`)
    return result.deletedCount
  }

  /// Get all relationships (with optional filtering)
  /// @param {Object} [filters] - Optional filters
  /// @param {string} [filters.predicate] - Filter by predicate
  /// @param {string} [filters.creatorAddress] - Filter by creator
  /// @returns Promise<Array> - Array of relationships
  async getAllRelationships(filters = {}) {
    await this.initialize()
    
    const query = {}
    if (filters.predicate) {
      query.predicate = filters.predicate
    }
    if (filters.creatorAddress) {
      query['meta.creatorAddress'] = filters.creatorAddress
    }
    
    const relationships = await this.relationshipsCollection.find(query).toArray()
    Logger.debug(`🔍 Found ${relationships.length} relationships`)
    return relationships
  }
}

// Export singleton instance
export const relationshipManager = new RelationshipManager()
export default relationshipManager