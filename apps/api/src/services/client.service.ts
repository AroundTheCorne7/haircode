import { db, clients, hairProfiles, scalpProfiles, bodyProfiles, morphologyProfiles } from "@haircode/db";
import { eq, and, ilike, desc } from "drizzle-orm";

export interface CreateClientInput {
  tenantId: string;
  firstName: string;
  lastName: string;
  clientRef?: string | undefined;
  primaryEmail?: string | undefined;
  primaryPhone?: string | undefined;
  dateOfBirth?: string | undefined;
  // Must be literal true — false is rejected by the route's z.literal(true) schema
  gdprConsentGiven: true;
}

export async function listClients(tenantId: string, search?: string) {
  return db
    .select()
    .from(clients)
    .where(
      search
        ? and(eq(clients.tenantId, tenantId), ilike(clients.firstName, `%${search.replace(/[%_\\]/g, "\\$&")}%`))
        : eq(clients.tenantId, tenantId)
    )
    .orderBy(desc(clients.createdAt))
    .limit(100);
}

export async function getClientById(tenantId: string, clientId: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.tenantId, tenantId), eq(clients.id, clientId)))
    .limit(1);

  return client ?? null;
}

export async function getClientFullProfile(tenantId: string, clientId: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.tenantId, tenantId), eq(clients.id, clientId)))
    .limit(1);

  if (!client) return null;

  const [hair] = await db
    .select()
    .from(hairProfiles)
    .where(and(eq(hairProfiles.tenantId, tenantId), eq(hairProfiles.clientId, clientId), eq(hairProfiles.isCurrent, true)))
    .limit(1);

  const [scalp] = await db
    .select()
    .from(scalpProfiles)
    .where(and(eq(scalpProfiles.tenantId, tenantId), eq(scalpProfiles.clientId, clientId), eq(scalpProfiles.isCurrent, true)))
    .limit(1);

  const [body] = await db
    .select()
    .from(bodyProfiles)
    .where(and(eq(bodyProfiles.tenantId, tenantId), eq(bodyProfiles.clientId, clientId), eq(bodyProfiles.isCurrent, true)))
    .limit(1);

  const [morphology] = await db
    .select()
    .from(morphologyProfiles)
    .where(and(eq(morphologyProfiles.tenantId, tenantId), eq(morphologyProfiles.clientId, clientId), eq(morphologyProfiles.isCurrent, true)))
    .limit(1);

  return { client, hair, scalp, body, morphology };
}

export async function createClient(input: CreateClientInput) {
  const ref = input.clientRef ?? `CLI-${Date.now()}`;

  const [created] = await db
    .insert(clients)
    .values({
      tenantId: input.tenantId,
      clientRef: ref,
      firstName: input.firstName,
      lastName: input.lastName,
      primaryEmail: input.primaryEmail ?? null,
      primaryPhone: input.primaryPhone ?? null,
      dateOfBirth: input.dateOfBirth ?? null,
      gdprConsentGiven: input.gdprConsentGiven,
      // gdprConsentGiven is always true here (enforced by z.literal(true) at route layer)
      gdprConsentGivenAt: new Date(),
    })
    .returning();

  return created;
}
