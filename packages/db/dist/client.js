import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";
const connectionString = process.env["DATABASE_URL"];
if (!connectionString)
    throw new Error("DATABASE_URL is not set");
const queryClient = postgres(connectionString, {
    ssl: process.env["NODE_ENV"] === "production" ? { rejectUnauthorized: false } : false,
});
export const db = drizzle(queryClient, { schema });
//# sourceMappingURL=client.js.map