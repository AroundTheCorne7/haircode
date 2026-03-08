import { pgTable, uuid, varchar, timestamp, text, numeric, boolean, date, jsonb } from "drizzle-orm/pg-core";
import { clients } from "./clients.js";
import { users } from "./users.js";
import { tenants } from "./tenants.js";

export const morphologyProfiles = pgTable("morphology_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  assessedBy: uuid("assessed_by").notNull().references(() => users.id),
  assessmentDate: date("assessment_date").notNull(),
  faceShape: varchar("face_shape", { length: 50 }),
  contrastLevel: varchar("contrast_level", { length: 20 }),
  styleEssence: varchar("style_essence", { length: 50 }),
  undertone: varchar("undertone", { length: 20 }),
  symmetryScore: numeric("symmetry_score", { precision: 5, scale: 4 }),
  landmarks: jsonb("landmarks"),
  recommendedStyles: jsonb("recommended_styles"),
  isCurrent: boolean("is_current").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MorphologyProfile = typeof morphologyProfiles.$inferSelect;
export type NewMorphologyProfile = typeof morphologyProfiles.$inferInsert;
