import { writable, derived, get } from 'svelte/store'

export interface Route {
  path: string
  component: any
  props?: any
}

export interface RouterConfig {
  mode: 'query' | 'path'
  basePath?: string
}

class CustomRouter {
  private currentPath = writable<string>('/')
  private config: RouterConfig = { mode: 'query', basePath: '' }
  private initialized = false
  
  public path = derived(this.currentPath, $path => $path)
  
  init(config: RouterConfig) {
    if (this.initialized) return
    
    this.config = config
    this.initialized = true
    
    // Set initial path
    this.updateFromLocation()
    
    // Listen for browser navigation
    window.addEventListener('popstate', () => {
      this.updateFromLocation()
    })
    
    // Listen for custom navigation events
    window.addEventListener('navigate', ((e: CustomEvent) => {
      this.navigateTo(e.detail.path)
    }) as EventListener)
  }
  
  private updateFromLocation() {
    if (this.config.mode === 'query') {
      const params = new URLSearchParams(window.location.search)
      const pathFromQuery = params.get('path')
      this.currentPath.set(pathFromQuery || '/')
    } else {
      // Path mode
      let path = window.location.pathname
      if (this.config.basePath) {
        path = path.replace(this.config.basePath, '')
      }
      this.currentPath.set(path || '/')
    }
  }
  
  navigateTo(path: string) {
    if (this.config.mode === 'query') {
      // Query mode: use ?path=
      const baseUrl = this.config.basePath || ''
      const newUrl = path === '/' 
        ? baseUrl + '/'
        : `${baseUrl}/?path=${encodeURIComponent(path)}`
      
      window.history.pushState({}, '', newUrl)
      this.currentPath.set(path)
    } else {
      // Path mode: use actual paths
      const fullPath = (this.config.basePath || '') + path
      window.history.pushState({}, '', fullPath)
      this.currentPath.set(path)
    }
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('routechange', { detail: { path } }))
  }
  
  createHref(path: string): string {
    if (this.config.mode === 'query') {
      if (path === '/') {
        return (this.config.basePath || '') + '/'
      }
      return `${this.config.basePath || ''}/?path=${encodeURIComponent(path)}`
    } else {
      return (this.config.basePath || '') + path
    }
  }
  
  getCurrentPath(): string {
    return get(this.currentPath)
  }
}

export const router = new CustomRouter()
