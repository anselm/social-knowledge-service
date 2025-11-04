import { createHash } from "crypto";
import { recoverAddress, hashMessage } from "viem";
import { Magic } from "@magic-sdk/admin";
import { Logger } from './logger.js';

// Initialize Magic with environment variable
const magic = process.env.MAGIC_SECRET_KEY ? new Magic(process.env.MAGIC_SECRET_KEY) : null;

/**
 * Generate a random nonce for SIWE authentication
 * @returns {string} - A random nonce string
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
    // Parse the address from the message (second line typically)
    const lines = message.split("\n");
    const addressLine = lines[1]; // Should be the Ethereum address
    const expectedAddress = addressLine?.trim();
    
    if (!expectedAddress || !expectedAddress.startsWith('0x')) {
      throw new Error('Invalid SIWE message format: could not parse address');
    }

    // Parse the nonce from the message
    const nonceLine = lines.find((l) => l.startsWith("Nonce: "));
    const nonce = nonceLine?.split("Nonce: ")[1]?.trim();

    // Verify nonce matches expected
    if (nonce !== expectedNonce) {
      throw new Error(`nonce mismatch: expected ${expectedNonce}, got ${nonce}`);
    }

    // Recover the address from the signature
    const messageHash = hashMessage(message);
    const recoveredAddress = await recoverAddress({
      hash: messageHash,
      signature: signature,
    });

    // Verify the recovered address matches the claimed address in the message
    if (recoveredAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
      throw new Error(`address mismatch: message claims ${expectedAddress}, but signature resolves to ${recoveredAddress}`);
    }

    Logger.info(`SIWE verification successful for address: ${recoveredAddress}`);
    return recoveredAddress;
  } catch (error) {
    Logger.error("SIWE verification failed:", error);
    throw new Error(`SIWE verification failed: ${error.message}`);
  }
}

/**
 * Verify Magic.link authentication
 * @param {Object} params - Verification parameters
 * @param {string} params.token - The Magic.link DID token
 * @returns {Promise<Object>} - User information from Magic.link
 */
export async function verifyMagic({ token }) {
  if (!magic) {
    throw new Error("Magic.link not configured - MAGIC_SECRET_KEY environment variable required");
  }

  try {
    // Validate the DID token with Magic
    const metadata = await magic.users.getMetadataByToken(token);
    
    if (!metadata || !metadata.publicAddress) {
      throw new Error("Invalid Magic.link token or missing user data");
    }

    Logger.info(`Magic.link verification successful for address: ${metadata.publicAddress}`);
    return {
      address: metadata.publicAddress,
      email: metadata.email,
      phoneNumber: metadata.phoneNumber,
      issuer: metadata.issuer,
      verified: true
    };
  } catch (error) {
    Logger.error("Magic.link verification failed:", error);
    throw new Error(`Magic.link verification failed: ${error.message}`);
  }
}

/**
 * Main authentication verification function
 * Supports both SIWE and Magic.link authentication
 * @param {Object} authData - Authentication data object
 * @param {string} authData.type - Authentication type ('siwe' or 'magic')
 * @param {string} [authData.nonce] - Nonce for SIWE
 * @returns {Promise<Object>} - Verified user object
 */
export async function verifyAuth(authData) {
  if (!authData) {
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
      expectedNonce: nonce,
    });

    return {
      type: 'siwe',
      userId: address,
      address: address,
      creatorAddress: address,
      verified: true
    };
  }

  // Magic.link authentication
  if (authData.type === 'magic' || authData.token) {
    const { token } = authData;
    
    if (!token) {
      throw new Error("Magic.link authentication requires token");
    }

    const userData = await verifyMagic({ token });

    return {
      type: 'magic',
      userId: userData.address,
      address: userData.address,
      creatorAddress: userData.address,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      issuer: userData.issuer,
      verified: userData.verified
    };
  }

  throw new Error(`Unsupported authentication type: ${authData.type || 'unknown'}`);
}

/**
 * Extract authentication data from various request formats
 * @param {Object} request - Request object (Fastify request or similar)
 * @returns {Object|null} - Parsed authentication data or null
 */
export function extractAuthFromRequest(request) {
  try {
    const authHeader = request.headers?.authorization;
    
    if (!authHeader) {
      return null;
    }

    // Handle "Auth {JSON}" format
    if (authHeader.startsWith('Auth ')) {
      const authJson = authHeader.substring(5);
      return JSON.parse(authJson);
    }

    // Handle "Bearer {token}" format for Magic.link
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return { type: 'magic', token };
    }

    // Check for SIWE data in request body
    if (request.body) {
      const { message, signature, nonce } = request.body;
      if (message && signature) {
        return { type: 'siwe', message, signature, nonce };
      }
    }

    return null;
  } catch (error) {
    Logger.warn("Failed to extract auth data from request:", error.message);
    return null;
  }
}

/**
 * Authentication utilities for the Knowledge layer
 */
export const Auth = {
  makeNonce,
  verifySiwe,
  verifyMagic,
  verifyAuth,
  extractAuthFromRequest
};