import { router } from '../lib/router'

export function navigateTo(path: string) {
  router.navigateTo(path)
}

export function getCurrentPath(): string {
  // This is now handled by the router store
  const params = new URLSearchParams(window.location.search)
  const pathFromQuery = params.get('path')
  
  if (pathFromQuery) {
    return pathFromQuery
  }
  
  // Check if we're in path mode
  const pathname = window.location.pathname
  if (pathname && pathname !== '/') {
    return pathname
  }
  
  return '/'
}

export function createHref(path: string): string {
  return router.createHref(path)
}
