import Fastify from "fastify";
import dotenv from "dotenv";
import cors from "@fastify/cors";

//import { EntityService } from "@social/bus";
//import { registerRoutes } from "@social/services";
//import { makeMemoryPort } from "@social/traffic";

dotenv.config()

const app = Fastify()
await app.register(cors, { origin: true })

// @todo use my config
const port = Number(process.env.PORT ?? 8080)
const mongo = process.env.MONGO_URL || "mongodb://localhost:27017"

/*
async function chooseDb() {
  const uri = process.env.MONGO_URL;
  const dbName = process.env.MONGO_DB ?? "appdb";
  const collection = process.env.MONGO_COLLECTION ?? "entities";
  if (uri) {
    const mongo = await makeMongoPort({ uri, dbName, collection });
    app.addHook("onClose", async () => { await mongo.client.close(); });
    return mongo as any;
  }
  return makeMemoryPort();
}

const db = await chooseDb();
const service = new EntityService(db);
*/

//registerRoutes(app, service);

const server = await app.listen({ port });
console.log(`Server listening on http://localhost:${port}`);

const close = async () => {
  try { await app.close(); } finally { process.exit(0); }
};
process.on("SIGINT", close);
process.on("SIGTERM", close);
