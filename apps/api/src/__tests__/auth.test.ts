/**
 * Auth API Integration Tests
 * Based purely on: HairCode™ Formal System Specifications v1.0.0
 * Spec §1 — Authentication API
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";

// ---------------------------------------------------------------------------
// Test app factory — builds the Fastify app in test mode.
// We import the app builder (not the server entrypoint) so we can call
// app.inject() without binding a real port.
// The actual import path may differ; adjust to whatever the project exposes.
// ---------------------------------------------------------------------------
let app: FastifyInstance;

// Credentials that exist in the test database / seed.
const VALID_EMAIL = "admin@salon-lumiere.fr";
const VALID_PASSWORD = "securepassword";
const VALID_TENANT_SLUG = "salon-lumiere";

beforeAll(async () => {
  // Lazy import so the module is resolved at runtime (avoids TS errors when
  // the implementation file does not yet exist during spec-only authoring).
  const { buildApp } = await import("../app.js");
  app = await buildApp({ logger: false });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

// ---------------------------------------------------------------------------
// §1.1  POST /auth/login
// ---------------------------------------------------------------------------
describe("POST /auth/login", () => {
  // Spec §1.1 — Success Response — 200 OK
  it("happy path: returns 200 with correct token shape", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
        tenantSlug: VALID_TENANT_SLUG,
      },
    });

    expect(res.statusCode).toBe(200);

    const body = res.json();

    // Spec §1.1 — Success shape
    expect(body).toHaveProperty("accessToken");
    expect(typeof body.accessToken).toBe("string");
    expect(body.tokenType).toBe("Bearer");
    expect(body.expiresIn).toBe(900); // 15 minutes as per spec
  });

  // Spec §1.1 — JWT Payload Structure
  it("happy path: JWT payload contains sub, tenantId, roles array", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
        tenantSlug: VALID_TENANT_SLUG,
      },
    });

    const { accessToken } = res.json<{ accessToken: string }>();

    // Decode without verifying (we trust the API signed it; we just check shape)
    const [, payloadB64] = accessToken.split(".");
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    );

    // Spec §1.1 — JWT Payload Structure
    // "sub" is the user UUID — code MUST use sub, not userId
    expect(typeof payload.sub).toBe("string");
    // tenantId is the tenant's UUID
    expect(typeof payload.tenantId).toBe("string");
    // roles is always an array
    expect(Array.isArray(payload.roles)).toBe(true);
    expect(payload.roles.length).toBeGreaterThanOrEqual(1);
    // iat and exp are present
    expect(typeof payload.iat).toBe("number");
    expect(typeof payload.exp).toBe("number");
    // expiresIn = 900 s → exp should be approximately iat + 900
    expect(payload.exp - payload.iat).toBe(900);
  });

  // Spec §1.1 — Error: tenantSlug is required (min 1 char)
  it("missing tenantSlug → 422 VALIDATION_ERROR", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
        // tenantSlug omitted
      },
    });

    expect(res.statusCode).toBe(422);

    const body = res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("Invalid request body");
    // Spec: validation errors include "details" (Zod flatten() output)
    expect(body.error).toHaveProperty("details");
  });

  // Spec §1.1 — Error: empty tenantSlug also fails min-1-char constraint
  it("empty tenantSlug → 422 VALIDATION_ERROR", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
        tenantSlug: "",
      },
    });

    expect(res.statusCode).toBe(422);
    expect(res.json().error.code).toBe("VALIDATION_ERROR");
  });

  // Spec §1.1 — Error: missing email → 422
  it("missing email → 422 VALIDATION_ERROR", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        // email omitted
        password: VALID_PASSWORD,
        tenantSlug: VALID_TENANT_SLUG,
      },
    });

    expect(res.statusCode).toBe(422);
    const body = res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("Invalid request body");
  });

  // Spec §1.1 — Error: invalid email format → 422
  it("invalid email format → 422 VALIDATION_ERROR", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "not-an-email",
        password: VALID_PASSWORD,
        tenantSlug: VALID_TENANT_SLUG,
      },
    });

    expect(res.statusCode).toBe(422);
    expect(res.json().error.code).toBe("VALIDATION_ERROR");
  });

  // Spec §1.1 — Error: password < 8 characters → 422
  it("password shorter than 8 characters → 422 VALIDATION_ERROR", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: VALID_EMAIL,
        password: "short",
        tenantSlug: VALID_TENANT_SLUG,
      },
    });

    expect(res.statusCode).toBe(422);
    expect(res.json().error.code).toBe("VALIDATION_ERROR");
  });

  // Spec §1.1 — Anti-enumeration: wrong password → 401 with GENERIC message
  it("correct email but wrong password → 401 with generic message (anti-enumeration)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: VALID_EMAIL,
        password: "wrongpassword",
        tenantSlug: VALID_TENANT_SLUG,
      },
    });

    expect(res.statusCode).toBe(401);

    const body = res.json();
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
    // Spec §1.1 — "The API MUST NOT reveal which specific check failed"
    expect(body.error.message).toBe("Invalid email, password, or tenant");
  });

  // Spec §1.1 — Anti-enumeration: non-existent tenant → 401 NOT 404
  it("non-existent tenantSlug → 401 (not 404) with generic message (anti-enumeration)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
        tenantSlug: "tenant-that-does-not-exist-xyz",
      },
    });

    // Spec §1.1: "Tenant slug not found ... → 401 INVALID_CREDENTIALS"
    // The spec explicitly says do NOT return 404 for a missing tenant (anti-enumeration)
    expect(res.statusCode).toBe(401);

    const body = res.json();
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
    expect(body.error.message).toBe("Invalid email, password, or tenant");
  });

  // Spec §1.1 — Anti-enumeration: non-existent email → 401 NOT 404
  it("non-existent email → 401 with generic message (not 404)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "nobody@nowhere.example.com",
        password: VALID_PASSWORD,
        tenantSlug: VALID_TENANT_SLUG,
      },
    });

    expect(res.statusCode).toBe(401);

    const body = res.json();
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
    expect(body.error.message).toBe("Invalid email, password, or tenant");
  });
});

// ---------------------------------------------------------------------------
// §1.2  POST /auth/refresh — currently NOT IMPLEMENTED
// ---------------------------------------------------------------------------
describe("POST /auth/refresh", () => {
  // Spec §1.2 — "Returns 501 unconditionally"
  it("returns 501 NOT_IMPLEMENTED unconditionally", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/refresh",
    });

    expect(res.statusCode).toBe(501);

    const body = res.json();
    expect(body.error.code).toBe("NOT_IMPLEMENTED");
    expect(body.error.message).toBe("Refresh not yet implemented");
    expect(body.error.status).toBe(501);
  });

  // Spec §1.2 — 501 regardless of whether a cookie/body is sent
  it("returns 501 even when a refresh cookie is provided", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      headers: {
        Cookie: "hc_refresh=some-token-value",
      },
    });

    expect(res.statusCode).toBe(501);
    expect(res.json().error.code).toBe("NOT_IMPLEMENTED");
  });
});

// ---------------------------------------------------------------------------
// §1 — Global Conventions: error envelope shape
// ---------------------------------------------------------------------------
describe("Auth API — error envelope conformance", () => {
  // Spec: Global Conventions — all errors follow { error: { code, message, status } }
  it("422 error has correct envelope shape", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "bad", password: "bad", tenantSlug: "" },
    });

    const body = res.json();
    expect(body).toHaveProperty("error");
    expect(body.error).toHaveProperty("code");
    expect(body.error).toHaveProperty("message");
    expect(body.error).toHaveProperty("status");
    expect(body.error.status).toBe(422);
  });

  it("401 error has correct envelope shape", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: VALID_EMAIL,
        password: "wrongpassword1",
        tenantSlug: VALID_TENANT_SLUG,
      },
    });

    const body = res.json();
    expect(body).toHaveProperty("error");
    expect(body.error).toHaveProperty("code");
    expect(body.error).toHaveProperty("message");
    expect(body.error).toHaveProperty("status");
    expect(body.error.status).toBe(401);
  });
});
