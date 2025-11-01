import { api } from './api'
import { favoritesService } from './favoritesService'
import type { Entity } from '../types'
import loggers from './logger'

const log = loggers.api

/**
 * Client-side API for user-related operations
 */
export const userApi = {
  /**
   * Get all party entities created by a specific auth identity
   */
  async getUserParties(authIdentifier: string): Promise<Entity[]> {
    log.info(`Fetching party entities for auth: ${authIdentifier}`)
    try {
      const entities = await api.queryEntities({
        type: 'party',
        auth: authIdentifier
      })
      return entities || []
    } catch (error) {
      log.error('Failed to fetch user parties:', error)
      return []
    }
  },

  /**
   * Get all posts created by a specific auth identity
   */
  async getUserPosts(authIdentifier: string, limit: number = 20): Promise<Entity[]> {
    log.info(`Fetching posts for auth: ${authIdentifier}`)
    try {
      const entities = await api.queryEntities({
        type: 'post',
        auth: authIdentifier,
        limit
      })
      return entities || []
    } catch (error) {
      log.error('Failed to fetch user posts:', error)
      return []
    }
  },

  /**
   * Get all entities created by a specific auth identity
   */
  async getUserEntities(authIdentifier: string, limit: number = 100): Promise<Entity[]> {
    log.info(`Fetching all entities for auth: ${authIdentifier}`)
    try {
      const entities = await api.queryEntities({
        auth: authIdentifier,
        limit
      })
      return entities || []
    } catch (error) {
      log.error('Failed to fetch user entities:', error)
      return []
    }
  },

  /**
   * Get analytics for a user's content
   */
  async getUserAnalytics(authIdentifier: string): Promise<{
    totalPosts: number
    totalGroups: number
    totalParties: number
    totalEntities: number
    recentActivity: Entity[]
  }> {
    log.info(`Fetching analytics for auth: ${authIdentifier}`)
    try {
      const entities = await this.getUserEntities(authIdentifier)
      
      const posts = entities.filter(e => e.type === 'post')
      const groups = entities.filter(e => e.type === 'group')
      const parties = entities.filter(e => e.type === 'party')
      
      // Sort by updatedAt for recent activity
      const recentActivity = [...entities]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10)
      
      return {
        totalPosts: posts.length,
        totalGroups: groups.length,
        totalParties: parties.length,
        totalEntities: entities.length,
        recentActivity
      }
    } catch (error) {
      log.error('Failed to fetch user analytics:', error)
      return {
        totalPosts: 0,
        totalGroups: 0,
        totalParties: 0,
        totalEntities: 0,
        recentActivity: []
      }
    }
  },

  /**
   * Check if a slug is available (not taken by another entity)
   */
  async isSlugAvailable(slug: string, excludeEntityId?: string): Promise<boolean> {
    log.info(`Checking slug availability: ${slug}`)
    try {
      const entity = await api.getEntityBySlug(slug)
      
      // If no entity found, slug is available
      if (!entity) return true
      
      // If entity found but it's the one we're editing, slug is available
      if (excludeEntityId && entity.id === excludeEntityId) return true
      
      // Otherwise slug is taken
      return false
    } catch (error: any) {
      // If 404, slug is available
      if (error.status === 404 || error.message?.includes('not found')) {
        return true
      }
      log.error('Failed to check slug availability:', error)
      return false
    }
  },

  /**
   * Get user's favorite entities
   */
  async getUserFavorites(userId: string): Promise<Entity[]> {
    log.info(`Fetching favorites for user: ${userId}`)
    try {
      return await favoritesService.getUserFavorites(userId)
    } catch (error) {
      log.error('Failed to fetch user favorites:', error)
      return []
    }
  },

  /**
   * Get engagement stats for an entity (stubbed for now)
   */
  async getEntityEngagement(entityId: string): Promise<{
    views: number
    likes: number
    comments: number
  }> {
    log.info(`Fetching engagement for entity: ${entityId} (stubbed)`)
    // TODO: Implement when analytics are available
    return {
      views: Math.floor(Math.random() * 100), // Stub data
      likes: Math.floor(Math.random() * 20),
      comments: Math.floor(Math.random() * 10)
    }
  }
}
