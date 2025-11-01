import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCors from "@fastify/cors";
import { Logger } from "@social/basic";
import { Services } from "@social/knowledge";
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

// API routes - these call into the services layer
app.register(async function (fastify) {
  // Health check
  fastify.get("/api/health", async () => {
    Logger.info("Health check requested");
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Entity management endpoints

  // GET /api/entities - Get all entities (or filtered by query params)
  fastify.get("/api/entities", async (request, reply) => {
    try {
      const query = request.query as any || {};
      const entities = await Services.queryEntities(query);
      return { success: true, data: entities, count: entities.length };
    } catch (error) {
      Logger.error("Error fetching entities:", error);
      reply.status(500).send({ success: false, error: "Failed to fetch entities" });
    }
  });

  // GET /api/entities/by-type/:type - Get entities by type
  fastify.get("/api/entities/by-type/:type", async (request, reply) => {
    try {
      const { type } = request.params as { type: string };
      const entities = await Services.getEntitiesByType(type);
      return { success: true, data: entities, count: entities.length };
    } catch (error) {
      Logger.error(`Error fetching entities by type ${(request.params as any).type}:`, error);
      reply.status(500).send({ success: false, error: "Failed to fetch entities by type" });
    }
  });

  // GET /api/entities/by-slug/:slug - Get entity by slug
  fastify.get("/api/entities/by-slug/:slug", async (request, reply) => {
    try {
      const { slug } = request.params as { slug: string };
      const entity = await Services.getEntityBySlug(slug);
      if (entity) {
        return { success: true, data: entity };
      } else {
        reply.status(404).send({ success: false, error: "Entity not found" });
      }
    } catch (error) {
      Logger.error(`Error fetching entity by slug ${(request.params as any).slug}:`, error);
      reply.status(500).send({ success: false, error: "Failed to fetch entity by slug" });
    }
  });

  // GET /api/entities/:kid - Get entity by ID
  fastify.get("/api/entities/:kid", async (request, reply) => {
    try {
      const { kid } = request.params as { kid: string };
      const entity = await Services.getEntityById(kid);
      if (entity) {
        return { success: true, data: entity };
      } else {
        reply.status(404).send({ success: false, error: "Entity not found" });
      }
    } catch (error) {
      Logger.error(`Error fetching entity by ID ${(request.params as any).kid}:`, error);
      reply.status(500).send({ success: false, error: "Failed to fetch entity by ID" });
    }
  });

  // POST /api/entities - Create or update entity
  fastify.post("/api/entities", async (request, reply) => {
    try {
      const entity = request.body as any;
      await Services.addEntity(entity);
      return { success: true, message: "Entity created/updated successfully" };
    } catch (error) {
      Logger.error("Error creating/updating entity:", error);
      reply.status(500).send({ success: false, error: "Failed to create/update entity" });
    }
  });

  // PUT /api/entities/:kid - Update entity by ID
  fastify.put("/api/entities/:kid", async (request, reply) => {
    try {
      const { kid } = request.params as { kid: string };
      const updates = request.body as any;
      await Services.updateEntity(kid, updates);
      return { success: true, message: "Entity updated successfully" };
    } catch (error) {
      Logger.error(`Error updating entity ${(request.params as any).kid}:`, error);
      reply.status(500).send({ success: false, error: "Failed to update entity" });
    }
  });

  // Catch-all for undefined API routes
  fastify.get("/api/*", async (request, reply) => {
    reply.status(404).send({ success: false, error: "API endpoint not found" });
  });

  fastify.post("/api/*", async (request, reply) => {
    reply.status(404).send({ success: false, error: "API endpoint not found" });
  });

  fastify.put("/api/*", async (request, reply) => {
    reply.status(404).send({ success: false, error: "API endpoint not found" });
  });

  fastify.delete("/api/*", async (request, reply) => {
    reply.status(404).send({ success: false, error: "API endpoint not found" });
  });
});

// Serve static files from the web-fancy dist folder
const webDistPath = path.resolve(__dirname, "../../web-fancy/dist");
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
    const host = process.env.HOST || "0.0.0.0";
    await app.listen({ port, host });
    Logger.info(`🚀 Server running on http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
    Logger.info("📱 SPA served from /packages/web-fancy/dist");
    Logger.info("🔗 API routes available at /api/*");
    Logger.info("📦 Services layer ready for business logic");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();