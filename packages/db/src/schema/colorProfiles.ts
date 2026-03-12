import {
  pgTable,
  uuid,
  varchar,
  smallint,
  timestamp,
  boolean,
  date,
  text,
} from "drizzle-orm/pg-core";
import { clients } from "./clients.js";
import { users } from "./users.js";
import { tenants } from "./tenants.js";

/**
 * Color Identity profile — Layer 4 in the 6-layer methodology.
 * Stores the client's colour season, contrast score, undertone, and
 * natural hair colour used by the Color Season engine.
 *
 * colorSeason: spring | summer | autumn | winter  (classic 4-season system)
 * contrastScore: 1–5 (1=very_low, 2=low, 3=medium, 4=high, 5=extreme)
 * undertone: warm | neutral | cool
 * naturalHairColor: ash_blonde | golden_blonde | light_brown | medium_brown | dark_brown | black | red | grey | white
 */
export const colorProfiles = pgTable("color_profiles", {
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

  // 4-season classification
  colorSeason: varchar("color_season", { length: 20 }),

  // 1–5 numeric contrast scale
  contrastScore: smallint("contrast_score"),

  // warm | neutral | cool
  undertone: varchar("undertone", { length: 20 }),

  // Client's natural/current base hair colour
  naturalHairColor: varchar("natural_hair_color", { length: 50 }),

  // Eye colour — used to cross-validate season
  eyeColor: varchar("eye_color", { length: 50 }),

  isCurrent: boolean("is_current").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ColorProfile = typeof colorProfiles.$inferSelect;
export type NewColorProfile = typeof colorProfiles.$inferInsert;
