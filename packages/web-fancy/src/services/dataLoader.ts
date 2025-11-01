import type { Entity } from '../types'
import loggers from './logger'

const log = loggers.dataLoader

export async function loadInfoFile(filePath: string): Promise<Entity[]> {
  const entities: Entity[] = []
  
  try {
    log.info(`Loading ${filePath}...`)
    
    // Use native dynamic import with a timestamp to bypass any caching
    const timestamp = Date.now()
    const module = await import(/* @vite-ignore */ `${filePath}?t=${timestamp}`)
    
    log.debug('Module loaded successfully')
    log.debug('Module keys:', Object.keys(module))
    
    // Process all named exports (skip 'default' if present)
    for (const [key, value] of Object.entries(module)) {
      // Skip default export and any non-entity exports
      if (key === 'default') {
        log.debug('Skipping default export')
        continue
      }
      
      log.debug(`Processing export "${key}"`)
      log.debug(`  Type: ${typeof value}`)
      log.debug(`  Is array: ${Array.isArray(value)}`)
      
      if (Array.isArray(value)) {
        log.debug(`  Array with ${value.length} items`)
        // It's an array of entities
        value.forEach((item: any, idx: number) => {
          if (item && typeof item === 'object' && item.id) {
            log.debug(`    [${idx}] id: ${item.id}, slug: ${item.slug}, parentId: ${item.parentId}`)
            entities.push(item)
          } else {
            log.warn(`    [${idx}] Not a valid entity:`, item)
          }
        })
      } else if (value && typeof value === 'object' && (value as any).id) {
        // It's a single entity object
        log.debug(`  Single entity: id: ${(value as any).id}, slug: ${(value as any).slug}, parentId: ${(value as any).parentId}`)
        entities.push(value as Entity)
      } else {
        log.debug(`  Export "${key}" is not an entity or array of entities`)
      }
    }
    
    log.info(`Total entities collected: ${entities.length}`)
    if (entities.length > 0) {
      log.debug('Entities summary:')
      entities.forEach((e, idx) => {
        log.debug(`  [${idx}] id: ${e.id}, slug: ${e.slug}, parentId: ${e.parentId}, title: ${e.title}`)
      })
    } else {
      log.warn('No entities found in module')
    }
    
    return entities
  } catch (error) {
    log.error(`Failed to load ${filePath}:`, error)
    return []
  }
}
