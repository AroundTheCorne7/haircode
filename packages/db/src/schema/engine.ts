import { pgTable, uuid, varchar, timestamp, text, boolean, smallint, numeric, jsonb, date } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.js";
import { users } from "./users.js";
import { clients } from "./clients.js";

export const ruleSets = pgTable("rule_sets", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  name: varchar("name", { length: 200 }).notNull(),
  module: varchar("module", { length: 50 }).notNull(),
  version: varchar("version", { length: 20 }).notNull().default("1.0.0"),
  isActive: boolean("is_active").notNull().default(true),
  priority: smallint("priority").notNull().default(100),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rules = pgTable("rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  ruleSetId: uuid("rule_set_id").notNull().references(() => ruleSets.id),
  name: varchar("name", { length: 200 }).notNull(),
  moduleScope: varchar("module_scope", { length: 50 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  priority: smallint("priority").notNull().default(100),
  weight: numeric("weight", { precision: 6, scale: 4 }).notNull().default("1.0"),
  condition: jsonb("condition").notNull(),
  actions: jsonb("actions").notNull(),
  conflictStrategy: varchar("conflict_strategy", { length: 30 }).notNull().default("highest_priority"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scoringLogs = pgTable("scoring_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  triggeredBy: uuid("triggered_by").references(() => users.id),
  evaluatedAt: timestamp("evaluated_at", { withTimezone: true }).notNull().defaultNow(),
  inputSnapshot: jsonb("input_snapshot").notNull(),
  dimensionScores: jsonb("dimension_scores").notNull(),
  aggregateScore: numeric("aggregate_score", { precision: 7, scale: 4 }).notNull(),
  recommendations: jsonb("recommendations"),
  executionMs: smallint("execution_ms"),
  schemaVersion: varchar("schema_version", { length: 10 }).notNull().default("1"),
});
