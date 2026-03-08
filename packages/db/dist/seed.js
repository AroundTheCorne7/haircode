import { db } from "./client.js";
import { tenants, users, tenantUsers } from "./schema/index.js";
import bcrypt from "bcryptjs";
async function seed() {
    console.log("🌱 Seeding database…");
    const [tenant] = await db
        .insert(tenants)
        .values({
        name: "Salon Lumière",
        slug: "salon-lumiere",
        countryCode: "FR",
        timezone: "Europe/Paris",
        dataResidencyRegion: "eu-west",
    })
        .onConflictDoNothing()
        .returning();
    if (!tenant) {
        console.log("Tenant already exists, skipping seed.");
        process.exit(0);
    }
    console.log(`✓ Tenant: ${tenant.name} (${tenant.slug})`);
    const passwordHash = await bcrypt.hash("haircode-demo-2026", 12);
    const insertedUsers = await db
        .insert(users)
        .values({ email: "admin@salon-lumiere.fr", passwordHash })
        .returning();
    const user = insertedUsers[0];
    if (!user)
        throw new Error("Failed to create user");
    console.log(`✓ User: ${user.email}`);
    await db.insert(tenantUsers).values({
        tenantId: tenant.id,
        userId: user.id,
        role: "owner",
    });
    console.log("✓ Tenant membership created");
    console.log("\n✅ Seed complete!");
    console.log(`\n  Tenant slug:  salon-lumiere`);
    console.log(`  Email:        admin@salon-lumiere.fr`);
    console.log(`  Password:     haircode-demo-2026`);
    process.exit(0);
}
seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map