const PUBLIC_ROUTES = new Set(["/health", "/auth/login", "/auth/refresh", "/auth/forgot-password", "/auth/reset-password"]);
export async function tenantMiddleware(request, reply) {
    const path = (request.url ?? "").split("?").at(0) ?? "";
    if (PUBLIC_ROUTES.has(path))
        return;
    try {
        await request.jwtVerify();
    }
    catch {
        await reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Authentication required", status: 401 } });
        return;
    }
    const payload = request.user;
    if (!payload.tenantId) {
        await reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Invalid token: missing tenantId", status: 401 } });
        return;
    }
}
//# sourceMappingURL=tenant.js.map