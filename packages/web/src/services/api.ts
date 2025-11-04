import { get } from 'svelte/store'
import { apiConfig } from '../stores/appConfig'
import { getJSON, postJSON } from '../lib/auth'
import loggers from './logger'
import { loadInfoFile } from './dataLoader'
import type { Entity, Relationship } from '../types'

const log = loggers.apiClient

// Helper functions to extract properties from component structure
function getSlug(entity: Entity): string | undefined {
  return entity.meta?.slug
}

function getLabel(entity: Entity): string | undefined {
  return entity.meta?.label
}

function getContent(entity: Entity): string | undefined {
  return entity.meta?.content
}

function getDepiction(entity: Entity): string | undefined {
  return entity.meta?.depiction
}

function getView(entity: Entity): string | undefined {
  return entity.meta?.view
}

function getCreated(entity: Entity): string | undefined {
  return entity.meta?.created
}

function getUpdated(entity: Entity): string | undefined {
  return entity.meta?.updated
}

function getLocation(entity: Entity): { lat?: number, lon?: number, rad?: number } | undefined {
  return entity.location
}

// Simple in-memory cache
interface CachedEntity extends Entity {
  _cachedAt: number
}

class SimpleCache {
  private entityCache = new Map<string, CachedEntity>()
  private slugCache = new Map<string, CachedEntity>()
  
  set(entity: Entity) {
    const cached: CachedEntity = { ...entity, _cachedAt: Date.now() }
    this.entityCache.set(entity.id, cached)
    const slug = getSlug(entity)
    if (slug) {
      this.slugCache.set(slug, cached)
    }
  }
  
  getById(id: string): CachedEntity | undefined {
    return this.entityCache.get(id)
  }
  
  getBySlug(slug: string): CachedEntity | undefined {
    return this.slugCache.get(slug)
  }
  
  isStale(entity: CachedEntity, maxAge: number): boolean {
    return Date.now() - entity._cachedAt > maxAge
  }
  
  clear() {
    this.entityCache.clear()
    this.slugCache.clear()
  }
}

const cache = new SimpleCache()

/**
 * Unified API client for all server communication
 * Handles caching, authentication, and provides a simple interface for the frontend
 */
class UnifiedApiClient {
  private loadedInfoFiles = new Set<string>()
  private loadingInfoFiles = new Map<string, Promise<boolean>>()
  private serverAvailable: boolean | null = null
  private initPromise: Promise<void> | null = null
  private stubEntityIds = new Set<string>()
  
  constructor() {
    // Don't call init in constructor - let it be called explicitly
  }
  
  async init() {
    // Ensure init only runs once
    if (this.initPromise) {
      log.info('Init already in progress or complete, waiting...')
      return this.initPromise
    }
    
    this.initPromise = this._init()
    return this.initPromise
  }
  
  private async _init() {
    const config = get(apiConfig)
    
    log.info('Initializing unified API client...')
    log.debug('Config:', config)
    
    // Only initialize cache if caching is enabled
    if (config.enableCache) {
      log.info('Cache is enabled')
      
      // Flush cache if configured
      if (config.flushCacheOnStartup) {
        log.info('Flushing cache on startup...')
        cache.clear()
        log.info('Cache cleared')
      }
      
      // Load root info.js file if configured
      if (config.loadStaticData) {
        log.info('Loading static data is enabled')
        console.log('API: Loading root info.js...')
        try {
          await this.loadInfoFileForPath('/')
          console.log('API: Root info.js loaded successfully')
        } catch (error) {
          log.error('Failed to load root info.js:', error)
        }
      } else {
        log.info('Loading static data is disabled')
      }
    } else {
      log.info('Cache is disabled - will fetch directly from server')
    }
    
    log.info('Initialization complete')
  }
  
  private async checkServerAvailability(): Promise<boolean> {
    const config = get(apiConfig)
    
    // If we already know the server status, return it
    if (this.serverAvailable !== null) {
      return this.serverAvailable
    }
    
    try {
      await getJSON('/api/health')
      this.serverAvailable = true
      log.info('Server is available')
      return true
    } catch (error) {
      this.serverAvailable = false
      log.info('Server is not available')
      return false
    }
  }

