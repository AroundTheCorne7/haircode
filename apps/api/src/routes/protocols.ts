import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  listProtocolsForClient,
  generateProtocol,
} from "../services/protocol.service.js";
import type { GenerateProtocolInput } from "../services/protocol.service.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const GenerateProtocolSchema = z.object({
  hair: z.object({
    texture: z.string(),
    density: z.union([z.string(), z.number()]),
    porosity: z.string(),
    elasticity: z.string(),
    damageIndex: z.number().min(0).max(10),
    chemicalHistory: z.array(z.string()).optional(),
  }),
  scalp: z.object({
    biotype: z.string(),
    sebumProduction: z.union([z.string(), z.number()]), // range input returns string "1"–"4"
    sensitivityLevel: z.number().min(1).max(5), // wizard field name
    phLevel: z.number().min(0).max(14).optional(),
    conditions: z.array(z.string()).optional(),
    openLesions: z.boolean().optional(), // derived from conditions if absent
  }),
  body: z
    .object({
      sleepQualityScore: z.number().min(1).max(10),
      stressIndex: z.number().min(1).max(10),
      activityLevel: z.string(),
      dietType: z.string().optional(),
      hormonalEvents: z.array(z.string()).optional(),
    })
    .optional(),
  morphology: z
    .object({
      faceShape: z.string(),
      undertone: z.string(),
      symmetryScore: z.number().min(0).max(100),
    })
    .optional(),
});

export async function protocolRoutes(app: FastifyInstance) {
  app.get("/clients/:clientId/protocols", async (req, reply) => {
    const { tenantId } = req.user as { tenantId: string };
    const { clientId } = req.params as { clientId: string };
    if (!UUID_REGEX.test(clientId)) {
      return reply
        .status(400)
        .send({
          error: {
            code: "INVALID_ID",
            message: "Client ID must be a valid UUID",
            status: 400,
          },
        });
    }
    try {
      const result = await listProtocolsForClient(tenantId, clientId);
      return reply.send({ data: result, total: result.length });
    } catch (err) {
      req.log.error(err);
      return reply
        .status(500)
        .send({
          error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred",
            status: 500,
          },
        });
    }
  });

  app.post("/clients/:clientId/protocols/generate", async (req, reply) => {
    const { tenantId, sub } = req.user as { tenantId: string; sub: string };
    const { clientId } = req.params as { clientId: string };
    if (!UUID_REGEX.test(clientId)) {
      return reply
        .status(400)
        .send({
          error: {
            code: "INVALID_ID",
            message: "Client ID must be a valid UUID",
            status: 400,
          },
        });
    }
    const parsed = GenerateProtocolSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid protocol input",
          status: 422,
          details: parsed.error.flatten(),
        },
      });
    }
    try {
      const { protocol, result } = await generateProtocol(
        tenantId,
        clientId,
        sub,
        parsed.data as unknown as GenerateProtocolInput,
      );
      return reply.status(201).send({ data: { protocol, evaluation: result } });
    } catch (err: any) {
      if (err?.statusCode === 404) {
        return reply
          .status(404)
          .send({
            error: { code: "NOT_FOUND", message: err.message, status: 404 },
          });
      }
      // Expose full error detail in logs so the real cause is visible (not swallowed by the global handler)
      console.error("[protocols/generate] Unhandled error:", err);
      req.log.error(err);
      return reply
        .status(500)
        .send({
          error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred",
            status: 500,
          },
        });
    }
  });
}
