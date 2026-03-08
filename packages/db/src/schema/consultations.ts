import { pgTable, uuid, timestamp, text, jsonb } from "drizzle-orm/pg-core";
import { clients } from "./clients.js";
import { tenants } from "./tenants.js";

export const consultationSessions = pgTable("consultation_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  conductedBy: uuid("conducted_by"),
  status: text("status").notNull().default("draft"),
  stepData: jsonb("step_data"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ConsultationSession = typeof consultationSessions.$inferSelect;
export type NewConsultationSession = typeof consultationSessions.$inferInsert;
