
export interface Entity {
  id: string
  kind: string
  
  // Component structures (new schema)
  meta?: {
    slug?: string
    label?: string
    content?: string
    depiction?: string
    tags?: string[]
    view?: string
    permissions?: string[]
    created?: string
    updated?: string
    props?: Record<string, any>
  }
  
  location?: {
    lat?: number
    lon?: number
    rad?: number
    point?: {
      type: "Point"
      coordinates: [number, number]
    }
  }
  
  time?: {
    begins?: string
    ends?: string
  }
  
  stats?: {
    observers?: number
    children?: number
  }
}

export interface Relationship {
  id: string
  kind: 'edge'
  relation: {
    subject: string
    predicate: string
    object: string
  }
  meta?: {
    created?: string
    updated?: string
  }
}

export interface Stats {
  totalEntities: number
  byType: Record<string, number>
}

export interface EntityWithChildren extends Omit<Entity, 'children'> {
  children?: EntityWithChildren[]
  expanded?: boolean
}
