# Social Appliance Web Frontend

A Svelte-based progressive web application for the social media platform.

## Features

- **Svelte 5** modern reactive framework
- **Progressive Web App (PWA)** with offline capabilities
- **SIWE Authentication** (Sign-In with Ethereum)
- **Real-time Updates** with reactive state management

## Development

### Building

```bash
# Development build with hot reload
npm run build:dev

# Production build
npm run build
```

## API Integration

The web app integrates with the knowledge server API:

- **Entity Management**: CRUD operations for all entity types
- **Authentication**: SIWE-based user authentication
- **Real-time**: WebSocket connections for live updates
- **GraphQL**: Advanced querying capabilities

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages-main/         # Main application pages
├── services/           # API clients and business logic
│   └── api.ts         # Unified API client
├── stores/            # Svelte state management
└── types/             # TypeScript type definitions

public/
├── assets/           # Static assets
└── config.js         # App configuration
```

## Deployment

The web package builds to a static site that can be deployed to any web server or CDN:

1. **Build**: `npm run build`
2. **Output**: `dist/` directory contains all static assets
3. **Serve**: Point web server to `dist/index.html`
4. **Environment**: Ensure server API is accessible

## Related Packages

- `@social/knowledge` - Entity management and storage
- `@social/server` - API server and GraphQL endpoints
