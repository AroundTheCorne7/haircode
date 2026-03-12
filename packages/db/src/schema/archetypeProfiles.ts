import {
  pgTable,
  uuid,
  varchar,
  smallint,
  timestamp,
  boolean,
  date,
  text,
  numeric,
} from "drizzle-orm/pg-core";
import { clients } from "./clients.js";
import { users } from "./users.js";
import { tenants } from "./tenants.js";

/**
 * Archetype Identity profile — Layer 5 in the 6-layer methodology.
 * Stores the client's primary and optional secondary archetype with blend weights.
 *
 * Archetypes: natural | elegant | dramatic | classic | creative | sensual
 * primaryWeight + secondaryWeight must sum to 100 when both are set.
 * secondaryArchetype and secondaryWeight are nullable (pure archetype = no blend).
 */
export const archetypeProfiles = pgTable("archetype_profiles", {
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

  // Primary archetype — always required
  primaryArchetype: varchar("primary_archetype", { length: 30 }).notNull(),
  // 50–100 when no secondary, otherwise 51–90
  primaryWeight: smallint("primary_weight").notNull(),

  // Secondary archetype — optional (null = pure archetype)
  secondaryArchetype: varchar("secondary_archetype", { length: 30 }),
  // 10–49 when present, null otherwise
  secondaryWeight: smallint("secondary_weight"),

  // Lifestyle / activity level — informs feasibility layer
  lifestyleActivityLevel: varchar("lifestyle_activity_level", { length: 20 }), // low | medium | high

  // Maintenance commitment expressed by client
  maintenanceCommitment: varchar("maintenance_commitment", { length: 20 }), // minimal | moderate | intensive

  isCurrent: boolean("is_current").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ArchetypeProfile = typeof archetypeProfiles.$inferSelect;
export type NewArchetypeProfile = typeof archetypeProfiles.$inferInsert;