  private async fetchFromServer(path: string, options: RequestInit = {}): Promise<any> {
    const config = get(apiConfig)
    
    console.log("************* fetching real data", path)

    try {
      log.debug(`Fetching from server: ${path}`)
      
      // Use auth utilities for authenticated requests
      const method = options.method || 'GET'
      let data: any

      if (method === 'GET') {
        data = await getJSON(path)
      } else if (method === 'POST' || method === 'PUT') {
        const body = options.body ? JSON.parse(options.body as string) : {}
        data = await postJSON(path, body)
      } else {
        // For other methods like DELETE, use manual fetch with auth headers
        const authStateStr = localStorage.getItem('auth_state')
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...options.headers as Record<string, string>,
        }
        
        if (authStateStr) {
          try {
            const authState = JSON.parse(authStateStr)
            if (authState.type === 'magic' && authState.didToken) {
              headers['Authorization'] = `Bearer ${authState.didToken}`
            }
          } catch (e) {
            console.error('Failed to parse auth state:', e)
          }
        }

        const fullUrl = `${config.baseUrl}${path}`
        const response = await fetch(fullUrl, {
          ...options,
          headers,
        })
        
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch (e) {
            errorMessage = response.statusText || errorMessage
          }
          const err = new Error(errorMessage)
          ;(err as any).status = response.status
          log.error(`Server request failed: ${errorMessage}`)
          throw err
        }
        
        data = await response.json()
      }
      
      if (data === null || data === undefined) {
        const err = new Error('Entity not found')
        ;(err as any).status = 404
        throw err
      }

      console.log("*********** got back this entity", data)

