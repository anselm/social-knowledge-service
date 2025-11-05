// Load environment variables from .env file in monorepo root (development only)
// In production (Cloud Run), environment variables are set directly
// In Docker containers, we may need to load from .env file
// Current path: packages/server/src/index.ts (or when compiled: packages/server/dist/index.js)
// Target path: .env (at monorepo root)
// Need to go up: ../../../.env (from dist) or ../../.env (from src)
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { loadEnv } from './loadenv.js';

// Define __dirname for ES modules compatibility
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables aggressively from multiple locations
loadEnv();

import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCors from "@fastify/cors";
import { Logger } from "./logger.js";
import { Knowledge } from "../../knowledge/dist/knowledge.js";
import { registerRoutes } from "./httpRoutes.js";
import { registerGraphQL } from "./graphql.js";
import { registerAuthRoutes } from "./authRoutes.js";

import fs from "fs";

export async function createServer() {
  const isDev = process.env.NODE_ENV === "development";
  
  const fastify = Fastify({ 
    logger: isDev ? { level: 'info' } : false 
  });

  // Register CORS with wide open settings for development
  await fastify.register(fastifyCors, {
    origin: true, // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  });

  // Initialize Knowledge asynchronously - don't block server startup
  // This allows the server to start listening on PORT even if MongoDB is down
  let knowledgeReady = false;
  const initializeKnowledge = async () => {
    try {
      Logger.info("🔄 Initializing Knowledge layer...");
      await Knowledge._initialize();
      knowledgeReady = true;
      Logger.info("✅ Knowledge layer ready");
    } catch (error) {
      Logger.error("❌ Knowledge initialization failed:", error);
      // Don't exit - let the server run without Knowledge for health checks
    }
  };
  
  // Start Knowledge initialization but don't await it
  initializeKnowledge();
  
    // Add health check endpoint that works even if Knowledge isn't ready
    fastify.get('/health', async (request, reply) => {
        return {
            status: 'ok',
            knowledge: knowledgeReady ? 'ready' : 'initializing',
            timestamp: new Date().toISOString()
        };
    });

    // Middleware to check if Knowledge is ready for API routes
    fastify.addHook('preHandler', async (request, reply) => {
        // Skip Knowledge check for health endpoint and static files
        if (request.url === '/health' || request.url.startsWith('/assets/') || request.url === '/') {
            return;
        }
    
    // For API routes, check if Knowledge is ready
    if (request.url.startsWith('/api/') && !knowledgeReady) {
      reply.code(503).send({
        error: 'Service Unavailable',
        message: 'Knowledge layer is still initializing. Please try again in a moment.',
        knowledgeReady: false
      });
      return;
    }
  });

  // Register GraphQL endpoint
  await fastify.register(registerGraphQL);

  // Register authentication routes
  await fastify.register(registerAuthRoutes);

  // Register API routes
  await fastify.register(registerRoutes);

  // Static file serving for the web app
  const webPackage = process.env.WEB_PACKAGE || 'web';
  const publicPath = path.resolve(__dirname, `../../${webPackage}/dist`);
  
  // Check if the web package dist directory exists
  try {
    fs.accessSync(publicPath);
  } catch {
    throw new Error(`Web package 'packages/${webPackage}' dist directory not found at ${publicPath}. Set WEB_PACKAGE environment variable or create packages/web.`);
  }
  
  await fastify.register(fastifyStatic, {
    root: publicPath,
    prefix: "/",
    // Enable serving source maps in development
    setHeaders: isDev ? (res, path) => {
      if (path.endsWith('.map')) {
        res.setHeader('Content-Type', 'application/json');
      }
    } : undefined
  });

  // Catch-all route to serve index.html for SPA routing (must be last)
  fastify.setNotFoundHandler(async (request, reply) => {
    const url = request.url;
    
    // Don't catch API routes - let them return 404
    if (url.startsWith("/api/")) {
      reply.status(404).send({ success: false, error: "API endpoint not found" });
      return;
    }

    // Serve index.html for all other routes (SPA routing)
    return reply.sendFile("index.html");
  });

  return fastify;
}

export async function startServer() {
  try {

    console.log("server error level and url is ",process.env.LOG_LEVEL,process.env.MONGODB_URI)

    const server = await createServer();
    const port = parseInt(process.env.PORT || "8080", 10);
    const host = process.env.HOST || "0.0.0.0";

    console.log("starting ",port,host)

    await server.listen({ port, host });
    Logger.info(`🚀 Server running at http://${host}:${port}`);
    Logger.info(`📱 Svelte app available at http://${host}:${port}`);
    Logger.info(`🔗 API endpoints available at http://${host}:${port}/api/*`);
    Logger.info(`🔐 Auth endpoints at http://${host}:${port}/api/auth/*`);
    Logger.info(`🎮 GraphQL endpoint at http://${host}:${port}/api/graphql`);
    if (process.env.NODE_ENV !== 'production') {
      Logger.info(`🎲 GraphQL playground at http://${host}:${port}/api/graphiql`);
    }
    
    return server;
  } catch (err) {
    Logger.error("Error starting server:", err);
    console.error("Full error details:", err);
    if (err instanceof Error) {
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
    }
    process.exit(1);
  }
}

// Export everything from httpRoutes for convenience
export * from "./httpRoutes.js";

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
