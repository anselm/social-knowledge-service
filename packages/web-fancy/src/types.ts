
export interface Entity {
  id: string
  slug?: string
  type: string
  auth?: string
  permissions?: string[]
  address?: string
  contract?: string | null
  sponsorId?: string
  parentId?: string
  title?: string
  content?: string
  depiction?: string
  tags?: string[]
  view?: string
  latitude?: number | null
  longitude?: number | null
  radius?: number | null
  begins?: string | null
  ends?: string | null
  createdAt: string
  updatedAt: string
  metadata?: any
}

export interface Stats {
  totalEntities: number
  byType: Record<string, number>
}

export interface EntityWithChildren extends Entity {
  children?: EntityWithChildren[]
  expanded?: boolean
}
