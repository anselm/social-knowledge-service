import type { Entity, EntityWithChildren } from '../types'

export function buildTree(entities: Entity[]): EntityWithChildren[] {
  const entityMap = new Map<string, EntityWithChildren>()
  const rootIds = new Set<string>()
  const roots: EntityWithChildren[] = []
  
  // First pass: create all entities
  entities.forEach(entity => {
    entityMap.set(entity.id, { ...entity, children: [] })
  })
  
  // Second pass: build tree structure
  entities.forEach(entity => {
    const node = entityMap.get(entity.id)!
    
    if (entity.parentId) {
      const parent = entityMap.get(entity.parentId)
      if (parent) {
        // Parent exists in our set, add as child
        parent.children!.push(node)
      } else {
        // Parent not in current set, treat as root
        if (!rootIds.has(entity.id)) {
          rootIds.add(entity.id)
          roots.push(node)
        }
      }
    } else {
      // No parent, this is a root
      if (!rootIds.has(entity.id)) {
        rootIds.add(entity.id)
        roots.push(node)
      }
    }
  })
  
  // Sort roots by slug to ensure consistent ordering
  roots.sort((a, b) => {
    const slugA = a.slug || a.id
    const slugB = b.slug || b.id
    return slugA.localeCompare(slugB)
  })
  
  return roots
}
