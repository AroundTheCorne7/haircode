import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export async function authPlugin(app: FastifyInstance) {
  app.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }
  );
}
