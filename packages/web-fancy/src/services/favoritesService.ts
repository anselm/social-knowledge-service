import { api } from './api'
import type { Entity } from '../types'
import loggers from './logger'

const log = loggers.api

export interface Relationship {
  id: string
  fromId: string
  toId: string
  type: string
  metadata?: any
  createdAt: string
  updatedAt: string
}

/**
 * Service for managing user favorites using relationships
 */
export const favoritesService = {
  /**
   * Add an entity to favorites
   */
  async addFavorite(userId: string, entityId: string): Promise<Relationship> {
    log.info(`Adding favorite: user ${userId} -> entity ${entityId}`)
    
    try {
      const relationship = await api.createRelationship({
        fromId: userId,
        toId: entityId,
        type: 'favorite',
        metadata: {
          createdAt: new Date().toISOString()
        }
      })
      
      log.info('Favorite added successfully')
      return relationship
    } catch (error) {
      log.error('Failed to add favorite:', error)
      throw error
    }
  },

  /**
   * Remove an entity from favorites
   */
  async removeFavorite(userId: string, entityId: string): Promise<void> {
    log.info(`Removing favorite: user ${userId} -> entity ${entityId}`)
    
    try {
      // Find the relationship
      const relationships = await api.getRelationships({
        fromId: userId,
        toId: entityId,
        type: 'favorite'
      })
      
      if (relationships && relationships.length > 0) {
        // Delete the first matching relationship
        await api.deleteRelationship(relationships[0].id)
        log.info('Favorite removed successfully')
      } else {
        log.warn('No favorite relationship found to remove')
      }
    } catch (error) {
      log.error('Failed to remove favorite:', error)
      throw error
    }
  },

  /**
   * Check if an entity is favorited by a user
   */
  async isFavorited(userId: string, entityId: string): Promise<boolean> {
    try {
      const relationships = await api.getRelationships({
        fromId: userId,
        toId: entityId,
        type: 'favorite'
      })
      
      return relationships && relationships.length > 0
    } catch (error) {
      log.error('Failed to check favorite status:', error)
      return false
    }
  },

  /**
   * Get all favorites for a user
   */
  async getUserFavorites(userId: string): Promise<Entity[]> {
    log.info(`Getting favorites for user: ${userId}`)
    
    try {
      // Get all favorite relationships for this user
      const relationships = await api.getRelationships({
        fromId: userId,
        type: 'favorite'
      })
      
      if (!relationships || relationships.length === 0) {
        return []
      }
      
      // Fetch all the favorited entities
      const entityIds = relationships.map((r: Relationship) => r.toId)
      const entities: Entity[] = []
      
      for (const entityId of entityIds) {
        try {
          // Try to get by ID - the API should support this
          const entity = await api.request(`/entities/${entityId}`)
          if (entity) {
            entities.push(entity)
          }
        } catch (error) {
          log.warn(`Failed to fetch favorited entity ${entityId}:`, error)
          // Continue with other entities
        }
      }
      
      log.info(`Found ${entities.length} favorited entities`)
      return entities
    } catch (error) {
      log.error('Failed to get user favorites:', error)
      return []
    }
  },

  /**
   * Get the favorite relationship for a specific user and entity
   */
  async getFavoriteRelationship(userId: string, entityId: string): Promise<Relationship | null> {
    try {
      const relationships = await api.getRelationships({
        fromId: userId,
        toId: entityId,
        type: 'favorite'
      })
      
      return relationships && relationships.length > 0 ? relationships[0] : null
    } catch (error) {
      log.error('Failed to get favorite relationship:', error)
      return null
    }
  }
}
