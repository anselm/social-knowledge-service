import type { FastifyInstance } from "fastify";
import { Knowledge, extractAuthFromRequest, verifyAuth } from "@social/knowledge";
import { Logger } from "./logger.js";

export function registerRoutes(app: FastifyInstance) {

  // GET /api/health - Health check endpoint for web client
  app.get("/api/health", async (request, reply) => {
    try {
      // Basic health check - could be expanded to check database connectivity, etc.
      const healthStatus = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        version: process.env.npm_package_version || "unknown"
      };
      
      return { success: true, data: healthStatus };
    } catch (error) {
      Logger.error("Health check failed:", error);
      reply.status(500).send({ 
        success: false, 
        error: "Health check failed",
        status: "unhealthy",
        timestamp: new Date().toISOString()
      });
    }
  });

  // GET /api/entities - Get all entities (with optional query filtering)
  app.get("/api/entities", async (request, reply) => {
    try {
      const query = request.query as any || {};
      
      // Log the query parameters for debugging
      Logger.info(`Querying entities with parameters:`, query);
      
      // Common query parameters we support:
      // - parentId: filter by parent entity ID
      // - type: filter by entity type
      // - slug: filter by slug pattern
      // - title: filter by title pattern
      // - limit: limit number of results
      // - offset: pagination offset
      
      const entities = await Knowledge.queryEntities(query);
      
      Logger.info(`Query returned ${entities.length} entities`);
      return { success: true, data: entities, count: entities.length };
    } catch (error) {
      Logger.error("Error fetching entities:", error);
      reply.status(500).send({ success: false, error: "Failed to fetch entities" });
    }
  });

  // GET /api/entities/children/:parentId - Get child entities by parent ID
  app.get("/api/entities/children/:parentId", async (request, reply) => {
    try {
      const { parentId } = request.params as { parentId: string };
      Logger.info(`Getting children of entity: ${parentId}`);
      
      const entities = await Knowledge.queryEntities({ parentId });
      
      Logger.info(`Found ${entities.length} children for entity ${parentId}`);
      return { success: true, data: entities, count: entities.length };
    } catch (error) {
      Logger.error(`Error fetching children for parent ${(request.params as any).parentId}:`, error);
      reply.status(500).send({ success: false, error: "Failed to fetch child entities" });
    }
  });

  // GET /api/entities/by-slug/:slug - Get entity by slug
  app.get("/api/entities/by-slug/:slug", async (request, reply) => {
    try {
      const { slug } = request.params as { slug: string };
      const entity = await Knowledge.getEntityBySlug(slug);
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

  // GET /api/entities/slug - Get root entity (slug: "/")
  app.get("/api/entities/slug", async (request, reply) => {
    try {
      const entity = await Knowledge.getEntityBySlug("/");
      if (entity) {
        return { success: true, data: entity };
      } else {
        reply.status(404).send({ success: false, error: "Root entity not found" });
      }
    } catch (error) {
      Logger.error("Error fetching root entity:", error);
      reply.status(500).send({ success: false, error: "Failed to fetch root entity" });
    }
  });

  // GET /api/entities/slug/* - Get entity by slug path (catches all paths after /slug/)
  app.get("/api/entities/slug/*", async (request, reply) => {
    try {
      // Extract the slug from the URL - everything after /api/entities/slug/
      const fullUrl = request.url;
      const slugPath = fullUrl.replace(/^\/api\/entities\/slug\//, '');
      
      // Decode URL components
      const decodedSlug = '/' + decodeURIComponent(slugPath);
      
      Logger.info(`Looking up entity with slug: "${decodedSlug}"`);
      
      const entity = await Knowledge.getEntityBySlug(decodedSlug);
      if (entity) {
        return { success: true, data: entity };
      } else {
        reply.status(404).send({ success: false, error: `Entity with slug "${decodedSlug}" not found` });
      }
    } catch (error) {
      Logger.error("Error fetching entity by slug path:", error);
      reply.status(500).send({ success: false, error: "Failed to fetch entity by slug" });
    }
  });

  // GET /api/entities/slug-available/:slug - Check if slug is available
  app.get("/api/entities/slug-available/:slug", async (request, reply) => {
    try {
      const { slug } = request.params as { slug: string };
      const decodedSlug = '/' + decodeURIComponent(slug);
      const available = await Knowledge.isSlugAvailable(decodedSlug);
      return { 
        success: true, 
        available, 
        slug: decodedSlug,
        message: available ? 'Slug is available' : 'Slug is already taken'
      };
    } catch (error) {
      Logger.error(`Error checking slug availability for ${(request.params as any).slug}:`, error);
      reply.status(500).send({ success: false, error: "Failed to check slug availability" });
    }
  });

  // GET /api/entities/:id - Get entity by ID
  app.get("/api/entities/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const entity = await Knowledge.getEntityById(id);
      if (entity) {
        return { success: true, data: entity };
      } else {
        reply.status(404).send({ success: false, error: "Entity not found" });
      }
    } catch (error) {
      Logger.error(`Error fetching entity by ID ${(request.params as any).id}:`, error);
      reply.status(500).send({ success: false, error: "Failed to fetch entity by ID" });
    }
  });

  // POST /api/entities - Create or update entity
  app.post("/api/entities", async (request, reply) => {
    try {
      // Handle both old format (direct entity) and new format (with validation option)
      const requestBody = request.body as any;
      const entity = requestBody.entity || requestBody;
      const validate = requestBody.validate !== false; // Default to true unless explicitly false
      const slugConflict = requestBody.slugConflict || 'reject'; // Default conflict strategy
      const kind = requestBody.kind || entity.kind; // Extract kind from request or entity
      
      // Debug: Log request details
      console.log('POST /api/entities - Headers:', JSON.stringify(request.headers, null, 2));
      console.log('POST /api/entities - Body:', JSON.stringify(requestBody, null, 2));
      console.log('POST /api/entities - Validation enabled:', validate);
      console.log('POST /api/entities - Slug conflict strategy:', slugConflict);
      console.log('POST /api/entities - Entity kind:', kind);
      
      // Check for authentication and extract creator address
      const authData = extractAuthFromRequest(request);
      console.log('Extracted auth data:', authData);
      
      let creatorAddress = null;
      
      if (authData) {
        try {
          const user = await verifyAuth(authData as any) as any;
          creatorAddress = user.creatorAddress;
          Logger.info(`Creating entity with creator: ${creatorAddress}`);
        } catch (error) {
          Logger.warn(`Authentication failed during entity creation: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Continue without authentication - entity will be created without creator info
        }
      }
      
      // Add creator address to entity metadata if authenticated
      if (creatorAddress) {
        if (!entity.meta) {
          entity.meta = {};
        }
        entity.meta.creatorAddress = creatorAddress;
      }
      
      // Pass validation option and kind to Knowledge layer
      await Knowledge.addEntity(entity, { validate, slugConflict, kind });
      
      return { 
        success: true, 
        message: "Entity created/updated successfully",
        createdBy: creatorAddress || 'anonymous',
        kind: kind || 'auto-detected'
      };
    } catch (error) {
      Logger.error("Error creating/updating entity:", error);
      console.log("Full error details:", error);
      reply.status(500).send({ success: false, error: "Failed to create/update entity" });
    }
  });

  // PUT /api/entities/:id - Update entity by ID
  app.put("/api/entities/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const updates = request.body as any;
      const kind = updates.kind; // Extract kind from updates
      
      // Require authentication for updates
      const authData = extractAuthFromRequest(request);
      if (!authData) {
        reply.status(401).send({
          success: false,
          error: "Authentication required to update entities"
        });
        return;
      }
      
      let creatorAddress = null;
      try {
        const user = await verifyAuth(authData as any) as any;
        creatorAddress = user.creatorAddress;
        Logger.info(`Updating entity ${id} with creator: ${creatorAddress}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        Logger.warn(`Authentication failed during entity update: ${errorMessage}`);
        reply.status(401).send({
          success: false,
          error: "Invalid authentication"
        });
        return;
      }
      
      // Use addEntity for updates to ensure proper kind management
      // Include the id in the updates to trigger update logic
      const entityToUpdate = { id, ...updates };
      
      // Add creator address to entity metadata
      if (!entityToUpdate.meta) {
        entityToUpdate.meta = {};
      }
      entityToUpdate.meta.creatorAddress = creatorAddress;
      
      await Knowledge.addEntity(entityToUpdate, { kind });
      
      return { 
        success: true, 
        message: "Entity updated successfully",
        updatedBy: creatorAddress,
        kind: kind || 'preserved'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('Access denied')) {
        reply.status(403).send({ 
          success: false, 
          error: errorMessage
        });
      } else {
        Logger.error(`Error updating entity ${(request.params as any).id}:`, error);
        reply.status(500).send({ 
          success: false, 
          error: "Failed to update entity" 
        });
      }
    }
  });

  // DELETE /api/entities/:id - Delete entity by ID
  app.delete("/api/entities/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      // Require authentication for deletion
      const authData = extractAuthFromRequest(request);
      if (!authData) {
        reply.status(401).send({
          success: false,
          error: "Authentication required to delete entities"
        });
        return;
      }
      
      let creatorAddress = null;
      try {
        const user = await verifyAuth(authData as any) as any;
        creatorAddress = user.creatorAddress;
        Logger.info(`Deleting entity ${id} with creator: ${creatorAddress}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        Logger.warn(`Authentication failed during entity deletion: ${errorMessage}`);
        reply.status(401).send({
          success: false,
          error: "Invalid authentication"
        });
        return;
      }
      
      // Pass creator address to Knowledge layer for ownership check
      await Knowledge.deleteEntity(id, { creatorAddress });
      
      return { 
        success: true, 
        message: "Entity deleted successfully",
        deletedBy: creatorAddress
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('Access denied')) {
        reply.status(403).send({ 
          success: false, 
          error: errorMessage
        });
      } else if (errorMessage.includes('not found')) {
        reply.status(404).send({ 
          success: false, 
          error: errorMessage
        });
      } else {
        Logger.error(`Error deleting entity ${(request.params as any).id}:`, error);
        reply.status(500).send({ 
          success: false, 
          error: "Failed to delete entity" 
        });
      }
    }
  });

  // Example route with optional authentication
  app.get("/api/entities/my", async (request, reply) => {
    try {
      // Check for authentication
      const authData = extractAuthFromRequest(request);
      let user: any = null;
      
      if (authData) {
        try {
          user = await verifyAuth(authData as any);
          Logger.info(`Authenticated request from: ${user.userId}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          Logger.warn(`Authentication failed: ${errorMessage}`);
          // Continue without authentication
        }
      }

      if (!user) {
        reply.status(401).send({
          success: false,
          error: "Authentication required to view your entities"
        });
        return;
      }

      // Query entities for the authenticated user
      const entities = await Knowledge.getEntitiesByCreator(user.creatorAddress, { 
        limit: 10 
      });
      
      return { 
        success: true, 
        data: entities,
        user: {
          id: user.userId,
          type: user.type,
          creatorAddress: user.creatorAddress
        },
        message: `Found ${entities.length} entities created by you` 
      };
    } catch (error) {
      Logger.error("Error fetching user entities:", error);
      reply.status(500).send({ success: false, error: "Failed to fetch entities" });
    }
  });

  ///
  /// RELATIONSHIP MANAGEMENT ENDPOINTS
  ///

  // POST /api/relationships - Create a relationship between two entities
  app.post("/api/relationships", async (request, reply) => {
    try {
      // Check for authentication
      const authData = extractAuthFromRequest(request);
      let user: any = null;
      
      if (authData) {
        try {
          user = await verifyAuth(authData as any);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          Logger.warn(`Authentication failed during relationship creation: ${errorMessage}`);
          reply.status(401).send({
            success: false,
            error: "Authentication required to create relationships"
          });
          return;
        }
      } else {
        reply.status(401).send({
          success: false,
          error: "Authentication required to create relationships"
        });
        return;
      }

      const relationshipData = request.body as any;
      
      // Validate required fields
      if (!relationshipData.subject || !relationshipData.predicate || !relationshipData.object) {
        reply.status(400).send({
          success: false,
          error: "Missing required fields: subject, predicate, object"
        });
        return;
      }

      // Add creator address and other options to the relationship
      const options = {
        creatorAddress: user.creatorAddress,
        // Pass rank and weight directly (they'll be mapped to relation object in relationship manager)
        ...relationshipData.rank && { rank: relationshipData.rank },
        ...relationshipData.weight && { weight: relationshipData.weight }
      };

      const relationship = await Knowledge.createRelationship(
        relationshipData.subject,
        relationshipData.predicate,
        relationshipData.object,
        options
      );

      Logger.info(`Created relationship: ${relationshipData.subject} ${relationshipData.predicate} ${relationshipData.object}`);
      
      return {
        success: true,
        message: "Relationship created successfully",
        data: relationship,
        createdBy: user.creatorAddress
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error("Error creating relationship:", error);
      
      if (errorMessage.includes('already exists')) {
        reply.status(409).send({
          success: false,
          error: errorMessage
        });
      } else if (errorMessage.includes('validation failed')) {
        reply.status(400).send({
          success: false,
          error: errorMessage
        });
      } else {
        reply.status(500).send({
          success: false,
          error: "Failed to create relationship"
        });
      }
    }
  });

  // GET /api/relationships - Get all relationships (with optional filtering)
  app.get("/api/relationships", async (request, reply) => {
    try {
      const query = request.query as any || {};
      
      Logger.info(`Querying relationships with parameters:`, query);
      
      const filters: any = {};
      if (query.predicate) filters.predicate = query.predicate;
      if (query.creatorAddress) filters.creatorAddress = query.creatorAddress;
      
      const relationships = await Knowledge.getAllRelationships(filters);
      
      Logger.info(`Query returned ${relationships.length} relationships`);
      
      return {
        success: true,
        data: relationships,
        count: relationships.length
      };

    } catch (error) {
      Logger.error("Error fetching relationships:", error);
      reply.status(500).send({ success: false, error: "Failed to fetch relationships" });
    }
  });

  // GET /api/relationships/by-subject/:subjectId - Get relationships by subject entity
  app.get("/api/relationships/by-subject/:subjectId", async (request, reply) => {
    try {
      const { subjectId } = request.params as { subjectId: string };
      const query = request.query as any || {};
      
      Logger.info(`Getting relationships for subject: ${subjectId}`);
      
      const relationships = await Knowledge.getRelationshipsBySubject(subjectId, query.predicate);
      
      return {
        success: true,
        data: relationships,
        subject: subjectId,
        count: relationships.length
      };

    } catch (error) {
      Logger.error(`Error fetching relationships for subject ${(request.params as any).subjectId}:`, error);
      reply.status(500).send({ success: false, error: "Failed to fetch relationships by subject" });
    }
  });

  // GET /api/relationships/by-object/:objectId - Get relationships by object entity
  app.get("/api/relationships/by-object/:objectId", async (request, reply) => {
    try {
      const { objectId } = request.params as { objectId: string };
      const query = request.query as any || {};
      
      Logger.info(`Getting relationships for object: ${objectId}`);
      
      const relationships = await Knowledge.getRelationshipsByObject(objectId, query.predicate);
      
      return {
        success: true,
        data: relationships,
        object: objectId,
        count: relationships.length
      };

    } catch (error) {
      Logger.error(`Error fetching relationships for object ${(request.params as any).objectId}:`, error);
      reply.status(500).send({ success: false, error: "Failed to fetch relationships by object" });
    }
  });

  // GET /api/entities/:parentId/children - Get children of a parent entity
  app.get("/api/entities/:parentId/children", async (request, reply) => {
    try {
      const { parentId } = request.params as { parentId: string };
      
      Logger.info(`Getting children of entity: ${parentId}`);
      
      const children = await Knowledge.getChildren(parentId);
      
      // Optionally fetch the full entity data for each child
      const query = request.query as any || {};
      let childEntities = children;
      
      if (query.expand === 'true') {
        childEntities = await Promise.all(
          children.map(childId => Knowledge.getEntityById(childId))
        );
      }
      
      return {
        success: true,
        data: childEntities,
        parent: parentId,
        count: children.length
      };

    } catch (error) {
      Logger.error(`Error fetching children for entity ${(request.params as any).parentId}:`, error);
      reply.status(500).send({ success: false, error: "Failed to fetch children" });
    }
  });

  // GET /api/entities/:childId/parent - Get parent of a child entity
  app.get("/api/entities/:childId/parent", async (request, reply) => {
    try {
      const { childId } = request.params as { childId: string };
      
      Logger.info(`Getting parent of entity: ${childId}`);
      
      const parentId = await Knowledge.getParent(childId);
      
      if (!parentId) {
        return {
          success: true,
          data: null,
          child: childId,
          message: "No parent found"
        };
      }

      // Optionally fetch the full parent entity data
      const query = request.query as any || {};
      let parentData = parentId;
      
      if (query.expand === 'true') {
        parentData = await Knowledge.getEntityById(parentId);
      }
      
      return {
        success: true,
        data: parentData,
        child: childId
      };

    } catch (error) {
      Logger.error(`Error fetching parent for entity ${(request.params as any).childId}:`, error);
      reply.status(500).send({ success: false, error: "Failed to fetch parent" });
    }
  });

  // DELETE /api/relationships/:relationshipId - Delete a specific relationship
  app.delete("/api/relationships/:relationshipId", async (request, reply) => {
    try {
      // Check for authentication
      const authData = extractAuthFromRequest(request);
      let user: any = null;
      
      if (authData) {
        try {
          user = await verifyAuth(authData as any);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          Logger.warn(`Authentication failed during relationship deletion: ${errorMessage}`);
          reply.status(401).send({
            success: false,
            error: "Authentication required to delete relationships"
          });
          return;
        }
      } else {
        reply.status(401).send({
          success: false,
          error: "Authentication required to delete relationships"
        });
        return;
      }

      const { relationshipId } = request.params as { relationshipId: string };
      
      Logger.info(`Deleting relationship: ${relationshipId}`);
      
      const deleted = await Knowledge.deleteRelationship(relationshipId, user.creatorAddress);
      
      if (!deleted) {
        reply.status(404).send({
          success: false,
          error: "Relationship not found"
        });
        return;
      }
      
      return {
        success: true,
        message: "Relationship deleted successfully",
        relationshipId: relationshipId
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error("Error deleting relationship:", error);
      
      if (errorMessage.includes('Access denied')) {
        reply.status(403).send({
          success: false,
          error: errorMessage
        });
      } else {
        reply.status(500).send({
          success: false,
          error: "Failed to delete relationship"
        });
      }
    }
  });

  // DELETE /api/entities/:entityId/relationships - Delete all relationships for an entity
  app.delete("/api/entities/:entityId/relationships", async (request, reply) => {
    try {
      // Check for authentication
      const authData = extractAuthFromRequest(request);
      let user: any = null;
      
      if (authData) {
        try {
          user = await verifyAuth(authData as any);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          Logger.warn(`Authentication failed during bulk relationship deletion: ${errorMessage}`);
          reply.status(401).send({
            success: false,
            error: "Authentication required to delete relationships"
          });
          return;
        }
      } else {
        reply.status(401).send({
          success: false,
          error: "Authentication required to delete relationships"
        });
        return;
      }

      const { entityId } = request.params as { entityId: string };
      
      Logger.info(`Deleting all relationships for entity: ${entityId}`);
      
      const deletedCount = await Knowledge.deleteRelationshipsForEntity(entityId, user.creatorAddress);
      
      return {
        success: true,
        message: `Deleted ${deletedCount} relationships for entity`,
        entityId: entityId,
        deletedCount: deletedCount
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error("Error deleting relationships for entity:", error);
      reply.status(500).send({
        success: false,
        error: "Failed to delete relationships"
      });
    }
  });
}
