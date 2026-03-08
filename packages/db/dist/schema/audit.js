import { pgTable, uuid, timestamp, text, jsonb } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.js";
export const auditLogs = pgTable("audit_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
        .notNull()
        .references(() => tenants.id),
    actorId: uuid("actor_id"),
    actorType: text("actor_type").notNull().default("user"),
    action: text("action").notNull(),
    resourceType: text("resource_type"),
    resourceId: uuid("resource_id"),
    payload: jsonb("payload"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
//# sourceMappingURL=audit.js.map