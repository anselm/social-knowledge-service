# Social Appliance Web Frontend

A Svelte-based progressive web application for the social media platform with automatic system initialization and admin bootstrap functionality.

## Features

- **Svelte 5** modern reactive framework
- **Progressive Web App (PWA)** with offline capabilities
- **Automatic Admin Bootstrap** from environment variables
- **Seed Data Loading** for initial system setup
- **SIWE Authentication** (Sign-In with Ethereum)
- **Real-time Updates** with reactive state management

## Admin Bootstrap System

The web application includes an automatic admin bootstrap system that initializes essential system entities when the application starts with a fresh database.

### How It Works

When the web app loads, it automatically:

1. **Checks for existing admin user** at slug `/admin`
2. **Creates admin user if missing** using environment variables
3. **Checks for root entity** at slug `/`
4. **Loads and creates seed data if root missing**

### Environment Configuration

The admin bootstrap requires these environment variables in your `.env` file:

```bash
# Admin wallet configuration for bootstrap
ADMIN_PRIVATE_KEY=0x1234567890abcdef...  # Private key for admin wallet
ADMIN_ADDRESS=0x85d482b27c90d3164bac665494e17bd32b23319d  # Admin Ethereum address
```

### Admin User Creation

The bootstrap automatically creates an admin party entity with:

- **ID**: UUIDv7 generated
- **Slug**: `/admin`
- **Label**: "Administrator"
- **Auth**: Admin Ethereum address
- **Permissions**: Protected system account
- **SIWE Authentication**: Proper cryptographic signatures

### Seed Data Loading

The system loads initial entities from `/public/seed-data/root.info.js`:

```javascript
// Example seed data structure
export default {
  id: "/",
  meta: {
    label: "Home",
    slug: "/",
    view: "list",
    permissions: ["public:view"],
    depiction: "https://example.com/home-image.jpg"
  },
  group: {},
  stats: {
    memberCount: 100,
    recentPosts: 10
  }
}
```

### Bootstrap Process

1. **Detection**: Checks if admin user exists via `/api/entities/slug/admin`
2. **Admin Creation**:
   - Generates SIWE authentication using private key
   - Creates party entity with admin privileges
   - Uses proper cryptographic signatures for authentication
3. **Root Entity Check**: Queries for entity at slug `/`
4. **Seed Data Loading**:
   - Dynamically imports `/seed-data/root.info.js`
   - Creates root entity if missing
   - Uses same SIWE authentication flow

### Authentication Flow

The bootstrap uses the complete SIWE (Sign-In with Ethereum) authentication:

1. **Nonce Generation**: Requests nonce from `/api/auth/nonce`
2. **Message Creation**: Builds EIP-4361 compliant message
3. **Signature**: Signs message with admin private key
4. **Request**: Sends authenticated request with Authorization header
5. **Verification**: Server validates signature and creates entity

### Security Notes

- **Private keys** are only used during bootstrap for system initialization
- **Authentication state** is temporarily stored and immediately cleared
- **Admin privileges** are properly assigned through party schema
- **Validation** is bypassed for system-level entity creation

## Development

### Building

```bash
# Development build with hot reload
npm run build:dev

# Production build
npm run build
```

### Environment Setup

Create `.env` file with required admin credentials:

```bash
ADMIN_PRIVATE_KEY=your_private_key_here
ADMIN_ADDRESS=your_admin_address_here
```

### Seed Data

Place initial system entities in `/public/seed-data/`:

- `root.info.js` - Root/home entity definition
- Additional seed files can be added for future expansion

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
│   ├── api.ts         # Unified API client
│   └── adminBootstrap.ts  # Admin bootstrap service
├── stores/            # Svelte state management
└── types/             # TypeScript type definitions

public/
├── seed-data/         # Initial system data
│   └── root.info.js   # Root entity definition
└── assets/           # Static assets
```

## Deployment

The web package builds to a static site that can be deployed to any web server or CDN:

1. **Build**: `npm run build`
2. **Output**: `dist/` directory contains all static assets
3. **Serve**: Point web server to `dist/index.html`
4. **Environment**: Ensure server API is accessible

## Bootstrap Troubleshooting

### Common Issues

1. **Missing Environment Variables**:
   - Error: "Admin credentials not available"
   - Solution: Add `ADMIN_PRIVATE_KEY` and `ADMIN_ADDRESS` to `.env`

2. **Invalid Private Key**:
   - Error: Authentication signature validation fails
   - Solution: Ensure private key matches admin address

3. **Database Connection**:
   - Error: "Server unavailable"
   - Solution: Verify MongoDB and API server are running

4. **Seed Data Missing**:
   - Warning: "No seed data to create"
   - Solution: Add `root.info.js` to `/public/seed-data/`

### Logs

Bootstrap progress is logged to browser console:

```
🚀 Starting system bootstrap...
📋 Admin credentials loaded
🔐 Creating admin user...
✅ Admin user created successfully
🌱 Root entity missing, creating from seed data...
✅ Seed entity created successfully
🎉 System bootstrap completed
```

## Related Packages

- `@social/knowledge` - Entity management and storage
- `@social/server` - API server and GraphQL endpoints
