import { writable } from 'svelte/store'

type Theme = 'light' | 'dark'

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light'
  }
  
  if (!window.matchMedia) {
    return 'light'
  }
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  return mediaQuery.matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') {
    return
  }
  
  const htmlElement = document.documentElement
  
  if (theme === 'dark') {
    htmlElement.classList.add('dark')
  } else {
    htmlElement.classList.remove('dark')
  }
}

function createThemeStore() {
  const systemTheme = getSystemTheme()
  const { subscribe, set } = writable<Theme>(systemTheme)

  applyTheme(systemTheme)

  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (event: MediaQueryListEvent) => {
      const newTheme = event.matches ? 'dark' : 'light'
      set(newTheme)
      applyTheme(newTheme)
    }
    
    mediaQuery.addEventListener('change', handleChange)
  }

  return {
    subscribe
  }
}

export const themeStore = createThemeStore()
