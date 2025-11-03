import type { Entity } from '../types'

export function canUserEditEntity(entity: Entity | null, authData: any): boolean {
  if (!entity || !authData) return false
  
  const userIdentifier = authData.address || authData.issuer
  return entity.auth === userIdentifier || entity.sponsorId === userIdentifier
}

export function getParentSlug(slug: string): string {
  const parts = slug.split('/').filter(p => p)
  if (parts.length <= 1) return '/'
  return '/' + parts.slice(0, -1).join('/')
}

export function generateEntityId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function buildEntitySlug(parentSlug: string, id?: string): string {
  const entityId = id || generateEntityId()
  if (parentSlug === '/') {
    return `/${entityId}`
  }
  return `${parentSlug}/${entityId}`
}
