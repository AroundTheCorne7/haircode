import { pgTable, uuid, varchar, timestamp, text, smallint, numeric, boolean, date } from "drizzle-orm/pg-core";
import { clients } from "./clients.js";
import { users } from "./users.js";
import { tenants } from "./tenants.js";
export const scalpProfiles = pgTable("scalp_profiles", {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    clientId: uuid("client_id").notNull().references(() => clients.id),
    assessedBy: uuid("assessed_by").notNull().references(() => users.id),
    assessmentDate: date("assessment_date").notNull(),
    biotype: varchar("biotype", { length: 30 }),
    sebumProduction: varchar("sebum_production", { length: 20 }),
    sensitivityLevel: smallint("sensitivity_level"),
    phLevel: numeric("ph_level", { precision: 3, scale: 1 }),
    hasAlopecia: boolean("has_alopecia").notNull().default(false),
    alopeciaType: varchar("alopecia_type", { length: 80 }),
    openLesions: boolean("open_lesions").notNull().default(false),
    microbiomeBalance: varchar("microbiome_balance", { length: 30 }),
    isCurrent: boolean("is_current").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
//# sourceMappingURL=scalp.js.map