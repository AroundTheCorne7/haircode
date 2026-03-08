/**
 * Clients API Integration Tests
 * Based purely on: HairCode™ Formal System Specifications v1.0.0
 * Spec §2 — Clients API
 * Spec §8 — GDPR Compliance Spec
 * Spec §9.2 — UUID Validation on ID Parameters
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
// ---------------------------------------------------------------------------
// Test helpers — adjust import paths to match actual project structure
// ---------------------------------------------------------------------------
let app;
/**
 * Mint a JWT for tenant A (the "home" tenant used in most tests).
 * The actual helper implementation will depend on the app's JWT signing.
 * We import the test helper here and call it with the right claims.
 */
async function getValidToken(opts = {}) {
    const { getTestToken } = await import("../test-helpers/auth.js");
    return getTestToken({
        role: opts.role ?? "practitioner",
        tenantId: opts.tenantId ?? process.env["TEST_TENANT_ID"] ?? "tenant-a-uuid",
    });
}
async function getTokenForOtherTenant() {
    const { getTestToken } = await import("../test-helpers/auth.js");
    return getTestToken({
        role: "practitioner",
        tenantId: process.env["TEST_OTHER_TENANT_ID"] ?? "tenant-b-uuid",
    });
}
const VALID_CLIENT_PAYLOAD = {
    firstName: "Marie",
    lastName: "Dupont",
    primaryEmail: "marie.dupont@example.com",
    primaryPhone: "+33612345678",
    dateOfBirth: "1985-04-12",
    gdprConsentGiven: true,
};
beforeAll(async () => {
    const { buildApp } = await import("../app.js");
    app = await buildApp({ logger: false });
    await app.ready();
});
afterAll(async () => {
    await app.close();
});
// ---------------------------------------------------------------------------
// §2.1  GET /clients
// ---------------------------------------------------------------------------
describe("GET /clients", () => {
    // Spec §2.1 — "Missing or invalid JWT → 401 UNAUTHORIZED"
    it("without Authorization header → 401", async () => {
        const res = await app.inject({
            method: "GET",
            url: "/clients",
            // No Authorization header
        });
        expect(res.statusCode).toBe(401);
        const body = res.json();
        expect(body.error.code).toBe("UNAUTHORIZED");
        expect(body.error.message).toBe("Authentication required");
    });
    // Spec §2.1 — Success 200 with correct list envelope
    it("with valid token → 200 with data array and total", async () => {
        const token = await getValidToken();
        const res = await app.inject({
            method: "GET",
            url: "/clients",
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(res.statusCode).toBe(200);
        const body = res.json();
        // Spec §Global Conventions — list endpoints: { "data": [...], "total": N }
        expect(Array.isArray(body.data)).toBe(true);
        expect(typeof body.total).toBe("number");
    });
    // Spec §2.5 — Multi-tenant isolation: GET /clients returns ONLY clients
    // belonging to the authenticated tenant
    it("returns only clients belonging to the authenticated tenant", async () => {
        const tokenA = await getValidToken({ tenantId: "tenant-a-uuid" });
        const tokenB = await getTokenForOtherTenant();
        // Create a client under tenant A
        const createRes = await app.inject({
            method: "POST",
            url: "/clients",
            headers: {
                Authorization: `Bearer ${tokenA}`,
                "Content-Type": "application/json",
            },
            payload: {
                ...VALID_CLIENT_PAYLOAD,
                primaryEmail: `isolation-test-${Date.now()}@example.com`,
            },
        });
        expect(createRes.statusCode).toBe(201);
        const createdClient = createRes.json().data;
        // Fetch clients as tenant B — the tenant-A client must NOT appear
        const listRes = await app.inject({
            method: "GET",
            url: "/clients",
            headers: { Authorization: `Bearer ${tokenB}` },
        });
        expect(listRes.statusCode).toBe(200);
        const { data: tenantBClients } = listRes.json();
        const ids = tenantBClients.map((c) => c.id);
        expect(ids).not.toContain(createdClient.id);
        // Also assert every returned client belongs to tenant B
        for (const client of tenantBClients) {
            expect(client.tenantId).not.toBe(createdClient.tenantId);
        }
    });
    // Spec §2.1 — search param > 200 chars → 400 INVALID_PARAM
    it("search parameter longer than 200 characters → 400 INVALID_PARAM", async () => {
        const token = await getValidToken();
        const longSearch = "a".repeat(201);
        const res = await app.inject({
            method: "GET",
            url: `/clients?search=${encodeURIComponent(longSearch)}`,
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(res.statusCode).toBe(400);
        const body = res.json();
        expect(body.error.code).toBe("INVALID_PARAM");
        expect(body.error.message).toBe("search must be a string of max 200 characters");
    });
    // Spec §2.1 — search param exactly 200 chars → still valid (200 is inclusive)
    it("search parameter of exactly 200 characters → 200 OK", async () => {
        const token = await getValidToken();
        const exactSearch = "a".repeat(200);
        const res = await app.inject({
            method: "GET",
            url: `/clients?search=${encodeURIComponent(exactSearch)}`,
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(res.statusCode).toBe(200);
    });
});
// ---------------------------------------------------------------------------
// §2.2  POST /clients
// ---------------------------------------------------------------------------
describe("POST /clients", () => {
    // Spec §2.2 — Missing JWT → 401
    it("without Authorization header → 401", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/clients",
            payload: VALID_CLIENT_PAYLOAD,
        });
        expect(res.statusCode).toBe(401);
        expect(res.json().error.code).toBe("UNAUTHORIZED");
    });
    // Spec §2.2 + §8.1 — gdprConsentGiven: false → 422 VALIDATION_ERROR
    it("gdprConsentGiven: false → 422 VALIDATION_ERROR", async () => {
        const token = await getValidToken();
        const res = await app.inject({
            method: "POST",
            url: "/clients",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            payload: {
                ...VALID_CLIENT_PAYLOAD,
                gdprConsentGiven: false,
            },
        });
        expect(res.statusCode).toBe(422);
        const body = res.json();
        expect(body.error.code).toBe("VALIDATION_ERROR");
        expect(body.error.message).toBe("Invalid request body");
        // Spec §2.2 — details include Zod flatten() output
        expect(body.error).toHaveProperty("details");
        // Spec §2.2 — the specific GDPR field error message
        const fieldErrors = body.error.details?.fieldErrors;
        expect(fieldErrors?.gdprConsentGiven).toBeDefined();
        expect((fieldErrors?.gdprConsentGiven).some((msg) => msg.includes("GDPR consent must be explicitly granted"))).toBe(true);
    });
    // Spec §8.1 — omitting gdprConsentGiven entirely → 422
    it("gdprConsentGiven omitted → 422 VALIDATION_ERROR", async () => {
        const token = await getValidToken();
        const { gdprConsentGiven: _, ...payloadWithoutConsent } = VALID_CLIENT_PAYLOAD;
        const res = await app.inject({
            method: "POST",
            url: "/clients",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            payload: payloadWithoutConsent,
        });
        expect(res.statusCode).toBe(422);
        expect(res.json().error.code).toBe("VALIDATION_ERROR");
    });
    // Spec §8.1 — string "true" is NOT accepted (only boolean true)
    it('gdprConsentGiven: "true" (string) → 422 VALIDATION_ERROR', async () => {
        const token = await getValidToken();
        const res = await app.inject({
            method: "POST",
            url: "/clients",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            payload: {
                ...VALID_CLIENT_PAYLOAD,
                gdprConsentGiven: "true",
            },
        });
        expect(res.statusCode).toBe(422);
        expect(res.json().error.code).toBe("VALIDATION_ERROR");
    });
    // Spec §8.1 — numeric 1 is NOT accepted (only boolean true)
    it("gdprConsentGiven: 1 (number) → 422 VALIDATION_ERROR", async () => {
        const token = await getValidToken();
        const res = await app.inject({
            method: "POST",
            url: "/clients",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            payload: {
                ...VALID_CLIENT_PAYLOAD,
                gdprConsentGiven: 1,
            },
        });
        expect(res.statusCode).toBe(422);
        expect(res.json().error.code).toBe("VALIDATION_ERROR");
    });
    // Spec §2.2 — gdprConsentGiven: true + all required fields → 201 Created
    it("gdprConsentGiven: true with all required fields → 201 Created", async () => {
        const token = await getValidToken();
        const res = await app.inject({
            method: "POST",
            url: "/clients",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            payload: {
                ...VALID_CLIENT_PAYLOAD,
                primaryEmail: `created-${Date.now()}@example.com`,
            },
        });
        expect(res.statusCode).toBe(201);
        const body = res.json();
        // Spec §Global Conventions — single-resource: { "data": { ... } }
        expect(body).toHaveProperty("data");
        const client = body.data;
        expect(typeof client.id).toBe("string");
        expect(client.firstName).toBe(VALID_CLIENT_PAYLOAD.firstName);
        expect(client.lastName).toBe(VALID_CLIENT_PAYLOAD.lastName);
        expect(client.gdprConsentGiven).toBe(true);
        // Spec §2.2 — gdprConsentGivenAt is set when gdprConsentGiven is true
        expect(client.gdprConsentGivenAt).not.toBeNull();
        expect(typeof client.gdprConsentGivenAt).toBe("string");
        // Spec §2.2 — clientRef is auto-generated as "CLI-<timestamp>"
        expect(client.clientRef).toMatch(/^CLI-\d+$/);
        // Spec §2.2 — tenantId is set from the JWT, not from request body
        expect(typeof client.tenantId).toBe("string");
        // Spec §2.2 — isActive defaults to true
        expect(client.isActive).toBe(true);
    });
    // Spec §2.2 — firstName empty → 422
    it("firstName empty string → 422 VALIDATION_ERROR", async () => {
        const token = await getValidToken();
        const res = await app.inject({
            method: "POST",
            url: "/clients",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            payload: {
                ...VALID_CLIENT_PAYLOAD,
                firstName: "",
            },
        });
        expect(res.statusCode).toBe(422);
        expect(res.json().error.code).toBe("VALIDATION_ERROR");
    });
    // Spec §2.2 — invalid email format → 422
    it("invalid primaryEmail format → 422 VALIDATION_ERROR", async () => {
        const token = await getValidToken();
        const res = await app.inject({
            method: "POST",
            url: "/clients",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            payload: {
                ...VALID_CLIENT_PAYLOAD,
                primaryEmail: "not-a-valid-email",
            },
        });
        expect(res.statusCode).toBe(422);
        expect(res.json().error.code).toBe("VALIDATION_ERROR");
    });
});
// ---------------------------------------------------------------------------
// §2.3  GET /clients/:id
// ---------------------------------------------------------------------------
describe("GET /clients/:id", () => {
    // Spec §2.3 — missing JWT → 401
    it("without Authorization header → 401", async () => {
        const res = await app.inject({
            method: "GET",
            url: "/clients/00000000-0000-0000-0000-000000000001",
        });
        expect(res.statusCode).toBe(401);
        expect(res.json().error.code).toBe("UNAUTHORIZED");
    });
    // Spec §9.2 — UUID validation: non-UUID id → 400 INVALID_ID
    it("non-UUID id → 400 INVALID_ID", async () => {
        const token = await getValidToken();
        const res = await app.inject({
            method: "GET",
            url: "/clients/not-a-uuid",
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(res.statusCode).toBe(400);
        const body = res.json();
        expect(body.error.code).toBe("INVALID_ID");
        expect(body.error.message).toBe("Client ID must be a valid UUID");
    });
    // Spec §9.2 — short numeric string is not a UUID
    it("numeric id (non-UUID) → 400 INVALID_ID", async () => {
        const token = await getValidToken();
        const res = await app.inject({
            method: "GET",
            url: "/clients/12345",
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(res.statusCode).toBe(400);
        expect(res.json().error.code).toBe("INVALID_ID");
    });
    // Spec §2.3 — valid UUID but wrong tenant → 404 (not 403 — prevents enumeration)
    it("valid UUID id that belongs to a different tenant → 404 NOT_FOUND", async () => {
        const tokenA = await getValidToken({ tenantId: "tenant-a-uuid" });
        const tokenB = await getTokenForOtherTenant();
        // Create a client under tenant A
        const createRes = await app.inject({
            method: "POST",
            url: "/clients",
            headers: {
                Authorization: `Bearer ${tokenA}`,
                "Content-Type": "application/json",
            },
            payload: {
                ...VALID_CLIENT_PAYLOAD,
                primaryEmail: `cross-tenant-${Date.now()}@example.com`,
            },
        });
        expect(createRes.statusCode).toBe(201);
        const clientId = createRes.json().data.id;
        // Fetch that client as tenant B → must get 404, NOT 403
        const getRes = await app.inject({
            method: "GET",
            url: `/clients/${clientId}`,
            headers: { Authorization: `Bearer ${tokenB}` },
        });
        // Spec §2.3 — "Client not found OR belongs to a different tenant → 404"
        // Spec §2.5 — "Cross-tenant access MUST return 404 (not 403) so that valid
        //              IDs in other tenants are not enumerable."
        expect(getRes.statusCode).toBe(404);
        const body = getRes.json();
        expect(body.error.code).toBe("NOT_FOUND");
        expect(body.error.message).toBe("Client not found");
    });
    // Spec §2.3 — genuinely nonexistent UUID → 404
    it("valid UUID format but client does not exist → 404 NOT_FOUND", async () => {
        const token = await getValidToken();
        const res = await app.inject({
            method: "GET",
            url: "/clients/00000000-dead-beef-0000-000000000000",
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(res.statusCode).toBe(404);
        expect(res.json().error.code).toBe("NOT_FOUND");
        expect(res.json().error.message).toBe("Client not found");
    });
    // Spec §2.3 — happy path: returns single-resource envelope
    it("valid UUID of own tenant client → 200 with data envelope", async () => {
        const token = await getValidToken();
        // Create a client first so we have a known ID
        const createRes = await app.inject({
            method: "POST",
            url: "/clients",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            payload: {
                ...VALID_CLIENT_PAYLOAD,
                primaryEmail: `get-by-id-${Date.now()}@example.com`,
            },
        });
        expect(createRes.statusCode).toBe(201);
        const clientId = createRes.json().data.id;
        const getRes = await app.inject({
            method: "GET",
            url: `/clients/${clientId}`,
            headers: { Authorization: `Bearer ${token}` },
        });
        expect(getRes.statusCode).toBe(200);
        const body = getRes.json();
        // Spec §Global Conventions — single-resource: { "data": { ... } }
        expect(body).toHaveProperty("data");
        expect(body.data.id).toBe(clientId);
    });
});
//# sourceMappingURL=clients.test.js.map