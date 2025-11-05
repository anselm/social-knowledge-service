# Node
FROM node:22-alpine

WORKDIR /app

# Copy the whole repo (monorepo root)
COPY . .

# Install all workspaces
RUN npm install --workspaces

# Build
RUN npm run build

# Copy and set up startup script
COPY docker-start.sh /app/docker-start.sh
RUN chmod +x /app/docker-start.sh

# Some config
ENV NODE_ENV=production
EXPOSE 8080

# Curl and netcat for healthcheck and startup script
RUN apk add --no-cache curl netcat-openbsd

# Healthcheck (expects /healthz route)
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD curl -fsS http://localhost:8080/healthz || exit 1

# Start with seed loading (keep dev deps for tsx during runtime)
CMD ["/app/docker-start.sh"]
