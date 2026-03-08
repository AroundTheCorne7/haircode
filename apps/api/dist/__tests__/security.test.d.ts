/**
 * Security Tests
 * Based purely on: HairCode™ Formal System Specifications v1.0.0
 * Spec §9 — Security Spec
 *
 * Covers:
 *   §9.1  Rate limiting (429)
 *   §9.2  UUID validation on :id parameters (400)
 *   §9.3  LIKE wildcard escaping (search does not error)
 *   §9.4  Tenant isolation / JWT enforcement on protected routes
 *   §9.5  Global error handler (no 500 leakage)
 *   §9.8  HTTP security headers (helmet)
 *   §9.9  JWT — expired token → 401
 *   §4.2  PUT /engine/weights — role-gate to admin
 */
export {};
//# sourceMappingURL=security.test.d.ts.map