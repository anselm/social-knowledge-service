import Fastify from "fastify";
import { registerRoutes } from "./httpRoutes.js";

const app = Fastify({
  logger: true
});

// Register routes
registerRoutes(app);

// Add a simple hello world route
app.get("/", async () => {
  return { message: "Hello World from Traffic Server!" };
});

const start = async () => {
  try {
    await app.listen({ port: 8080, host: "0.0.0.0" });
    console.log("🚀 Traffic server running on http://localhost:8080");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();