
# Multi-stage build for Cloud Run deployment
FROM --platform=linux/amd64 node:22-alpine AS build

WORKDIR /app

# Copy root package files and .env
COPY package*.json ./
COPY .env ./
COPY tsconfig*.json ./

# Copy all packages
COPY packages/ ./packages/

# Install all dependencies
RUN npm install --workspaces

# Build all packages
RUN npm run build

# Production stage
FROM --platform=linux/amd64 node:22-alpine AS production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache curl ca-certificates

# Copy package files first for better caching
COPY --from=build /app/package*.json ./
COPY --from=build /app/.env ./
COPY --from=build /app/packages/server/package.json ./packages/server/
COPY --from=build /app/packages/knowledge/package.json ./packages/knowledge/
COPY --from=build /app/packages/web/package.json ./packages/web/

# Install production dependencies
RUN npm install --workspaces --omit=dev

# Copy built application
COPY --from=build /app/packages/server/dist/ ./packages/server/dist/
COPY --from=build /app/packages/knowledge/dist/ ./packages/knowledge/dist/
COPY --from=build /app/packages/web/dist/ ./packages/web/dist/

# Set environment
ENV NODE_ENV=production
ENV DOCKER_ENV=true
ENV PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=15s --timeout=3s --retries=10 --start-period=20s \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the server directly
CMD ["node", "packages/server/dist/index.js"]

