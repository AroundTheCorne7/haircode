import { pgTable, uuid, varchar, timestamp, text, boolean, smallint, numeric, jsonb, date } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.js";
import { clients } from "./clients.js";
import { users } from "./users.js";
import { scoringLogs } from "./engine.js";

export const protocols = pgTable("protocols", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  name: varchar("name", { length: 255 }).notNull(),
  objective: text("objective"),
  module: varchar("module", { length: 50 }).notNull().default("multi"),
  status: varchar("status", { length: 30 }).notNull().default("draft"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  scoringLogId: uuid("scoring_log_id").references(() => scoringLogs.id),
  startedAt: date("started_at"),
  estimatedEndAt: date("estimated_end_at"),
  completedAt: date("completed_at"),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  lockedBy: uuid("locked_by").references(() => users.id),
  clientVisible: boolean("client_visible").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const protocolVersions = pgTable("protocol_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  protocolId: uuid("protocol_id").notNull().references(() => protocols.id),
  versionNumber: smallint("version_number").notNull(),
  changeType: varchar("change_type", { length: 50 }).notNull().default("initial"),
  changeSummary: text("change_summary"),
  snapshotData: jsonb("snapshot_data").notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(false),
});

export const protocolPhases = pgTable("protocol_phases", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  protocolId: uuid("protocol_id").notNull().references(() => protocols.id),
  protocolVersionId: uuid("protocol_version_id").notNull().references(() => protocolVersions.id),
  phaseOrder: smallint("phase_order").notNull(),
  phaseType: varchar("phase_type", { length: 30 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  durationWeeks: smallint("duration_weeks"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  successCriteria: jsonb("success_criteria"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Protocol = typeof protocols.$inferSelect;
export type NewProtocol = typeof protocols.$inferInsert;
