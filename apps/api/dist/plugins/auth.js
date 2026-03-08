export async function authPlugin(app) {
    app.decorate("authenticate", async function (request, reply) {
        try {
            await request.jwtVerify();
        }
        catch (err) {
            reply.send(err);
        }
    });
}
//# sourceMappingURL=auth.js.map