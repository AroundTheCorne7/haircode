import { z } from "zod";
import { verifyCredentials } from "../services/auth.service.js";
const loginBodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    tenantSlug: z.string().min(1),
});
export async function authRoutes(app) {
    app.post("/login", async (request, reply) => {
        const body = loginBodySchema.safeParse(request.body);
        if (!body.success) {
            return reply.code(422).send({
                error: { code: "VALIDATION_ERROR", message: "Invalid request body", status: 422, details: body.error.flatten() },
            });
        }
        const credentials = await verifyCredentials(body.data.email, body.data.password, body.data.tenantSlug);
        if (!credentials) {
            return reply.code(401).send({
                error: { code: "INVALID_CREDENTIALS", message: "Invalid email, password, or tenant", status: 401 },
            });
        }
        const accessToken = app.jwt.sign({ sub: credentials.user.id, tenantId: credentials.tenant.id, roles: [credentials.user.role] }, { expiresIn: "15m" });
        return reply.send({ accessToken, tokenType: "Bearer", expiresIn: 900 });
    });
    app.post("/refresh", async (request, reply) => {
        // TODO: Implement refresh token rotation
        return reply.code(501).send({ error: { code: "NOT_IMPLEMENTED", message: "Refresh not yet implemented", status: 501 } });
    });
    app.post("/logout", async (_request, reply) => {
        reply.clearCookie("hc_refresh");
        return reply.code(204).send();
    });
}
//# sourceMappingURL=auth.js.map