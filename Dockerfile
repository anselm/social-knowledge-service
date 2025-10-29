# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY packages ./packages
RUN corepack enable || true
RUN npm i
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# copy node_modules for runtime and built dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://localhost:3000/healthz || exit 1
CMD ["node", "packages/app/dist/server.js"]
