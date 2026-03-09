import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
export async function runMigrations() {
    const connectionString = process.env["DATABASE_URL"];
    if (!connectionString)
        throw new Error("DATABASE_URL is not set");
    // Separate client for migrations (max 1 connection)
    const migrationClient = postgres(connectionString, {
        max: 1,
        connect_timeout: 10,
        ssl: process.env["NODE_ENV"] === "production" ? { rejectUnauthorized: false } : false,
    });
    const db = drizzle(migrationClient);
    console.log("Running database migrations...");
    await migrate(db, {
        migrationsFolder: join(__dirname, "../migrations"),
    });
    console.log("Migrations complete.");
    await migrationClient.end();
}
//# sourceMappingURL=migrate.js.map