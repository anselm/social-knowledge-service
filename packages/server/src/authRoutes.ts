import type { FastifyInstance } from "fastify";
import { 
  makeNonce, 
  verifyAuth, 
  extractAuthFromRequest 
} from "./auth.js";
import { Logger } from "./logger.js";

// Type definitions for authentication
interface VerifiedUser {
  type: string;
  userId: string;
  verified: boolean;
  address?: string;
  issuer?: string;
  email?: string;
  publicAddress?: string;
  phoneNumber?: string;
}

/**
 * Register authentication routes
 * @param {FastifyInstance} app - Fastify instance
 */
export function registerAuthRoutes(app: FastifyInstance) {

  // GET /api/auth/nonce - Generate a nonce for SIWE authentication
  app.get("/api/auth/nonce", async (request, reply) => {
    try {
      const nonce = makeNonce();
      
      Logger.info("Generated nonce for SIWE authentication");
      
      return { 
        success: true, 
        data: { 
          nonce,
          timestamp: new Date().toISOString()
        } 
      };
    } catch (error) {
      Logger.error("Error generating nonce:", error);
      reply.status(500).send({ 
        success: false, 
        error: "Failed to generate nonce" 
      });
    }
  });

  // POST /api/auth/verify - Verify authentication (SIWE or Magic.link)
  app.post("/api/auth/verify", async (request, reply) => {
    try {
      const authData = extractAuthFromRequest(request);
      
      if (!authData) {
        reply.status(400).send({
          success: false,
          error: "No authentication data provided"
        });
        return;
      }

      Logger.info(`Verifying authentication of type: ${authData.type || 'unknown'}`);
      
      const verifiedUser = await verifyAuth(authData) as VerifiedUser;
      
      Logger.info(`Authentication successful for user: ${verifiedUser.userId}`);
      
      return {
        success: true,
        data: {
          user: verifiedUser,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.warn("Authentication verification failed:", errorMessage);
      reply.status(401).send({
        success: false,
        error: errorMessage
      });
    }
  });

  // POST /api/auth/test - Test endpoint to verify auth on any request
  app.post("/api/auth/test", async (request, reply) => {
    try {
      const authData = extractAuthFromRequest(request);
      
      if (!authData) {
        return {
          success: true,
          data: {
            authenticated: false,
            message: "No authentication provided",
            timestamp: new Date().toISOString()
          }
        };
      }

      const verifiedUser = await verifyAuth(authData) as VerifiedUser;
      
      return {
        success: true,
        data: {
          authenticated: true,
          user: verifiedUser,
          message: `Successfully authenticated ${verifiedUser.type} user`,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.warn("Authentication test failed:", errorMessage);
      return {
        success: true,
        data: {
          authenticated: false,
          error: errorMessage,
          timestamp: new Date().toISOString()
        }
      };
    }
  });

  // GET /api/auth/status - Check authentication status
  app.get("/api/auth/status", async (request, reply) => {
    try {
      const authData = extractAuthFromRequest(request);
      
      if (!authData) {
        return {
          success: true,
          data: {
            authenticated: false,
            authMethods: ['siwe', 'magic'],
            endpoints: {
              nonce: '/api/auth/nonce',
              verify: '/api/auth/verify',
              test: '/api/auth/test'
            }
          }
        };
      }

      const verifiedUser = await verifyAuth(authData) as VerifiedUser;
      
      return {
        success: true,
        data: {
          authenticated: true,
          user: {
            userId: verifiedUser.userId,
            type: verifiedUser.type,
            // Don't expose sensitive data in status endpoint
          },
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        success: true,
        data: {
          authenticated: false,
          error: "Authentication validation failed"
        }
      };
    }
  });
}