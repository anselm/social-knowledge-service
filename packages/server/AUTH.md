# Authentication System

## Overview

The server supports stateless authentication using two methods:
- **SIWE (Sign-In with Ethereum)** - Cryptographic signature verification
- **Magic.link** - DID token validation

**Key Design Principles:**
- No cookies or JWT tokens stored
- Every request can include authentication data
- Authentication is verified on each request
- Stateless and scalable architecture

## User Identifiers from Auth Methods

### SIWE (Sign-In with Ethereum)
- **Public Address**: The Ethereum address (e.g., `0x1234...abcd`) - this is the durable identifier
- **Cryptographically Verified**: The signature proves ownership of the private key
- **Persistent**: The address remains the same across sessions
- **Creator Binding**: Address is used as `creatorAddress` for entity ownership

### Magic.link  
- **Issuer**: A unique user identifier from Magic (e.g., `did:ethr:0x1234...` or Magic's internal ID)
- **Public Address**: If using Ethereum-based Magic, also provides an Ethereum address
- **Email**: If requested, provides verified email address
- **Persistent**: The issuer ID remains constant for the user
- **Creator Binding**: Public address (if available) or issuer is used as `creatorAddress`

## Entity Ownership & Creator Binding

All entities created through authenticated requests are automatically bound to their creator:

```json
{
  "id": "my-entity",
  "meta": {
    "label": "My Entity",
    "creatorAddress": "0x1234567890123456789012345678901234567890"
}
```

### Creator Address Sources
- **SIWE**: Ethereum address (lowercase)
- **Magic.link**: Public address if available, otherwise issuer ID
- **Anonymous**: No `creatorAddress` field

Uses `viem` library for Ethereum signature verification.

**Flow:**
1. Client requests nonce: `GET /api/auth/nonce`
2. Client creates SIWE message with nonce
3. Client signs message with wallet
4. Client sends message + signature for verification

**Example:**
```javascript
// 1. Get nonce
const { data: { nonce } } = await fetch('/api/auth/nonce').then(r => r.json());

// 2. Create SIWE message
const message = `example.com wants you to sign in with your Ethereum account:
0x1234567890123456789012345678901234567890

I accept the ExampleApp Terms of Service: https://example.com/terms

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;

// 3. Sign with wallet (using wagmi, ethers, etc.)
const signature = await signMessage(message);

// 4. Verify authentication
const auth = {
  type: 'siwe',
  message,
  signature,
  nonce
};
```

### 2. Magic.link

Uses `@magic-sdk/admin` for DID token validation.

**Setup:**
Set `MAGIC_SECRET_KEY` environment variable from Magic dashboard.

**Example:**
```javascript
// Client gets DID token from Magic SDK
const didToken = await magic.user.getIdToken();

// Send for verification
const auth = {
  type: 'magic',
  didToken
};
```

## API Endpoints

### `GET /api/auth/nonce`
Generate a nonce for SIWE authentication.

**Response:**
```json
{
  "success": true,
  "data": {
    "nonce": "83510ff5b4e3",
    "timestamp": "2025-11-03T01:56:49.676Z"
  }
}
```

### `POST /api/auth/verify`
Verify authentication data and return user information.

**Request:**
```json
{
  "auth": {
    "type": "siwe",
    "message": "...",
    "signature": "0x...",
    "nonce": "83510ff5b4e3"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "type": "siwe",
      "userId": "0x1234...",
      "address": "0x1234...",
      "creatorAddress": "0x1234...",
      "verified": true
    },
    "timestamp": "2025-11-03T01:56:49.676Z"
  }
}
```

### `GET /api/entities/my`
Get entities created by the authenticated user.

**Headers:**
```
Authorization: Bearer <didToken>
# or
Authorization: Auth {"type":"siwe","message":"...","signature":"0x...","nonce":"..."}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "my-entity",
      "meta": {
        "label": "My Entity",
        "creatorAddress": "0x1234..."
      }
    }
  ],
  "user": {
    "id": "0x1234...",
    "type": "siwe",
    "creatorAddress": "0x1234..."
  },
  "message": "Found 1 entities created by you"
}
```

### `POST /api/entities`
Create entity with automatic creator binding.

**Headers:**
```
Authorization: Bearer <didToken>
Content-Type: application/json
```

**Request:**
```json
{
  "id": "my-new-entity",
  "meta": {
    "label": "My New Entity"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Entity created/updated successfully",
  "createdBy": "0x1234567890123456789012345678901234567890"
}
```

## Authentication Methods

### 1. SIWE (Sign-In with Ethereum)

### In Request Body
```json
{
  "auth": {
    "type": "siwe",
    "message": "...",
    "signature": "0x...",
    "nonce": "..."
  }
}
```

### In Authorization Header
```
# Magic.link DID token
Authorization: Bearer <didToken>

# Structured auth data
Authorization: Auth {"type":"siwe","message":"...","signature":"0x...","nonce":"..."}
```

### Individual Fields in Body
```json
{
  "message": "...",
  "signature": "0x...",
  "nonce": "...",
  "otherData": "..."
}
```

## Implementation Details

### Authentication Flow
1. Extract auth data from request (headers, body)
2. Validate auth data format
3. Verify signature/token with appropriate service
4. Return verified user information

### Error Handling
- Invalid nonce: 401 Unauthorized
- Invalid signature: 401 Unauthorized  
- Missing Magic key: 401 Unauthorized
- Malformed requests: 400 Bad Request

### Security Features
- Nonce prevents replay attacks (SIWE)
- Cryptographic signature verification (SIWE)
- Token validation with Magic service (Magic.link)
- No session state stored on server

## Environment Variables

```bash
# Required for Magic.link authentication
MAGIC_SECRET_KEY=sk_live_...

# Optional - for development
NODE_ENV=development
```

## Testing

```bash
# Test authentication system
npm run test:auth

# Test creator address binding
npm run test:creator

# Test with real Magic.link
MAGIC_SECRET_KEY=sk_test_... npm run test:auth
```

## Integration Example

```javascript
// Check authentication on any request
app.addHook('preHandler', async (request, reply) => {
  const authData = extractAuthFromRequest(request);
  
  if (authData) {
    try {
      const user = await verifyAuth(authData);
      request.user = user; // Add to request context
    } catch (error) {
      // Authentication failed - handle as needed
      request.user = null;
    }
  }
});
```

## Future Enhancements

- [ ] JWT token support for session management
- [ ] OAuth providers (Google, Twitter, etc.)
- [ ] Multi-factor authentication
- [ ] Rate limiting per user
- [ ] Audit logging
- [ ] Permission-based access control