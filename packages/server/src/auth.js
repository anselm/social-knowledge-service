import { createHash } from "crypto";
import { recoverAddress, hashMessage } from "viem";
import { Magic } from "@magic-sdk/admin";

// Initialize Magic with environment variable
const magic = process.env.MAGIC_SECRET_KEY ? new Magic(process.env.MAGIC_SECRET_KEY) : null;

/**
 * Generate a random nonce for SIWE authentication
 */
export function makeNonce() {
  return createHash("sha256")
    .update(Math.random().toString(36))
    .digest("hex")
    .slice(0, 12);
}

/**
 * Verify SIWE (Sign-In with Ethereum) authentication
 * @param {Object} params - Verification parameters
 * @param {string} params.message - The SIWE message
 * @param {string} params.signature - The signature
 * @param {string} params.expectedNonce - The expected nonce
 * @returns {Promise<string>} - The recovered Ethereum address
 */
export async function verifySiwe({ message, signature, expectedNonce }) {
  try {
    // Parse the nonce from the message
    const nonceLine = message.split("\n").find((l) => l.startsWith("Nonce: "));
    const nonce = nonceLine?.split("Nonce: ")[1]?.trim();
    
    if (!nonce || nonce !== expectedNonce) {
      throw new Error("Invalid or missing nonce");
    }

    // Recover the address from the signature
    const addr = await recoverAddress({
      hash: hashMessage(message),
      signature,
    });

    return addr; // recovered EOA address
  } catch (error) {
    throw new Error(`SIWE verification failed: ${error.message}`);
  }
}

/**
 * Verify Magic.link DID token
 * @param {string} didToken - The Magic.link DID token
 * @returns {Promise<Object>} - User metadata from Magic
 */
export async function verifyMagicDid(didToken) {
  if (!magic) {
    throw new Error("Magic.link not configured - MAGIC_SECRET_KEY environment variable required");
  }

  try {
    // Validate the token (throws if invalid)
    await magic.token.validate(didToken);

    // Get user metadata
    const metadata = await magic.users.getMetadataByToken(didToken);
    
    return {
      issuer: metadata.issuer,
      email: metadata.email,
      publicAddress: metadata.publicAddress,
      phoneNumber: metadata.phoneNumber,
    };
  } catch (error) {
    throw new Error(`Magic.link verification failed: ${error.message}`);
  }
}

/**
 * Unified authentication verification function
 * Supports both SIWE and Magic.link authentication
 * @param {Object} authData - Authentication data
 * @returns {Promise<Object>} - Verified user information
 */
export async function verifyAuth(authData) {
  if (!authData || typeof authData !== 'object') {
    throw new Error("Authentication data required");
  }

  // SIWE authentication
  if (authData.type === 'siwe' || (authData.message && authData.signature)) {
    const { message, signature, nonce } = authData;
    
    if (!message || !signature || !nonce) {
      throw new Error("SIWE authentication requires message, signature, and nonce");
    }

    const address = await verifySiwe({
      message,
      signature,
      expectedNonce: nonce
    });

    return {
      type: 'siwe',
      address: address.toLowerCase(),
      userId: address.toLowerCase(), // Use address as user ID
      creatorAddress: address.toLowerCase(), // Durable identifier for binding to data
      verified: true
    };
  }

  // Magic.link authentication
  if (authData.type === 'magic' || authData.didToken) {
    const { didToken } = authData;
    
    if (!didToken) {
      throw new Error("Magic.link authentication requires didToken");
    }

    const metadata = await verifyMagicDid(didToken);

    // For Magic.link, prefer publicAddress if available, otherwise use issuer
    const creatorAddress = metadata.publicAddress?.toLowerCase() || metadata.issuer;

    return {
      type: 'magic',
      ...metadata,
      userId: metadata.issuer, // Use issuer as user ID
      creatorAddress: creatorAddress, // Durable identifier for binding to data
      verified: true
    };
  }

  throw new Error("Unsupported authentication type");
}

/**
 * Middleware to extract and verify authentication from request
 * Looks for auth data in headers or body
 */
export function extractAuthFromRequest(request) {
  // Try to get auth data from various sources
  let authData = null;

  // Check Authorization header for structured auth data
  const authHeader = request.headers.authorization;
  if (authHeader) {
    try {
      // Support both "Bearer <token>" and "Auth <json>"
      if (authHeader.startsWith('Bearer ')) {
        // Assume Magic.link DID token
        authData = {
          type: 'magic',
          didToken: authHeader.slice(7)
        };
      } else if (authHeader.startsWith('Auth ')) {
        // Parse JSON auth data
        authData = JSON.parse(authHeader.slice(5));
      }
    } catch (error) {
      // Invalid JSON in auth header, continue to other methods
    }
  }

  // Check for auth data in request body
  if (!authData && request.body && request.body.auth) {
    authData = request.body.auth;
  }

  // Check for individual auth fields in body (for form submissions)
  if (!authData && request.body) {
    const { message, signature, nonce, didToken } = request.body;
    
    if (message && signature && nonce) {
      authData = { type: 'siwe', message, signature, nonce };
    } else if (didToken) {
      authData = { type: 'magic', didToken };
    }
  }

  return authData;
}