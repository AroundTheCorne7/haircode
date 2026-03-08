import postgres from "postgres";
import * as schema from "./schema/index.js";
export declare const db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
    $client: postgres.Sql<{}>;
};
export type DB = typeof db;
//# sourceMappingURL=client.d.ts.map