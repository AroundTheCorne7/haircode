import fastifyRateLimit from "@fastify/rate-limit";
export async function rateLimitPlugin(app) {
    await app.register(fastifyRateLimit, {
        max: 100,
        timeWindow: "1 minute",
        errorResponseBuilder: (_request, context) => ({
            error: {
                code: "RATE_LIMIT_EXCEEDED",
                message: `Rate limit exceeded. Retry in ${context.after}`,
                status: 429,
            },
        }),
    });
}
//# sourceMappingURL=rate-limit.js.map