      log.debug(`Server request successful: ${path}`)
      return data
    } catch (error: any) {
      log.info('Server request failed:', error.message)
      throw error
    }
  }
  
  async request(path: string, options: RequestInit = {}) {
    // Ensure initialization is complete
    try {
      await this.init()
    } catch (error) {
      log.error('Initialization failed:', error)
      throw error
    }
    
    const config = get(apiConfig)
    const method = options.method || 'GET'
    
    console.log("************* fetching via request", path)

    log.debug(`Request ${method} ${path}`)
    
    // For GET requests, use cache if enabled, otherwise go direct to server
    if (method === 'GET') {
      if (config.enableCache) {
        return this.getWithCache(path)
      } else {
        // Cache disabled - fetch directly from server
        return this.getDirectFromServer(path)
      }
    }
    
    // For mutations, try server first (if available), then fail
    if (config.serverless) {
      throw new Error('Mutations not supported in serverless mode')
    }
    
    const serverAvailable = await this.checkServerAvailability()
    if (!serverAvailable) {
      throw new Error('Server unavailable - mutations not supported in offline mode')
    }
    
    try {
      const data = await this.fetchFromServer(path, options)
      
      // Cache the response if caching is enabled and it's an entity or array of entities
      if (config.enableCache && data && typeof data === 'object') {
        try {
          if (Array.isArray(data)) {
            data.forEach(entity => cache.set(entity))
          } else if (data.id) {
            cache.set(data)
          }
        } catch (error) {
          log.error('Failed to cache mutation response:', error)
          // Continue anyway - mutation succeeded
        }
      }
      
      return data
    } catch (error: any) {
      log.error(`Request failed: ${method} ${path}`, error)
      throw error
    }
  }

  private async getDirectFromServer(path: string): Promise<any> {
    return this.fetchFromServer(path)
  }

  private async getWithCache(path: string): Promise<any> {
    const config = get(apiConfig)
    
    // Try cache first
    try {
      if (path.startsWith('/api/entities/slug/')) {
        const slug = decodeURIComponent(path.replace('/api/entities/slug/', ''))
        const cached = cache.getBySlug(slug)
        if (cached && !cache.isStale(cached, config.cacheTimeout || 300000)) {
          log.debug(`Cache hit for slug: ${slug}`)
          return cached
        }
      } else if (path.match(/^\/api\/entities\/[^?]+$/)) {
        const id = path.replace('/api/entities/', '')
        const cached = cache.getById(id)
        if (cached && !cache.isStale(cached, config.cacheTimeout || 300000)) {
          log.debug(`Cache hit for entity: ${id}`)
          return cached
        }
      }
    } catch (error) {
      log.debug('Cache lookup failed, falling back to server:', error)
    }
    
    // Cache miss or stale - try server
    const serverAvailable = await this.checkServerAvailability()
    if (serverAvailable) {
      try {
        const data = await this.fetchFromServer(path)
        
        // Cache the response
        try {
          if (Array.isArray(data)) {
            data.forEach(entity => cache.set(entity))
          } else if (data && data.id) {
            cache.set(data)
          }
        } catch (error) {
          log.error('Failed to cache server response:', error)
          // Continue anyway - request succeeded
        }
        
        return data
      } catch (error: any) {
        if (error.status === 404) {
          log.debug('Entity not found on server')
          throw error
        }
        log.warn('Server request failed, checking static data:', error.message)
      }
    }
    
    // Server unavailable or failed - try static data
    if (config.loadStaticData) {
      try {
        await this.loadInfoFileForPath(path)
        
        // Try cache again after loading static data
        if (path.startsWith('/api/entities/slug/')) {
          const slug = decodeURIComponent(path.replace('/api/entities/slug/', ''))
          const cached = cache.getBySlug(slug)
          if (cached) {
            log.debug(`Found in static data for slug: ${slug}`)
            return cached
          }
        }
      } catch (error) {
        log.debug('Static data load failed:', error)
      }
    }
    
    throw new Error('Entity not found in cache, server, or static data')
  }

  private async loadInfoFileForPath(path: string): Promise<boolean> {
    // Convert API path to file system path
    let filePath = path
    if (path.startsWith('/api/entities/slug/')) {
      filePath = decodeURIComponent(path.replace('/api/entities/slug', ''))
    } else if (path === '/api/entities/slug') {
      filePath = '/'
    }
    
    // Ensure path starts with /
    if (!filePath.startsWith('/')) {
      filePath = '/' + filePath
    }
    
    // Check if already loaded or loading
    if (this.loadedInfoFiles.has(filePath)) {
      return true
    }
    
    if (this.loadingInfoFiles.has(filePath)) {
      return this.loadingInfoFiles.get(filePath)!
    }
    
    // Start loading
    const loadPromise = this._loadInfoFile(filePath)
    this.loadingInfoFiles.set(filePath, loadPromise)
    
    try {
      const result = await loadPromise
      this.loadedInfoFiles.add(filePath)
      return result
    } finally {
      this.loadingInfoFiles.delete(filePath)
    }
  }
  
  private async _loadInfoFile(path: string): Promise<boolean> {
    try {
      log.debug(`Loading info file: ${path}`)
      const entities = await loadInfoFile(path)
      return Array.isArray(entities) && entities.length > 0
    } catch (error) {
      log.error(`Failed to load info file ${path}:`, error)
      return false
    }
  }

  // ===== ENTITY OPERATIONS =====

  async getEntityBySlug(slug: string) {
    try {
      log.debug(`Getting entity by slug: ${slug}`)
      
      // Special handling for root slug
      if (slug === '/') {
        const response = await this.request('/api/entities/slug')
        log.debug('Got root entity:', response?.id || response?.data?.id)
        return response
      }
      
      // Don't encode the entire slug - split by / and encode each segment
      const segments = slug.split('/').filter(s => s)
      const encodedSlug = segments.map(s => encodeURIComponent(s)).join('/')
      const fullPath = `/api/entities/slug/${encodedSlug}`
      const response = await this.request(fullPath)
      log.debug(`Got entity by slug "${slug}":`, response?.id || response?.data?.id)
      return response
    } catch (error: any) {
      log.error(`Failed to get entity by slug "${slug}":`, error)
      throw error
    }
  }

  async queryEntities(filters: Record<string, any>) {
    log.debug('Querying entities with filters:', filters)
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, value)
      }
    })
    const response = await this.request(`/api/entities?${params}`)
    
    // Handle the response format from the server: {success: true, data: Array, count: number}
    if (response && typeof response === 'object' && 'data' in response) {
      const entities = response.data
      log.debug(`Query returned ${Array.isArray(entities) ? entities.length : 0} entities`)
      return entities
    } else if (Array.isArray(response)) {
      log.debug(`Query returned ${response.length} entities`)
      return response
    } else {
      log.debug('Query returned no entities')
      return []
    }
  }

  async queryChildren(parentId: string): Promise<Entity[]> {
    log.debug('Querying children for parent:', parentId)
    
    // Get relationships where this entity is the OBJECT and predicate is "childOf"
    // This finds all entities that have "childOf" relationship TO this parent
    const response = await this.queryEntities({
      kind: 'edge',
      'relation.object': parentId,
      'relation.predicate': 'childOf'
    })
    
    // Handle the response format from the server: {success: true, data: Array, count: number}
    let relationships: Relationship[]
    if (response && typeof response === 'object' && 'data' in response) {
      relationships = response.data as Relationship[]
    } else if (Array.isArray(response)) {
      relationships = response as Relationship[]
    } else {
      relationships = []
    }
    
    if (!relationships || relationships.length === 0) {
      log.debug('No relationships found for parent:', parentId)
      return []
    }
    
    // Extract child IDs from the relationships (children are the SUBJECTS in "childOf" relationships)
    const childIds = relationships.map(r => r.relation.subject)
    
    // Query for the actual child entities
    const children = []
    for (const childId of childIds) {
      const child = await this.getEntityById(childId)
      if (child) {
        children.push(child)
      }
    }
    
    log.debug(`Found ${children.length} children for parent ${parentId}`)
    return children
  }

  async createEntity(data: any) {
    log.info('Creating entity:', data.kind || data.type || 'unknown type')
    return this.request('/api/entities', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getEntityById(id: string): Promise<Entity | null> {
    try {
      log.debug(`Getting entity by ID: ${id}`)
      // URL encode the ID to handle special characters like /
      const encodedId = encodeURIComponent(id)
      const response = await this.request(`/api/entities/${encodedId}`)
      
      // Handle the response format from the server: {success: true, data: Entity}
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data || null
      } else if (response && typeof response === 'object' && 'id' in response) {
        return response
      } else {
        return null
      }
    } catch (error: any) {
      log.error(`Failed to get entity by ID "${id}":`, error)
      return null
    }
  }

  async updateEntity(id: string, data: any) {
    log.info(`Updating entity: ${id}`)
    return this.request(`/api/entities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteEntity(id: string) {
    log.info(`Deleting entity: ${id}`)
    return this.request(`/api/entities/${id}`, {
      method: 'DELETE',
    })
  }

  // Legacy methods for backward compatibility
  async createPost(data: any) {
    log.info('Creating post:', data.title || 'untitled')
    
    // Transform flat format to component-based format
    const now = new Date().toISOString()
    const entity = {
      id: data.slug || data.id,
      kind: 'post',
      meta: {
        slug: data.slug,
        label: data.title || 'Untitled Post',
        content: data.content || data.description || '',
        created: now,
        updated: now,
        creatorAddress: data.auth || data.address || data.creatorAddress
      },
      stats: {
        observers: 0,
        children: 0
      }
    }
    
    const response = await this.createEntity(entity)
    
    // Extract the entity from the server response: {success: true, data: Entity}
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data
    } else if (response && typeof response === 'object' && 'id' in response) {
      return response
    } else {
      return response
    }
  }

  async createGroup(data: any) {
    log.info('Creating group:', data.title || data.slug || 'untitled')
    
    // Transform flat format to component-based format
    const now = new Date().toISOString()
    const entity = {
      id: data.slug || data.id,
      kind: 'group',
      meta: {
        slug: data.slug,
        label: data.title || data.slug?.replace(/^\//, '').replace(/\//g, ' ') || 'Untitled Group',
        content: data.content || data.description || '',
        view: data.view || 'list',
        created: now,
        updated: now,
        creatorAddress: data.auth || data.address || data.creatorAddress
      },
      stats: {
        observers: data.observers || 0,
        children: data.children || 0
      }
    }
    
    const response = await this.createEntity(entity)
    
    // Extract the entity from the server response: {success: true, data: Entity}
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data
    } else if (response && typeof response === 'object' && 'id' in response) {
      return response
    } else {
      return response
    }
  }

  async createUser(data: any) {
    log.info('Creating user:', data.slug || 'unnamed')
    
    // Transform flat format to component-based format
    const now = new Date().toISOString()
    const entity = {
      id: data.slug,
      kind: 'party',
      meta: {
        slug: data.slug,
        label: data.title || data.slug?.replace(/^\//, '').replace(/\//g, ' ') || 'Unnamed Party',
        content: `Party profile for ${data.title || data.slug?.replace(/^\//, '') || 'user'}`,
        created: now,
        updated: now,
        creatorAddress: data.auth || data.address || data.sponsorId
      },
      stats: {
        observers: 0,
        children: 0
      }
    }
    
    const response = await this.createEntity(entity)
    
    // Extract the entity from the server response: {success: true, data: Entity}
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data
    } else if (response && typeof response === 'object' && 'id' in response) {
      return response
    } else {
      return response
    }
  }

  // ===== RELATIONSHIP OPERATIONS =====

  async createRelationship(data: { fromId: string, toId: string, type: string, metadata?: any }) {
    log.info(`Creating relationship: ${data.type} from ${data.fromId} to ${data.toId}`)
    return this.request('/api/relationships', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getRelationships(filters: { fromId?: string, toId?: string, type?: string }) {
    log.debug('Getting relationships with filters:', filters)
    const params = new URLSearchParams()
    if (filters.fromId) params.append('fromId', filters.fromId)
    if (filters.toId) params.append('toId', filters.toId)
    if (filters.type) params.append('type', filters.type)
    
    const result = await this.request(`/api/relationships?${params}`)
    log.debug(`Got ${Array.isArray(result) ? result.length : 0} relationships`)
    return result
  }

  async deleteRelationship(id: string) {
    log.info(`Deleting relationship: ${id}`)
    return this.request(`/api/relationships/${id}`, {
      method: 'DELETE',
    })
  }

  // ===== USER-SPECIFIC OPERATIONS =====

  async getUserParties(authIdentifier: string): Promise<Entity[]> {
    log.info(`Fetching party entities for auth: ${authIdentifier}`)
    try {
      const entities = await this.queryEntities({
        type: 'party',
        creatorAddress: authIdentifier
      })
      return entities || []
    } catch (error) {
      log.error('Failed to fetch user parties:', error)
      return []
    }
  }

  async getUserPosts(authIdentifier: string, limit: number = 20): Promise<Entity[]> {
    log.info(`Fetching posts for auth: ${authIdentifier}`)
    try {
      const entities = await this.queryEntities({
        type: 'post',
        creatorAddress: authIdentifier,
        limit: limit
      })
      return entities || []
    } catch (error) {
      log.error('Failed to fetch user posts:', error)
      return []
    }
  }

  async getUserEntities(authIdentifier: string, limit: number = 100): Promise<Entity[]> {
    log.info(`Fetching all entities for auth: ${authIdentifier}`)
    try {
      const entities = await this.queryEntities({
        creatorAddress: authIdentifier,
        limit: limit
      })
      return entities || []
    } catch (error) {
      log.error('Failed to fetch user entities:', error)
      return []
    }
  }

  async getUserAnalytics(authIdentifier: string): Promise<{
    totalEntities: number,
    totalPosts: number,
    totalGroups: number,
    totalParties: number,
    lastActivity?: string
  }> {
    log.info(`Fetching analytics for auth: ${authIdentifier}`)
    try {
      const [posts, groups, parties, allEntities] = await Promise.all([
        this.getUserPosts(authIdentifier, 1000),
        this.queryEntities({ type: 'group', creatorAddress: authIdentifier }),
        this.getUserParties(authIdentifier),
        this.getUserEntities(authIdentifier, 1000)
      ])

      // Find most recent activity
      let lastActivity: string | undefined
      if (allEntities.length > 0) {
        const timestamps = allEntities
          .map(e => getUpdated(e) || getCreated(e))
          .filter(Boolean)
          .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())
        
        if (timestamps.length > 0) {
          lastActivity = timestamps[0]
        }
      }

      return {
        totalEntities: allEntities.length,
        totalPosts: posts.length,
        totalGroups: groups?.length || 0,
        totalParties: parties.length,
        lastActivity
      }
    } catch (error) {
      log.error('Failed to fetch user analytics:', error)
      return {
        totalEntities: 0,
        totalPosts: 0,
        totalGroups: 0,
        totalParties: 0
      }
    }
  }

  // === FAVORITES METHODS ===
  
  /**
   * Add an entity to favorites
   */
  async addFavorite(userId: string, entityId: string): Promise<Relationship> {
    log.info(`Adding favorite: user ${userId} -> entity ${entityId}`)
    
    try {
      const relationship = await this.createRelationship({
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
  }

  /**
   * Remove an entity from favorites
   */
  async removeFavorite(userId: string, entityId: string): Promise<void> {
    log.info(`Removing favorite: user ${userId} -> entity ${entityId}`)
    
    try {
      // Find the relationship
      const relationships = await this.getRelationships({
        fromId: userId,
        toId: entityId,
        type: 'favorite'
      })
      
      if (relationships && relationships.length > 0) {
        // Delete the first matching relationship
        await this.deleteRelationship(relationships[0].id)
        log.info('Favorite removed successfully')
      } else {
        log.warn('No favorite relationship found to remove')
      }
    } catch (error) {
      log.error('Failed to remove favorite:', error)
      throw error
    }
  }

  /**
   * Check if an entity is favorited by a user
   */
  async isFavorited(userId: string, entityId: string): Promise<boolean> {
    try {
      const relationships = await this.getRelationships({
        fromId: userId,
        toId: entityId,
        type: 'favorite'
      })
      
      return relationships && relationships.length > 0
    } catch (error) {
      log.error('Failed to check favorite status:', error)
      return false
    }
  }

  /**
   * Get all favorites for a user
   */
  async getUserFavorites(userId: string): Promise<Entity[]> {
    log.info(`Getting favorites for user: ${userId}`)
    
    try {
      // Get all favorite relationships for this user
      const relationships = await this.getRelationships({
        fromId: userId,
        type: 'favorite'
      })
      
      if (!relationships || relationships.length === 0) {
        return []
      }
      
      // Fetch all the favorited entities
      const entityIds = relationships.map((r: Relationship) => r.relation.object)
      const entities: Entity[] = []
      
      for (const entityId of entityIds) {
        try {
          // Try to get by ID - the API should support this
          const entity = await this.request(`/api/entities/${entityId}`)
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
  }

  /**
   * Get the favorite relationship for a specific user and entity
   */
  async getFavoriteRelationship(userId: string, entityId: string): Promise<Relationship | null> {
    try {
      const relationships = await this.getRelationships({
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

  async getEntityEngagement(entityId: string): Promise<{
    views: number,
    favorites: number,
    children: number
  }> {
    log.info(`Fetching engagement for entity: ${entityId}`)
    try {
      // This could be enhanced to call a dedicated engagement endpoint
      // For now, we'll use basic stats from the entity itself
      const entity = await this.request(`/api/entities/${entityId}`)
      
      return {
        views: entity?.stats?.visited || 0,
        favorites: entity?.stats?.upvotes || 0,
        children: entity?.stats?.children || 0
      }
    } catch (error) {
      log.error('Failed to fetch entity engagement:', error)
      return {
        views: 0,
        favorites: 0,
        children: 0
      }
    }
  }
}

// Export singleton instance
export const api = new UnifiedApiClient()

// Export for backward compatibility  
export { api as apiClient }
export { api as userApi }
