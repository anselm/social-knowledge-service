/**
 * Authentication middleware and helpers
 * Optional authentication validation for endpoints
 */

import { extractAuthFromRequest, verifyAuth } from './auth.js';
import { Logger } from "./logger.js";

/**
 * Fastify hook to optionally verify authentication on requests
 * Sets request.user if authentication is valid
 */
export function authenticationHook(request, reply, done) {
  const authData = extractAuthFromRequest(request);
  
  if (authData) {
    verifyAuth(authData)
      .then(user => {
        request.user = user;
        Logger.info(`Request authenticated: ${user.userId} (${user.type})`);
        done();
      })
      .catch(error => {
        // Authentication failed - continue without user context
        Logger.warn(`Authentication failed: ${error.message}`);
        request.user = null;
        done();
      });
  } else {
    // No authentication provided - continue
    request.user = null;
    done();
  }
}

/**
 * Require authentication for a route
 * Returns 401 if no valid authentication provided
 */
export function requireAuth(request, reply, done) {
  const authData = extractAuthFromRequest(request);
  
  if (!authData) {
    reply.status(401).send({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  verifyAuth(authData)
    .then(user => {
      request.user = user;
      Logger.info(`Protected route accessed: ${user.userId} (${user.type})`);
      done();
    })
    .catch(error => {
      Logger.warn(`Protected route access denied: ${error.message}`);
      reply.status(401).send({
        success: false,
        error: 'Invalid authentication'
      });
    });
}

/**
 * Check if request has valid authentication
 */
export function isAuthenticated(request) {
  return request.user && request.user.verified;
}

/**
 * Get user ID from authenticated request
 */
export function getUserId(request) {
  return request.user?.userId || null;
}

/**
 * Get authentication type from request
 */
export function getAuthType(request) {
  return request.user?.type || null;
}