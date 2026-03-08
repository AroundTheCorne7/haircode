import { pgTable, uuid, varchar, boolean, timestamp, text, date } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.js";
import { users } from "./users.js";
export const clients = pgTable("clients", {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    clientRef: varchar("client_ref", { length: 50 }).notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    preferredName: varchar("preferred_name", { length: 100 }),
    dateOfBirth: date("date_of_birth"),
    primaryEmail: varchar("primary_email", { length: 320 }),
    primaryPhone: varchar("primary_phone", { length: 30 }),
    assignedPractitionerId: uuid("assigned_practitioner_id").references(() => users.id),
    gdprConsentGiven: boolean("gdpr_consent_given").notNull().default(false),
    gdprConsentGivenAt: timestamp("gdpr_consent_given_at", { withTimezone: true }),
    notes: text("notes"),
    isActive: boolean("is_active").notNull().default(true),
    lastVisitAt: timestamp("last_visit_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    erasedAt: timestamp("erased_at", { withTimezone: true }),
});
//# sourceMappingURL=clients.js.map