import { apiClient } from './apiClient'
import loggers from './logger'

const log = loggers.api

export const api = {
  async request(path: string, options: RequestInit = {}) {
    const method = options.method || 'GET'
    log.debug(`API request: ${method} ${path}`)
    
console.warn("********** fetching",method,path)

    try {
      const result = await apiClient.request(path, options)
      log.debug(`API request successful: ${method} ${path}`)
      return result
    } catch (error: any) {
      log.error(`API request failed: ${method} ${path}`, error)
      throw error
    }
  },

  async createPost(data: any) {
    log.info('Creating post:', data.title || 'untitled')
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async createGroup(data: any) {
    log.info('Creating group:', data.title || data.slug || 'untitled')
    return this.request('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async createUser(data: any) {
    log.info('Creating user:', data.slug || 'unnamed')
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getEntityBySlug(slug: string) {
    try {
      log.debug(`Getting entity by slug: ${slug}`)
      
      // Special handling for root slug
      if (slug === '/') {
        const response = await this.request('/entities/slug')
        log.debug('Got root entity:', response?.id)
        return response
      }
      
      // Don't encode the entire slug - split by / and encode each segment
      const segments = slug.split('/').filter(s => s)
      const encodedSlug = segments.map(s => encodeURIComponent(s)).join('/')
      const fullPath = `/entities/slug/${encodedSlug}`
      const response = await this.request(fullPath)
      log.debug(`Got entity by slug "${slug}":`, response?.id)
      return response
    } catch (error: any) {
      log.error(`Failed to get entity by slug "${slug}":`, error)
      throw error
    }
  },

  async queryEntities(filters: Record<string, any>) {
    log.debug('Querying entities with filters:', filters)
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, value)
      }
    })
    const result = await this.request(`/entities?${params}`)
    log.debug(`Query returned ${Array.isArray(result) ? result.length : 0} entities`)
    return result
  },

  async updateEntity(id: string, data: any) {
    log.info(`Updating entity: ${id}`)
    return this.request(`/entities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async deleteEntity(id: string) {
    log.info(`Deleting entity: ${id}`)
    return this.request(`/entities/${id}`, {
      method: 'DELETE',
    })
  },

  // Relationship methods
  async createRelationship(data: { fromId: string, toId: string, type: string, metadata?: any }) {
    log.info(`Creating relationship: ${data.type} from ${data.fromId} to ${data.toId}`)
    return this.request('/relationships', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getRelationships(filters: { fromId?: string, toId?: string, type?: string }) {
    log.debug('Getting relationships with filters:', filters)
    const params = new URLSearchParams()
    if (filters.fromId) params.append('fromId', filters.fromId)
    if (filters.toId) params.append('toId', filters.toId)
    if (filters.type) params.append('type', filters.type)
    
    const result = await this.request(`/relationships?${params}`)
    log.debug(`Got ${Array.isArray(result) ? result.length : 0} relationships`)
    return result
  },

  async deleteRelationship(id: string) {
    log.info(`Deleting relationship: ${id}`)
    return this.request(`/relationships/${id}`, {
      method: 'DELETE',
    })
  },
}
