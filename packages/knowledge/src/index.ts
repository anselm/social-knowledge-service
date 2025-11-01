
import { Logger } from '@social/basic'
import { Bus } from '@social/bus'
import { mongo_db, mongo_query } from './mongo-db.js'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

// Global bus instance for the services layer
const bus = new Bus()

// Track initialization state
let servicesInitialized = false

// Initialize the services layer by registering database observers via the bus system
async function initializeServices() {
  if (!servicesInitialized) {
    // Register observers by sending them as events to the bus
    // The bus will automatically register them via its built-in on_entity_register observer
    await bus.event(mongo_db)
    await bus.event(mongo_query)
    
    // Mark as initialized to avoid double registration
    servicesInitialized = true
    Logger.info("📦 Services layer initialized with database observers")
  }
}

/**
 * Services API - Pure business logic layer
 * Provides a clean interface for entity management using the bus architecture
 */
export class Services {
  
  /**
   * Initialize the services layer (call once at startup)
   */
  static async initialize() {
    await initializeServices()
  }

  /**
   * Create or update an entity
   * @param entity - Entity object with optional kid (will auto-generate if not provided)
   * @returns Promise<void>
   */
  static async addEntity(entity: {
    kid?: string
    name?: string
    type?: string
    slug?: string
    data?: any
    [key: string]: any
  }): Promise<void> {
    await initializeServices()
    await bus.event(entity)
    Logger.info(`💾 Entity ${entity.kid || 'auto-generated'} added/updated`)
  }

  /**
   * Query entities with optional filters
   * @param query - MongoDB-style query object
   * @returns Promise<any[]> - Array of matching entities
   */
  static async queryEntities(query: any = {}): Promise<any[]> {
    await initializeServices()
    const results = await bus.event({ query })
    Logger.info(`🔍 Query returned ${results?.length || 0} entities`)
    return results || []
  }

  /**
   * Get an entity by its unique slug
   * @param slug - The slug to search for
   * @returns Promise<any | null> - The entity or null if not found
   */
  static async getEntityBySlug(slug: string): Promise<any | null> {
    await initializeServices()
    const results = await bus.event({ query: { slug } })
    const entity = results?.[0] || null
    Logger.info(`🎯 Entity with slug '${slug}': ${entity ? 'found' : 'not found'}`)
    return entity
  }

  /**
   * Get an entity by its kid (unique ID)
   * @param kid - The kid to search for  
   * @returns Promise<any | null> - The entity or null if not found
   */
  static async getEntityById(kid: string): Promise<any | null> {
    await initializeServices()
    const results = await bus.event({ query: { kid } })
    const entity = results?.[0] || null
    Logger.info(`🎯 Entity with kid '${kid}': ${entity ? 'found' : 'not found'}`)
    return entity
  }

  /**
   * Get entities by type
   * @param type - The type to filter by
   * @returns Promise<any[]> - Array of matching entities
   */
  static async getEntitiesByType(type: string): Promise<any[]> {
    await initializeServices()
    const results = await bus.event({ query: { type } })
    Logger.info(`📋 Found ${results?.length || 0} entities of type '${type}'`)
    return results || []
  }

  /**
   * Update an entity by kid
   * @param kid - The entity ID to update
   * @param updates - Object with fields to update
   * @returns Promise<void>
   */
  static async updateEntity(kid: string, updates: any): Promise<void> {
    await initializeServices()
    await bus.event({ 
      kid, 
      ...updates,
      lastModified: new Date().toISOString()
    })
    Logger.info(`✏️  Entity ${kid} updated`)
  }

  /**
   * Get all entities (use with caution in production)
   * @returns Promise<any[]> - Array of all entities
   */
  static async getAllEntities(): Promise<any[]> {
    return this.queryEntities({})
  }
}

// Auto-initialize when the module is imported
Services.initialize().catch(error => {
  Logger.error("Failed to initialize Services:", error)
})

// Export the Services class as default
export default Services
