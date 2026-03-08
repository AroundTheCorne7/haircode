import type { FastifyInstance } from "fastify";
import { z } from "zod";

const evaluateSchema = z.object({
  clientId: z.string(),
  modules: z.array(z.enum(["hair", "scalp", "body", "morphology"])).default(["hair", "scalp", "body", "morphology"]),
  includeTrace: z.boolean().default(false),
});

export async function engineRoutes(app: FastifyInstance) {
  app.post("/evaluate", async (request, reply) => {
    const body = evaluateSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(422).send({ error: { code: "VALIDATION_ERROR", message: "Invalid evaluation request", status: 422 } });
    }
    // TODO: Run @haircode/engine evaluate()
    return reply.send({
      evaluationId: "evl_demo",
      clientId: body.data.clientId,
      evaluatedAt: new Date().toISOString(),
      recommendations: [],
    });
  });

  app.get("/rules", async (_request, reply) => {
    // TODO: Query rules from DB
    return reply.send({ data: [], pagination: { hasNextPage: false } });
  });

  app.get("/weights", async (_request, reply) => {
    return reply.send({ weights: { hair: 0.35, scalp: 0.30, body: 0.20, morphology: 0.15 }, version: 1 });
  });

  const weightsSchema = z.object({
    hair: z.number().min(0).max(1),
    scalp: z.number().min(0).max(1),
    body: z.number().min(0).max(1),
    morphology: z.number().min(0).max(1),
  }).refine((w) => Math.abs(w.hair + w.scalp + w.body + w.morphology - 1) < 0.001, {
    message: "Weights must sum to 1.0",
  });

  app.put("/weights", async (request, reply) => {
    const user = request.user as { roles?: string[] };
    if (!user.roles?.includes("admin")) {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "Admin role required", status: 403 } });
    }
    const body = weightsSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(422).send({ error: { code: "VALIDATION_ERROR", message: "Invalid weights", status: 422, details: body.error.flatten() } });
    }
    // TODO: Persist weights to DB
    return reply.send({ message: "Weights updated", weights: body.data });
  });
}
