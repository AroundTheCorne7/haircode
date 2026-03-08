import { pgTable, uuid, varchar, timestamp, text, smallint, numeric, boolean, date } from "drizzle-orm/pg-core";
import { clients } from "./clients.js";
import { users } from "./users.js";
import { tenants } from "./tenants.js";

export const bodyProfiles = pgTable("body_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  assessedBy: uuid("assessed_by").notNull().references(() => users.id),
  assessmentDate: date("assessment_date").notNull(),
  hormonalIndex: smallint("hormonal_index"),
  nutritionalScore: smallint("nutritional_score"),
  stressIndex: smallint("stress_index"),
  hydrationPct: numeric("hydration_pct", { precision: 5, scale: 2 }),
  dietType: varchar("diet_type", { length: 50 }),
  activityLevel: varchar("activity_level", { length: 30 }),
  sleepQualityScore: smallint("sleep_quality_score"),
  isCurrent: boolean("is_current").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BodyProfile = typeof bodyProfiles.$inferSelect;
export type NewBodyProfile = typeof bodyProfiles.$inferInsert;
