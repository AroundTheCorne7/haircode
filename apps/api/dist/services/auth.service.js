import { db, users, tenantUsers, tenants } from "@haircode/db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
export async function verifyCredentials(email, password, tenantSlug) {
    const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, tenantSlug))
        .limit(1);
    if (!tenant)
        return null;
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
    if (!user?.passwordHash)
        return null;
    // Reject deactivated users (soft-delete / terminated accounts)
    if (!user.isActive)
        return null;
    // Reject accounts that are currently locked out
    if (user.lockedUntil && user.lockedUntil > new Date())
        return null;
    // Reject users that have been soft-deleted
    if (user.deletedAt != null)
        return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
        return null;
    const [membership] = await db
        .select()
        .from(tenantUsers)
        .where(and(eq(tenantUsers.userId, user.id), eq(tenantUsers.tenantId, tenant.id)))
        .limit(1);
    // Reject membership that has been revoked for this tenant
    if (!membership || !membership.isActive)
        return null;
    return {
        user: { id: user.id, email: user.email, role: membership.role },
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    };
}
export async function hashPassword(password) {
    return bcrypt.hash(password, 12);
}
//# sourceMappingURL=auth.service.js.map