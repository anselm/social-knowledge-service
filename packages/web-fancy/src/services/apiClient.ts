import { get } from 'svelte/store'
import { apiConfig } from '../stores/appConfig'
import { 
  db, 
  cacheEntity, 
  cacheEntities, 
  getCachedEntity, 
  getCachedEntityBySlug,
  queryCachedEntities,
  isCacheStale
} from './database'
import { loadInfoFile } from './dataLoader'
import type { Entity } from '../types'
import loggers from './logger'

const log = loggers.apiClient

class ApiClient {
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
    
    log.info('Initializing...')
    log.debug('Config:', config)
    
    // Only initialize cache if caching is enabled
    if (config.enableCache) {
      log.info('Cache is enabled')
      
      // Flush cache if configured
      if (config.flushCacheOnStartup) {
        log.info('Flushing cache on startup...')
        try {
          await db.delete()
          log.info('Database deleted')
          // Wait a bit to ensure the database is fully closed
          await new Promise(resolve => setTimeout(resolve, 100))
          await db.open()
          log.info('Database reopened after flush')
        } catch (error) {
          log.error('Failed to flush cache:', error)
        }
      } else {
        // Ensure database is open
        try {
          if (!db.isOpen()) {
            log.info('Opening database...')
            await db.open()
            log.info('Database opened')
          }
        } catch (error) {
          log.error('Failed to open database:', error)
        }
      }
      
      // Load root info.js file if configured
      if (config.loadStaticData) {
        log.info('Loading static data is enabled')
        console.log('ApiClient: Loading root info.js...')
        try {
          await this.loadInfoFileForPath('/')
          console.log('ApiClient: Root info.js loaded successfully')
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
      const response = await fetch(`${config.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      
      this.serverAvailable = response.ok
      log.info('Server availability check:', this.serverAvailable)
      return this.serverAvailable
    } catch (error) {
      this.serverAvailable = false
      log.info('Server is unavailable')
      return false
    }
  }
  
  private async fetchFromServer(path: string, options: RequestInit = {}): Promise<any> {
    const config = get(apiConfig)
    const fullUrl = `${config.baseUrl}${path}`
    
    try {
      log.debug(`Fetching from server: ${fullUrl}`)
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
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
      
      const data = await response.json()
      
      if (data === null || data === undefined) {
        const err = new Error('Entity not found')
        ;(err as any).status = 404
        throw err
      }
      
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
            await cacheEntities(data)
          } else if (data.id) {
            await cacheEntity(data)
          }
        } catch (error) {
          log.error('Failed to cache mutation response:', error)
          // Continue anyway - mutation succeeded
        }
      }
      
      return data
    } catch (error) {
      log.error('Mutation failed:', error)
      throw error
    }
  }
  
  private async getDirectFromServer(path: string): Promise<any> {
    const config = get(apiConfig)
    
    log.debug('Cache disabled - fetching directly from server')
    
    if (config.serverless) {
      const err = new Error('Server unavailable and cache is disabled')
      ;(err as any).status = 503
      throw err
    }
    
    const serverAvailable = await this.checkServerAvailability()
    if (!serverAvailable) {
      const err = new Error('Server unavailable')
      ;(err as any).status = 503
      throw err
    }
    
    return this.fetchFromServer(path)
  }
  
  private async getWithCache(path: string): Promise<any> {
    const config = get(apiConfig)
    
    // Step 1: Try to load info.js files for the requested path (only if loadStaticData is enabled)
    if (config.loadStaticData) {
      const slug = this.extractSlugFromPath(path)
      if (slug) {
        log.debug(`Attempting to load info.js files for slug: ${slug}`)
        try {
          await this.loadInfoFilesForPathHierarchy(slug)
        } catch (error) {
          log.error('Failed to load info files:', error)
        }
      }
    }
    
    // Step 2: Check cache
    let cached: any = null
    try {
      cached = await this.getFromCache(path)
    } catch (error) {
      log.error('Failed to get from cache:', error)
      // Continue to try server
    }
    
    // Step 3: If we have cached data and it's not stale, return it
    if (cached !== null && cached !== undefined) {
      const isStale = Array.isArray(cached) 
        ? false // Arrays don't have _cachedAt
        : await isCacheStale(cached, config.cacheDuration)
      
      if (!isStale) {
        log.debug(`Cache hit (fresh) for ${path}`)
        return cached
      }
      
      log.debug(`Cache hit (stale) for ${path}`)
    } else {
      log.debug(`Cache miss for ${path}`)
    }
    
    // Step 4: Try to fetch from server if not in serverless mode
    if (!config.serverless) {
      const serverAvailable = await this.checkServerAvailability()
      
      if (serverAvailable) {
        try {
          log.debug(`Fetching from server: ${path}`)
          const data = await this.fetchFromServer(path)
          
          // Cache the fresh data
          if (data && typeof data === 'object') {
            try {
              if (Array.isArray(data)) {
                await cacheEntities(data)
              } else if (data.id) {
                await cacheEntity(data)
              }
            } catch (error) {
              log.error('Failed to cache server response:', error)
              // Continue anyway - we have the data
            }
          }
          
          log.debug(`Server fetch successful, cached result`)
          return data
        } catch (error: any) {
          log.debug(`Server fetch failed: ${error.message}`)
          // Fall through to return cached data (even if stale) or throw
        }
      }
    }
    
    // Step 5: If we have cached data (even if stale), return it
    if (cached !== null && cached !== undefined) {
      log.debug(`Returning stale cached data for ${path}`)
      return cached
    }
    
    // Step 6: No cached data and server unavailable - throw 404
    const err = new Error(`Entity not found: ${path}`)
    ;(err as any).status = 404
    throw err
  }
  
  private async getFromCache(path: string): Promise<any> {
    // Parse the path to determine what to fetch from cache
    
    // Root entity by slug
    if (path === '/entities/slug') {
      return await getCachedEntityBySlug('/')
    }
    
    // Entity by slug
    if (path.startsWith('/entities/slug/')) {
      const slug = '/' + path.substring('/entities/slug/'.length)
      return await getCachedEntityBySlug(slug)
    }
    
    // Entity by ID
    if (path.match(/^\/entities\/[^\/\?]+$/)) {
      const id = path.substring('/entities/'.length)
      return await getCachedEntity(id)
    }
    
    // Query entities
    if (path.startsWith('/entities?')) {
      const params = new URLSearchParams(path.split('?')[1])
      const filters: any = {}
      
      if (params.get('type')) filters.type = params.get('type')
      if (params.get('parentId')) filters.parentId = params.get('parentId')
      filters.limit = parseInt(params.get('limit') || '20')
      filters.offset = parseInt(params.get('offset') || '0')
      
      log.debug('Querying cache with filters:', filters)
      return await queryCachedEntities(filters)
    }
    
    return null
  }
  
  private extractSlugFromPath(path: string): string | null {
    // Extract slug from various path formats
    if (path === '/entities/slug') {
      return '/'
    }
    
    if (path.startsWith('/entities/slug/')) {
      return '/' + path.substring('/entities/slug/'.length)
    }
    
    // For entity by ID paths, we can't determine the slug
    return null
  }
  
  private async loadInfoFilesForPathHierarchy(slug: string): Promise<boolean> {
    log.debug(`Loading info.js files for path hierarchy: ${slug}`)
    
    // Generate all parent paths
    const paths: string[] = []
    
    // Always include root
    paths.push('/')
    
    // Split the slug and build up the path segments
    if (slug !== '/') {
      const segments = slug.split('/').filter(s => s)
      let currentPath = ''
      for (const segment of segments) {
        currentPath += '/' + segment
        paths.push(currentPath)
      }
    }
    
    log.debug(`Path hierarchy to load:`, paths)
    
    // Load each info.js file in order (root first, then children)
    let anyLoaded = false
    for (const path of paths) {
      try {
        const loaded = await this.loadInfoFileForPath(path)
        if (loaded) {
          anyLoaded = true
        }
      } catch (error) {
        log.error(`Failed to load info file for ${path}:`, error)
      }
    }
    
    log.debug(`Finished loading path hierarchy. Any files loaded: ${anyLoaded}`)
    return anyLoaded
  }
  
  private async loadInfoFileForPath(slug: string): Promise<boolean> {
    // Normalize the slug to a path
    const normalizedPath = slug === '/' ? '/' : slug.endsWith('/') ? slug.slice(0, -1) : slug
    const infoFilePath = normalizedPath === '/' ? '/info.js' : `${normalizedPath}/info.js`
    
    // Check if we've already loaded this file
    if (this.loadedInfoFiles.has(infoFilePath)) {
      log.debug(`Already loaded ${infoFilePath}`)
      return false
    }
    
    // Check if this file is currently being loaded
    if (this.loadingInfoFiles.has(infoFilePath)) {
      log.debug(`Already loading ${infoFilePath}, waiting...`)
      return await this.loadingInfoFiles.get(infoFilePath)!
    }
    
    // Create a promise for this load operation
    const loadPromise = (async () => {
      try {
        console.log(`ApiClient: Loading ${infoFilePath}...`)
        
        // Mark as loaded before attempting (to prevent retry on failure)
        this.loadedInfoFiles.add(infoFilePath)
        
        // Load the file
        const entities = await loadInfoFile(infoFilePath)
        
        if (entities.length > 0) {
          console.log(`ApiClient: Loaded ${entities.length} entities from ${infoFilePath}`)
          entities.forEach(e => {
            console.log(`  - ${e.id} (${e.title || 'untitled'})`)
          })
          
          // Create stubs for any missing parents
          const entitiesWithStubs = await this.ensureParentStubs(entities)
          
          // Cache all entities
          try {
            await cacheEntities(entitiesWithStubs)
          } catch (error) {
            log.error('Failed to cache entities from info file:', error)
            throw error
          }
          
          return true
        } else {
          console.log(`ApiClient: No entities found in ${infoFilePath}`)
          return false
        }
      } catch (error) {
        log.debug(`Failed to load ${infoFilePath}:`, error)
        return false
      } finally {
        // Remove from loading map when done
        this.loadingInfoFiles.delete(infoFilePath)
      }
    })()
    
    // Store the promise so other calls can wait for it
    this.loadingInfoFiles.set(infoFilePath, loadPromise)
    
    return await loadPromise
  }
  
  private async ensureParentStubs(entities: Entity[]): Promise<Entity[]> {
    const result: Entity[] = [...entities]
    const existingIds = new Set(entities.map(e => e.id))
    
    for (const entity of entities) {
      if (entity.parentId && !existingIds.has(entity.parentId)) {
        // Check if parent exists in cache
        let parentInCache = null
        try {
          parentInCache = await getCachedEntity(entity.parentId)
        } catch (error) {
          log.error('Failed to check for parent in cache:', error)
        }
        
        if (!parentInCache && !this.stubEntityIds.has(entity.parentId)) {
          log.debug(`Creating stub for parent: ${entity.parentId}`)
          
          const stub: Entity = {
            id: entity.parentId,
            type: 'group',
            title: `[Loading: ${entity.parentId}]`,
            content: 'This entity is being loaded...',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: { isStub: true }
          }
          
          this.stubEntityIds.add(entity.parentId)
          result.push(stub)
          existingIds.add(entity.parentId)
        }
      }
    }
    
    return result
  }
}

export const apiClient = new ApiClient()
