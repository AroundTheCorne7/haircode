import { pgTable, uuid, varchar, timestamp, text, smallint, numeric, boolean, date } from "drizzle-orm/pg-core";
import { clients } from "./clients.js";
import { users } from "./users.js";
import { tenants } from "./tenants.js";
export const hairProfiles = pgTable("hair_profiles", {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    clientId: uuid("client_id").notNull().references(() => clients.id),
    assessedBy: uuid("assessed_by").notNull().references(() => users.id),
    assessmentDate: date("assessment_date").notNull(),
    texture: varchar("texture", { length: 30 }),
    density: varchar("density", { length: 20 }),
    strandDiameter: varchar("strand_diameter", { length: 20 }),
    porosity: varchar("porosity", { length: 20 }),
    elasticity: varchar("elasticity", { length: 20 }),
    moistureProteinBalance: varchar("moisture_protein_balance", { length: 30 }),
    damageIndex: smallint("damage_index"),
    lengthCm: numeric("length_cm", { precision: 5, scale: 1 }),
    isCurrent: boolean("is_current").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
//# sourceMappingURL=hair.js.map