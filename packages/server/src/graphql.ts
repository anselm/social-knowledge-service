import type { FastifyInstance } from "fastify";
import { mercurius } from 'mercurius';
import { knowledgeSchema, resolvers } from "@social/knowledge";
import { Knowledge } from "@social/knowledge";

/**
 * Register GraphQL endpoint with Fastify
 * Uses the pure GraphQL schema and resolvers from @social/knowledge
 */
export async function registerGraphQL(app: FastifyInstance) {
  // Register GraphQL plugin
  await app.register(mercurius, {
    schema: knowledgeSchema,
    resolvers,
    context: (request, reply) => {
      return {
        knowledge: Knowledge, // Pass the Knowledge static class
        request,
        reply
      };
    },
    // Enable GraphQL playground in development
    graphiql: process.env.NODE_ENV !== 'production' ? 'graphiql' : false,
    ide: process.env.NODE_ENV !== 'production',
    path: '/api/graphql',
    // Enable subscriptions if needed later
    subscription: false
  });

  // Add a GraphQL info endpoint
  app.get('/api/graphql/info', async (request, reply) => {
    const isDev = process.env.NODE_ENV !== 'production';
    return {
      success: true,
      data: {
        endpoint: '/api/graphql',
        playground: isDev ? '/api/graphiql' : null,
        introspection: isDev,
        timestamp: new Date().toISOString()
      }
    };
  });
}