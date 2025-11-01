import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCors from "@fastify/cors";
import { Logger } from "@social/logger";
// Import services when you build them out
// import { SomeService } from "@social/services";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = Fastify({
  logger: true
});

// Register CORS - totally wide open as requested
await app.register(fastifyCors, {
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
});

// API routes - these will call into the services layer
app.register(async function (fastify) {
  fastify.get("/api/health", async () => {
    Logger.info("Health check requested");
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Add more API routes here that call into @social/services
  fastify.get("/api/*", async (request, reply) => {
    // Placeholder for future API routes
    reply.status(404).send({ error: "API endpoint not found" });
  });
});

// Serve static files from the web dist folder
const webDistPath = path.resolve(__dirname, "../../web/dist");
app.register(fastifyStatic, {
  root: webDistPath,
  prefix: "/",
});

// SPA fallback - serve index.html for any route not caught by API
app.setNotFoundHandler(async (request, reply) => {
  // If it's an API route, return 404
  if (request.url.startsWith("/api/")) {
    reply.status(404).send({ error: "API endpoint not found" });
    return;
  }
  
  // For all other routes, serve the processed SPA index.html
  return reply.sendFile("src/index.html");
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "8080", 10);
    await app.listen({ port, host: "0.0.0.0" });
    Logger.info(`🚀 Traffic server running on http://localhost:${port}`);
    Logger.info("📱 SPA served from /packages/web/dist");
    Logger.info("🔗 API routes available at /api/*");
    Logger.info("📦 Services layer ready for business logic");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();