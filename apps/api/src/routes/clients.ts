import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  listClients,
  getClientById,
  getClientFullProfile,
  createClient,
} from "../services/client.service.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CreateClientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  primaryEmail: z.string().email().optional(),
  primaryPhone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gdprConsentGiven: z.literal(true, {
    errorMap: () => ({ message: "GDPR consent must be explicitly granted before creating a client record." }),
  }),
});

export async function clientRoutes(app: FastifyInstance) {
  app.get("/", async (req, reply) => {
    const { tenantId } = req.user as { tenantId: string };
    const { search } = req.query as Record<string, string>;
    if (search !== undefined && (typeof search !== "string" || search.length > 200)) {
      return reply.code(400).send({ error: { code: "INVALID_PARAM", message: "search must be a string of max 200 characters", status: 400 } });
    }
    try {
      const result = await listClients(tenantId, search);
      return reply.send({ data: result, total: result.length });
    } catch (err) {
      req.log.error(err);
      return reply.status(500).send({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", status: 500 } });
    }
  });

  app.post("/", async (req, reply) => {
    const { tenantId } = req.user as { tenantId: string };
    const body = CreateClientSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(422).send({
        error: { code: "VALIDATION_ERROR", message: "Invalid request body", status: 422, details: body.error.flatten() },
      });
    }
    try {
      const client = await createClient({ ...body.data, tenantId });
      return reply.status(201).send({ data: client });
    } catch (err) {
      req.log.error(err);
      return reply.status(500).send({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", status: 500 } });
    }
  });

  app.get("/:id", async (req, reply) => {
    const { tenantId } = req.user as { tenantId: string };
    const { id } = req.params as { id: string };
    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({ error: { code: "INVALID_ID", message: "Client ID must be a valid UUID", status: 400 } });
    }
    try {
      const client = await getClientById(tenantId, id);
      if (!client) return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Client not found", status: 404 } });
      return reply.send({ data: client });
    } catch (err) {
      req.log.error(err);
      return reply.status(500).send({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", status: 500 } });
    }
  });

  app.get("/:id/full-profile", async (req, reply) => {
    const { tenantId } = req.user as { tenantId: string };
    const { id } = req.params as { id: string };
    if (!UUID_REGEX.test(id)) {
      return reply.status(400).send({ error: { code: "INVALID_ID", message: "Client ID must be a valid UUID", status: 400 } });
    }
    try {
      const profile = await getClientFullProfile(tenantId, id);
      if (!profile) return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Client not found", status: 404 } });
      return reply.send({ data: profile });
    } catch (err) {
      req.log.error(err);
      return reply.status(500).send({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", status: 500 } });
    }
  });
}
