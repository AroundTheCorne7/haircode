import { buildApp } from "./app.js";
import { config } from "./config.js";
import { runMigrations } from "@haircode/db";
async function main() {
    await runMigrations();
    const app = await buildApp();
    try {
        await app.listen({ port: config.PORT, host: "0.0.0.0" });
        console.log(`🚀 HairCode API running on port ${config.PORT}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map