import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  jsonb,
  text,
} from "drizzle-orm/pg-core";
import { clients } from "./clients.js";
import { users } from "./users.js";
import { tenants } from "./tenants.js";
import { protocols } from "./protocols.js";

/**
 * Transformation Blueprint — the rich output of the full 6-layer engine.
 * Replaces the simple "service list + phase" with a structured design
 * covering hair design, color strategy, technical roadmap, and treatment.
 *
 * The jsonb columns store the structured blueprint sections.
 * A blueprint links to the associated protocol record (optional — some
 * blueprints may be standalone before a formal protocol is saved).
 */
export const transformationBlueprints = pgTable("transformation_blueprints", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  protocolId: uuid("protocol_id").references(() => protocols.id),

  // Engine output metadata
  phase: varchar("phase", { length: 30 }), // stabilization | transformation | integration
  analysisScore: varchar("analysis_score", { length: 10 }),
  engineVersion: varchar("engine_version", { length: 20 }),

  /**
   * hairDesign: {
   *   recommendedLength: string,
   *   recommendedShape: string,
   *   forbiddenLengths: string[],
   *   forbiddenShapes: string[],
   *   rationale: string
   * }
   */
  hairDesign: jsonb("hair_design"),

  /**
   * colorStrategy: {
   *   season: string,
   *   contrastScore: number,
   *   recommendedTechniques: string[],
   *   avoidTechniques: string[],
   *   recommendedTones: string[],
   *   avoidTones: string[],
   *   contraindications: string[]
   * }
   */
  colorStrategy: jsonb("color_strategy"),

  /**
   * technicalRoadmap: {
   *   phases: Array<{ name, duration, services, checkpoints }>,
   *   totalDurationWeeks: number,
   *   visitFrequencyWeeks: number
   * }
   */
  technicalRoadmap: jsonb("technical_roadmap"),

  /**
   * treatmentProtocol: {
   *   homecare: string[],
   *   inSalon: string[],
   *   contraindications: string[]
   * }
   */
  treatmentProtocol: jsonb("treatment_protocol"),

  /**
   * archetypeBlend: {
   *   primary: string, primaryWeight: number,
   *   secondary?: string, secondaryWeight?: number
   * }
   */
  archetypeBlend: jsonb("archetype_blend"),

  /** Cross-layer conflicts resolved and any flags raised */
  conflictResolution: jsonb("conflict_resolution"),

  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TransformationBlueprint =
  typeof transformationBlueprints.$inferSelect;
export type NewTransformationBlueprint =
  typeof transformationBlueprints.$inferInsert;
