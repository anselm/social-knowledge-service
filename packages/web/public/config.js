// Client configuration file
// This file can be modified after build to customize the application

window.APP_CONFIG = {
  // Application title and branding
  appTitle: 'Social Social!',
  
  // Header configuration
  header: {
    // Whether to show the header
    enabled: false,
    
    // Header links (static only for post-build customization)
    links: [
      { label: 'Home', href: '/' },
      { label: 'Admin', href: '/admin' },
      { label: 'Login', href: '/login' }
    ],
    
    // Custom header component (as HTML string)
    customHtml: null,
    
    // CSS classes for header styling
    className: 'border-b border-white/20 mb-8 pb-4'
  },
  
  // API configuration
  api: {
    // Base URL for API calls
    baseUrl: '/api',
    
    // Serverless mode - fetch all data from a static JSON file
    serverless: false,
    
    // URL to fetch all entities in serverless mode
    serverlessDataUrl: '/data/entities.json',
    
    // Enable client-side caching with IndexedDB
    enableCache: false,
    
    // Cache duration in milliseconds (default: 5 minutes)
    cacheDuration: 5 * 60 * 1000
  },
  
  // Feature flags
  features: {
    // Enable user authentication
    authentication: false,
    
    // Enable content creation
    allowCreate: false,
    
    // Enable content editing
    allowEdit: false,
    
    // Enable content deletion
    allowDelete: false
  },
  
  // Custom methods can be added here
  methods: {
    // Example: Custom initialization
    onInit: () => {
      console.log('App initialized with custom config');
    },
    
    // Example: Custom header renderer
    renderHeader: (config) => {
      if (config.header.customHtml) {
        return config.header.customHtml;
      }
      return null;
    }
  }
};
