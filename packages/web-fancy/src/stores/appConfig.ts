import { writable, derived } from 'svelte/store'

// Default configuration
const defaultConfig = {
  appTitle: 'Social Appliance',
  header: {
    enabled: true,
    links: [
      { label: 'Home', href: '/' },
      { label: 'Admin', href: '/admin' },
      { label: 'Login', href: '/login' }
    ],
    customHtml: null,
    className: 'border-b border-white/20 mb-8 pb-4'
  },
  api: {
    baseUrl: '/api',
    serverless: false,
    enableCache: false,
    cacheDuration: 5 * 60 * 1000,
    loadStaticData: true,
    flushCacheOnStartup: false,
    // Time to wait before checking server availability again (in milliseconds)
    serverRetryInterval: 30000 // 30 seconds
  },
  features: {
    authentication: true,
    allowCreate: true,
    allowEdit: true,
    allowDelete: true
  },
  routing: {
    mode: 'query', // 'path' | 'query'
    basePath: ''
  },
  methods: {
    onInit: () => {},
    renderHeader: () => null
  }
}

// Get config from window or use defaults
const loadedConfig = (window as any).APP_CONFIG || defaultConfig

// Merge loaded config with defaults to ensure all properties exist
const mergedConfig = {
  ...defaultConfig,
  ...loadedConfig,
  header: { ...defaultConfig.header, ...loadedConfig.header },
  api: { ...defaultConfig.api, ...loadedConfig.api },
  features: { ...defaultConfig.features, ...loadedConfig.features },
  routing: { ...defaultConfig.routing, ...loadedConfig.routing },
  methods: { ...defaultConfig.methods, ...loadedConfig.methods }
}

// Create writable store
export const config = writable(mergedConfig)

// Derived stores for easy access
export const headerConfig = derived(config, $config => $config.header)
export const apiConfig = derived(config, $config => $config.api)
export const features = derived(config, $config => $config.features)

// Initialize config
if (mergedConfig.methods?.onInit) {
  mergedConfig.methods.onInit()
}
