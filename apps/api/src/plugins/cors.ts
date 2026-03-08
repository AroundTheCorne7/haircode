import type { FastifyInstance } from "fastify";
import fastifyCors from "@fastify/cors";
import { config } from "../config.js";

export async function corsPlugin(app: FastifyInstance) {
  await app.register(fastifyCors, {
    origin: [config.APP_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
}
