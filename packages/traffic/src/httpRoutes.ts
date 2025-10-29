import type { FastifyInstance } from "fastify";

//import type { EntityService } from "@y/core-db";

export function registerRoutes(app: FastifyInstance ) { //, service: EntityService) {
  app.get("/healthz", async () => ({ ok: true }));
/*
  app.get("/query", async (req) => {
    const text = (req.query as any)?.text as string | undefined;
    return service.query({ text });
  });

  app.get("/entity/:id", async (req, res) => {
    const id = (req.params as any).id as string;
    const e = await service.getOrThrow(id);
    return res.send(e);
  });

  app.post("/entity/:id", async (req, res) => {
    const id = (req.params as any).id as string;
    const body = (req.body as any) ?? {};
    const saved = await service.saveName(id, body.name ?? "unnamed");
    return res.send(saved);
  });
*/
}
