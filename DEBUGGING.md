# Debugging Guide

## Overview

This monorepo has comprehensive debugging support enabled for both server-side and client-side development.

## What's Been Fixed

### Source Maps
- ✅ TypeScript source maps enabled in base configuration
- ✅ Server build includes source maps (`--sourceMap` flag)
- ✅ Vite/Svelte build includes source maps in development mode
- ✅ Proper source map serving from server

### Hot Module Replacement
- ✅ Vite HMR enabled in development mode
- ✅ Svelte hot reloading enabled in development mode

### Development Environment Detection
- ✅ Environment-based configuration (`isDev` checks)
- ✅ Development-specific logging and debugging features

## Development Workflows

### Option 1: Traditional (Production-like)
```bash
# Build everything and run server (serves pre-built Svelte app)
npm run dev
# Server: http://localhost:8080
# Web app: http://localhost:8080 (served by server)
```

### Option 2: Live Development
```bash
# Run Vite dev server separately (with HMR)
npm run dev:web
# Client: http://localhost:8000 (with API proxy to localhost:8080)
# You'll also need to run the server: npm run dev
```

### Option 3: Full Stack Development
```bash
# Run both server and Vite dev server
npm run dev:both
# Server: http://localhost:8080
# Client: http://localhost:8000 (with HMR and debugging)
```

## VS Code Debugging

### Available Debug Configurations
1. **Debug Server** - Attach debugger to Node.js server
2. **Attach to Chrome** - Debug client-side code in browser
3. **Debug Full Stack** - Debug both server and client simultaneously

### How to Debug

#### Server-Side Debugging
1. Open VS Code
2. Set breakpoints in TypeScript server code
3. Press F5 or use "Debug Server" configuration
4. Server starts with debugger attached

#### Client-Side Debugging
1. Start the Vite dev server: `npm run dev:web`
2. Open Chrome with debugging enabled:
   ```bash
   google-chrome --remote-debugging-port=9222 http://localhost:8000
   ```
3. Use "Attach to Chrome" debug configuration in VS Code
4. Set breakpoints in TypeScript/Svelte code

#### Full Stack Debugging
1. Use "Debug Full Stack" configuration
2. Both server and client debuggers will attach
3. Set breakpoints anywhere in the codebase

## Browser Developer Tools

### Source Maps
- ✅ Original TypeScript/Svelte source files visible in browser DevTools
- ✅ Set breakpoints directly in original source code
- ✅ Proper stack traces with original file names and line numbers

### Console Debugging
- Development builds include more verbose logging
- Source maps ensure error stack traces point to original source

## Environment Files

### .env.development
Copy this file to `.env` for local development with optimal debugging settings.

Key environment variables:
- `NODE_ENV=development` - Enables debugging features
- `LOAD_SEED_DATA=true` - Loads test data on startup
- `FLUSH_DB=true` - **Clears MongoDB collection on startup (useful for testing)**
- `DEBUG=*` - Enables verbose logging

## Troubleshooting

### Source Maps Not Working
1. Ensure you're running in development mode (`NODE_ENV=development`)
2. Rebuild with: `npm run build`
3. Check browser DevTools Sources tab for original files

### HMR Not Working
1. Ensure you're using `npm run dev:web` (not the production build)
2. Check Vite dev server is running on port 8000
3. Verify browser is accessing `http://localhost:8000`

### VS Code Debugger Not Attaching
1. Ensure `tsx` is installed globally or in project
2. Check debug configuration paths match your project structure
3. Verify server is running when trying to attach

## Performance Notes

- Source maps and debugging features are only enabled in development
- Production builds (`npm run build`) will have optimized, minified code without debugging overhead
- Use `NODE_ENV=production` to test production-like behavior