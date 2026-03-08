import { pgTable, uuid, varchar, boolean, timestamp, text } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
  locale: varchar("locale", { length: 10 }).notNull().default("en-GB"),
  isActive: boolean("is_active").notNull().default(true),
  gdprDpaSignedAt: timestamp("gdpr_dpa_signed_at", { withTimezone: true }),
  dataResidencyRegion: varchar("data_residency_region", { length: 50 }).notNull().default("eu-west-1"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
