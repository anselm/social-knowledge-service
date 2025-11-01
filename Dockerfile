# Node
FROM node:22-alpine

WORKDIR /app

# Copy the whole repo (monorepo root)
COPY . .

# Install all workspaces
RUN npm install --workspaces

# Build
RUN npm run build

# Drop dev deps across workspaces to slim runtime
RUN npm prune --omit=dev --workspaces

# Some config
ENV NODE_ENV=production
EXPOSE 8080

# Curl for healthcheck
RUN apk add --no-cache curl

# Healthcheck (expects /healthz route)
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD curl -fsS http://localhost:8080/healthz || exit 1

# Start
CMD ["node", "packages/server/dist/server.js"]
