import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCors from "@fastify/cors";
import { Logger } from "./logger.js";
import { Knowledge } from "../../knowledge/dist/knowledge.js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { registerRoutes } from "./httpRoutes.js";
import { registerGraphQL } from "./graphql.js";
import { registerAuthRoutes } from "./authRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in monorepo root
// @todo i'm a little concerned by this explicit path out of the monorepo
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

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

  // Initialize Knowledge before registering routes
  await Knowledge._initialize();

  // Register GraphQL endpoint
  await fastify.register(registerGraphQL);

  // Register authentication routes
  await fastify.register(registerAuthRoutes);

  // Register API routes
  await fastify.register(registerRoutes);

  // Static file serving for the web app
  // @todo the path for this should be an environment variable or generic somehow
  const publicPath = path.resolve(__dirname, "../../web-fancy/dist");
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
    const server = await createServer();
    const port = parseInt(process.env.PORT || "8080", 10);
    const host = process.env.HOST || "0.0.0.0";
    
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
    process.exit(1);
  }
}

// Export everything from httpRoutes for convenience
export * from "./httpRoutes.js";

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
