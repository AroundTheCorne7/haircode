import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifySensible from "@fastify/sensible";
import fastifyHelmet from "@fastify/helmet";
import { config } from "./config.js";
import { authRoutes } from "./routes/auth.js";
import { clientRoutes } from "./routes/clients.js";
import { engineRoutes } from "./routes/engine.js";
import { protocolRoutes } from "./routes/protocols.js";
import { tenantMiddleware } from "./plugins/tenant.js";
import { rateLimitPlugin } from "./plugins/rate-limit.js";

export async function buildApp() {
  const app = Fastify({
    logger: config.NODE_ENV !== "production"
      ? { level: "debug", transport: { target: "pino-pretty", options: { colorize: true } } }
      : { level: "info" },
  });

  await app.register(fastifyHelmet);
  await app.register(fastifySensible);
  await app.register(rateLimitPlugin);
  await app.register(fastifyCookie);
  await app.register(fastifyJwt, {
    secret: config.JWT_SECRET,
    cookie: { cookieName: "hc_refresh", signed: false },
  });
  await app.register(fastifyCors, {
    origin: [config.APP_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  // Global error handler — prevents leaking DB/internal errors
  app.setErrorHandler((error: { statusCode?: number; code?: string; message: string }, _request, reply) => {
    app.log.error(error);
    const status = error.statusCode ?? 500;
    if (status < 500) {
      return reply.status(status).send({
        error: { code: error.code ?? "CLIENT_ERROR", message: error.message, status },
      });
    }
    return reply.status(500).send({
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", status: 500 },
    });
  });

  // Multi-tenant middleware
  app.addHook("preHandler", tenantMiddleware);

  // Health check
  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  // Routes
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(clientRoutes, { prefix: "/clients" });
  await app.register(engineRoutes, { prefix: "/engine" });
  await app.register(protocolRoutes, { prefix: "" });

  return app;
}
