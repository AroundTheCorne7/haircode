import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  numeric,
  boolean,
  date,
  jsonb,
} from "drizzle-orm/pg-core";
import { clients } from "./clients.js";
import { users } from "./users.js";
import { tenants } from "./tenants.js";

export const morphologyProfiles = pgTable("morphology_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  assessedBy: uuid("assessed_by")
    .notNull()
    .references(() => users.id),
  assessmentDate: date("assessment_date").notNull(),
  // Face morphology — spec values: oval | round | square | heart | diamond | rectangular
  faceShape: varchar("face_shape", { length: 50 }),
  // Contrast score 1–5 (very_low | low | medium | high | extreme)
  contrastScore: varchar("contrast_score", { length: 20 }),
  /** @deprecated use contrastScore */
  contrastLevel: varchar("contrast_level", { length: 20 }),
  styleEssence: varchar("style_essence", { length: 50 }),
  undertone: varchar("undertone", { length: 20 }),
  symmetryScore: numeric("symmetry_score", { precision: 5, scale: 4 }),
  landmarks: jsonb("landmarks"),
  recommendedStyles: jsonb("recommended_styles"),
  // Body morphology
  neckLength: varchar("neck_length", { length: 20 }), // short | medium | long
  shoulders: varchar("shoulders", { length: 20 }), // narrow | balanced | wide
  bodyType: varchar("body_type", { length: 30 }), // hourglass | rectangle | triangle | inverted_triangle
  isCurrent: boolean("is_current").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type MorphologyProfile = typeof morphologyProfiles.$inferSelect;
export type NewMorphologyProfile = typeof morphologyProfiles.$inferInsert;
