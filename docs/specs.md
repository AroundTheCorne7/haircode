# HairCode™ — Formal System Specifications

**Version:** 1.0.0
**Date:** 2026-03-05
**Status:** Source of Truth for Testing

---

## Table of Contents

1. [Authentication API](#1-authentication-api)
2. [Clients API](#2-clients-api)
3. [Protocols API](#3-protocols-api)
4. [Engine Weights API](#4-engine-weights-api)
5. [Decision Engine Spec](#5-decision-engine-spec)
6. [Consultation Wizard Spec](#6-consultation-wizard-spec)
7. [Settings Page Spec](#7-settings-page-spec)
8. [GDPR Compliance Spec](#8-gdpr-compliance-spec)
9. [Security Spec](#9-security-spec)

---

## Global Conventions

- **Base URL (API):** `http://localhost:3001` (port configurable via `PORT` env var)
- **Base URL (Web):** `http://localhost:3000`
- **Content-Type:** All request and response bodies are `application/json`
- **Error envelope:** All errors follow this shape:
  ```json
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "Human-readable message",
      "status": 4xx | 5xx
    }
  }
  ```
  Validation errors additionally include a `"details"` field (Zod `flatten()` output).
- **Success envelope:** Single-resource endpoints wrap in `{ "data": { ... } }`. List endpoints wrap in `{ "data": [...], "total": N }`.
- **HTTP 500 responses** MUST NOT expose internal error details (DB messages, stack traces). The message is always `"An unexpected error occurred"`.

---

## 1. Authentication API

Routes are registered under the prefix `/auth`.
Public routes (no JWT required): `/health`, `/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`.
All other routes require a valid Bearer token in the `Authorization` header.

---

### 1.1 `POST /auth/login`

Authenticates a user against a specific tenant by slug.

#### Request Body

| Field        | Type   | Required | Constraints            |
|--------------|--------|----------|------------------------|
| `email`      | string | yes      | Valid email format     |
| `password`   | string | yes      | Minimum 8 characters   |
| `tenantSlug` | string | yes      | Minimum 1 character    |

```json
{
  "email": "admin@salon-lumiere.fr",
  "password": "securepassword",
  "tenantSlug": "salon-lumiere"
}
```

#### Verification Steps (internal)

1. Look up `tenants` by `slug = tenantSlug`. If not found → `null`.
2. Look up `users` by `email`. If not found or `passwordHash` is null → `null`.
3. `bcrypt.compare(password, user.passwordHash)`. If false → `null`.
4. Look up `tenant_users` by `(userId, tenantId)`. If no membership record → `null`.
5. The role returned in the token comes from `tenant_users.role` (NOT `users` table).

#### Success Response — `200 OK`

```json
{
  "accessToken": "<JWT string>",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

- `expiresIn` is `900` seconds (15 minutes).
- The JWT is signed with `HS256` using the `JWT_SECRET` environment variable (minimum 32 characters).

#### JWT Payload Structure

```json
{
  "sub": "<user UUID>",
  "tenantId": "<tenant UUID>",
  "roles": ["admin" | "practitioner" | "<other role from tenant_users>"],
  "iat": 1234567890,
  "exp": 1234568790
}
```

- `sub` is the user's UUID (from `users.id`). Code MUST use `sub`, not `userId`.
- `roles` is always an array with one element derived from `tenant_users.role`.
- `tenantId` is the tenant's UUID (from `tenants.id`).

#### Error Responses

| Condition                                               | HTTP | `code`               | `message`                                   |
|---------------------------------------------------------|------|----------------------|---------------------------------------------|
| `email` not a valid email, `password` < 8 chars, or `tenantSlug` is empty | 422  | `VALIDATION_ERROR`   | `"Invalid request body"`                   |
| Tenant slug not found, email not found, wrong password, or no tenant membership | 401  | `INVALID_CREDENTIALS` | `"Invalid email, password, or tenant"` |

**Important:** All 401 conditions return the same generic message. The API MUST NOT reveal which specific check failed (tenant not found vs wrong password).

---

### 1.2 `POST /auth/refresh`

#### Current Status: NOT IMPLEMENTED

Returns `501` unconditionally.

```json
{
  "error": {
    "code": "NOT_IMPLEMENTED",
    "message": "Refresh not yet implemented",
    "status": 501
  }
}
```

#### Expected Future Behaviour (when implemented)

- Client sends the `hc_refresh` cookie (set as an HttpOnly cookie) containing a refresh token.
- Server validates the refresh token, rotates it (old token invalidated), and returns a new `accessToken` + sets a new `hc_refresh` cookie.
- Expired or invalid refresh tokens → `401 UNAUTHORIZED`.

---

### 1.3 `POST /auth/logout`

Clears the `hc_refresh` cookie.

#### Response — `204 No Content`

No response body. The `hc_refresh` cookie is cleared via `Set-Cookie: hc_refresh=; Max-Age=0`.

---

## 2. Clients API

All routes are registered under the prefix `/clients`.
**All routes require a valid JWT** (enforced by tenant middleware).
**Multi-tenant isolation:** Every query filters by `tenantId` extracted from the JWT's `tenantId` claim. A user from tenant A can never access, create, or read records belonging to tenant B.

---

### 2.1 `GET /clients`

List all clients for the authenticated tenant, optionally filtered by first name search.

#### Required Headers

```
Authorization: Bearer <token>
```

#### Query Parameters

| Parameter | Type   | Required | Constraints                                    |
|-----------|--------|----------|------------------------------------------------|
| `search`  | string | no       | Maximum 200 characters; filters on `firstName` |

If `search` is provided, the query does a case-insensitive `ILIKE '%<escaped_search>%'` match on `clients.firstName`. LIKE wildcard characters (`%`, `_`, `\`) in the search string are escaped before use.

Results are ordered by `createdAt` descending and capped at **100 records**.

#### Success Response — `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "clientRef": "CLI-1234567890",
      "firstName": "Marie",
      "lastName": "Dupont",
      "preferredName": null,
      "dateOfBirth": "1985-04-12",
      "primaryEmail": "marie@example.com",
      "primaryPhone": "+33612345678",
      "assignedPractitionerId": null,
      "gdprConsentGiven": true,
      "gdprConsentGivenAt": "2026-01-15T10:30:00.000Z",
      "notes": null,
      "isActive": true,
      "lastVisitAt": null,
      "createdAt": "2026-01-15T10:30:00.000Z",
      "updatedAt": "2026-01-15T10:30:00.000Z",
      "deletedAt": null,
      "erasedAt": null
    }
  ],
  "total": 1
}
```

#### Error Responses

| Condition                                     | HTTP | `code`          | `message`                                              |
|-----------------------------------------------|------|-----------------|--------------------------------------------------------|
| Missing or invalid JWT                        | 401  | `UNAUTHORIZED`  | `"Authentication required"`                            |
| JWT present but missing `tenantId` claim      | 401  | `UNAUTHORIZED`  | `"Invalid token: missing tenantId"`                    |
| `search` is provided but exceeds 200 chars    | 400  | `INVALID_PARAM` | `"search must be a string of max 200 characters"`      |
| Database or unexpected error                  | 500  | `INTERNAL_ERROR`| `"An unexpected error occurred"`                       |

---

### 2.2 `POST /clients`

Create a new client record for the authenticated tenant.

#### Required Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body

| Field               | Type          | Required | Constraints                                                              |
|---------------------|---------------|----------|--------------------------------------------------------------------------|
| `firstName`         | string        | yes      | Min 1, max 100 characters                                                |
| `lastName`          | string        | yes      | Min 1, max 100 characters                                                |
| `primaryEmail`      | string        | no       | Valid email format; max 320 characters                                   |
| `primaryPhone`      | string        | no       | Free text; max 30 characters                                             |
| `dateOfBirth`       | string        | no       | ISO date string (e.g. `"1985-04-12"`)                                    |
| `gdprConsentGiven`  | literal `true`| yes      | MUST be the boolean literal `true`. Any other value (including `false`) is rejected with 422. |

```json
{
  "firstName": "Marie",
  "lastName": "Dupont",
  "primaryEmail": "marie@example.com",
  "primaryPhone": "+33612345678",
  "dateOfBirth": "1985-04-12",
  "gdprConsentGiven": true
}
```

#### Internal Behaviour

- `clientRef` is auto-generated as `"CLI-<Date.now()>"` if not provided (no external `clientRef` input is accepted through this endpoint).
- When `gdprConsentGiven` is `true`, `gdprConsentGivenAt` is set to the current server timestamp (`new Date()`).
- `tenantId` is set from the JWT payload — never from the request body.

#### Success Response — `201 Created`

```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "clientRef": "CLI-1706000000000",
    "firstName": "Marie",
    "lastName": "Dupont",
    "preferredName": null,
    "dateOfBirth": "1985-04-12",
    "primaryEmail": "marie@example.com",
    "primaryPhone": "+33612345678",
    "assignedPractitionerId": null,
    "gdprConsentGiven": true,
    "gdprConsentGivenAt": "2026-01-15T10:30:00.000Z",
    "notes": null,
    "isActive": true,
    "lastVisitAt": null,
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:30:00.000Z",
    "deletedAt": null,
    "erasedAt": null
  }
}
```

#### Error Responses

| Condition                                                    | HTTP | `code`            | `message`                  |
|--------------------------------------------------------------|------|-------------------|----------------------------|
| Missing or invalid JWT                                       | 401  | `UNAUTHORIZED`    | `"Authentication required"` |
| `firstName` empty, `gdprConsentGiven` not `true`, invalid email | 422 | `VALIDATION_ERROR`| `"Invalid request body"` with `details` |
| Database or unexpected error                                 | 500  | `INTERNAL_ERROR`  | `"An unexpected error occurred"` |

The `details` field in 422 responses is the Zod `flatten()` output, e.g.:
```json
{
  "fieldErrors": {
    "gdprConsentGiven": ["GDPR consent must be explicitly granted before creating a client record."]
  },
  "formErrors": []
}
```

---

### 2.3 `GET /clients/:id`

Retrieve a single client record by UUID.

#### Required Headers

```
Authorization: Bearer <token>
```

#### Path Parameters

| Parameter | Type   | Required | Constraints             |
|-----------|--------|----------|-------------------------|
| `id`      | string | yes      | Must be a valid UUID v4 |

UUID validation regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`

#### Success Response — `200 OK`

```json
{
  "data": { /* full client record as in POST /clients response */ }
}
```

#### Error Responses

| Condition                                        | HTTP | `code`          | `message`                                  |
|--------------------------------------------------|------|-----------------|--------------------------------------------|
| Missing or invalid JWT                           | 401  | `UNAUTHORIZED`  | `"Authentication required"`                |
| `:id` is not a valid UUID                        | 400  | `INVALID_ID`    | `"Client ID must be a valid UUID"`         |
| Client not found OR belongs to a different tenant| 404  | `NOT_FOUND`     | `"Client not found"`                       |
| Database or unexpected error                     | 500  | `INTERNAL_ERROR`| `"An unexpected error occurred"`           |

**Multi-tenant note:** The query always includes `AND tenantId = <jwt.tenantId>`. A client that exists in another tenant returns 404, not 403. This prevents tenant enumeration.

---

### 2.4 `GET /clients/:id/full-profile`

Retrieve a client plus their current profile snapshots for all four modules.

#### Required Headers

```
Authorization: Bearer <token>
```

#### Path Parameters

Same UUID validation as `GET /clients/:id`.

#### Success Response — `200 OK`

```json
{
  "data": {
    "client": { /* full client record */ },
    "hair": { /* hairProfiles record where isCurrent=true, or undefined */ },
    "scalp": { /* scalpProfiles record where isCurrent=true, or undefined */ },
    "body": { /* bodyProfiles record where isCurrent=true, or undefined */ },
    "morphology": { /* morphologyProfiles record where isCurrent=true, or undefined */ }
  }
}
```

Profile sub-objects may be `undefined` if no current profile of that type has been saved for the client.

#### Error Responses

Same as `GET /clients/:id`.

---

### 2.5 Multi-Tenant Isolation Rules

- The `tenantId` used for ALL queries is extracted exclusively from the verified JWT payload (`req.user.tenantId`).
- It is never accepted from request body, query params, or headers.
- Every DB query against `clients`, `protocols`, `hairProfiles`, `scalpProfiles`, `bodyProfiles`, `morphologyProfiles` MUST include a `WHERE tenant_id = ?` clause using the JWT-derived `tenantId`.
- Cross-tenant access MUST return 404 (not 403) so that valid IDs in other tenants are not enumerable.

---

## 3. Protocols API

Routes are registered with no prefix (directly on the Fastify app).
**All routes require a valid JWT.**

---

### 3.1 `GET /clients/:clientId/protocols`

List all saved protocols for a specific client within the authenticated tenant.

#### Required Headers

```
Authorization: Bearer <token>
```

#### Path Parameters

| Parameter  | Type   | Required | Constraints |
|------------|--------|----------|-------------|
| `clientId` | string | yes      | UUID        |

#### Success Response — `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "clientId": "uuid",
      "name": "Protocol — 2026-03-05",
      "objective": "Phase: stabilization | Score: 34.2",
      "module": "multi",
      "status": "draft",
      "createdBy": "uuid",
      "approvedBy": null,
      "approvedAt": null,
      "scoringLogId": null,
      "startedAt": null,
      "estimatedEndAt": null,
      "completedAt": null,
      "lockedAt": null,
      "lockedBy": null,
      "clientVisible": false,
      "createdAt": "2026-03-05T12:00:00.000Z",
      "updatedAt": "2026-03-05T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

Results are ordered by `createdAt` descending.

#### Error Responses

| Condition              | HTTP | `code`          | `message`                        |
|------------------------|------|-----------------|----------------------------------|
| Missing or invalid JWT | 401  | `UNAUTHORIZED`  | `"Authentication required"`      |
| Database error         | 500  | `INTERNAL_ERROR`| `"An unexpected error occurred"` |

---

### 3.2 `POST /clients/:clientId/protocols/generate`

Generate and persist a new protocol for a client by running the decision engine.

#### Required Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Path Parameters

| Parameter  | Type   | Required | Constraints |
|------------|--------|----------|-------------|
| `clientId` | string | yes      | UUID        |

#### Request Body Schema

```json
{
  "hair": {
    "texture": "straight",
    "density": "3",
    "porosity": "medium",
    "elasticity": "good",
    "damageIndex": 5,
    "chemicalHistory": ["colour_treated_(permanent)"]
  },
  "scalp": {
    "biotype": "normal",
    "sebumProduction": 2,
    "sensitivity": 2,
    "phLevel": 5.2,
    "openLesions": false,
    "conditions": ["dandruff"]
  },
  "body": {
    "hormonalIndex": 3,
    "nutritionalScore": 7,
    "stressIndex": 4,
    "hydrationPct": 65.0
  },
  "morphology": {
    "faceShape": "oval",
    "undertone": "neutral",
    "symmetryScore": 72
  }
}
```

#### Field Constraints

**`hair` (required object):**

| Field             | Type          | Required | Constraints        |
|-------------------|---------------|----------|--------------------|
| `texture`         | string        | yes      | Free text          |
| `density`         | string        | yes      | Free text          |
| `porosity`        | string        | yes      | Free text          |
| `elasticity`      | string        | yes      | Free text          |
| `damageIndex`     | number        | yes      | `0` to `10`        |
| `chemicalHistory` | string[]      | yes      | Array of strings   |

**`scalp` (required object):**

| Field             | Type    | Required | Constraints        |
|-------------------|---------|----------|--------------------|
| `biotype`         | string  | yes      | Free text          |
| `sebumProduction` | number  | yes      | `0` to `10`        |
| `sensitivity`     | number  | yes      | `0` to `10`        |
| `phLevel`         | number  | yes      | `0` to `14`        |
| `openLesions`     | boolean | yes      |                    |
| `conditions`      | string[]| yes      | Array of strings   |

**`body` (optional object):**

| Field              | Type   | Required | Constraints       |
|--------------------|--------|----------|-------------------|
| `hormonalIndex`    | number | yes      | `0` to `10`       |
| `nutritionalScore` | number | yes      | `0` to `10`       |
| `stressIndex`      | number | yes      | `0` to `10`       |
| `hydrationPct`     | number | yes      | `0` to `100`      |

**`morphology` (optional object):**

| Field          | Type   | Required | Constraints       |
|----------------|--------|----------|-------------------|
| `faceShape`    | string | yes      | Free text         |
| `undertone`    | string | yes      | Free text         |
| `symmetryScore`| number | yes      | `0` to `100`      |

#### Internal Behaviour

1. Verify the client exists and belongs to `tenantId` from the JWT. If not → 404.
2. Call `evaluate(input)` from `@haircode/engine` with the request body cast as `EvaluationInput`.
3. Insert a row into `protocols` with:
   - `name`: `"Protocol — <YYYY-MM-DD>"` (today's UTC date)
   - `objective`: `"Phase: <assignedPhase> | Score: <compositeScore.toFixed(1)>"` (or `"N/A"` if score is not finite)
   - `status`: `"draft"`
   - `createdBy`: `sub` from the JWT (the user's UUID)
4. Return both the saved protocol record and the engine evaluation result.

#### Success Response — `201 Created`

```json
{
  "data": {
    "protocol": {
      "id": "uuid",
      "tenantId": "uuid",
      "clientId": "uuid",
      "name": "Protocol — 2026-03-05",
      "objective": "Phase: transformation | Score: 61.3",
      "module": "multi",
      "status": "draft",
      "createdBy": "uuid",
      "createdAt": "2026-03-05T12:00:00.000Z",
      "updatedAt": "2026-03-05T12:00:00.000Z"
    },
    "evaluation": {
      "evaluationId": "uuid",
      "compositeScore": 61.3,
      "adjustedScore": 61.3,
      "moduleScores": {
        "hair": 72.0,
        "scalp": 55.0,
        "body": 60.0,
        "morphology": 50.0
      },
      "assignedPhase": "transformation",
      "redFlags": [],
      "appliedActions": [],
      "protocol": {
        "phases": [{ "phaseType": "transformation", "name": "Transformation Phase", "estimatedWeeks": 11, "order": 1 }],
        "services": [],
        "checkpoints": [
          { "week": 3, "criteria": ["Re-assess all module scores at week 3", "Evaluate phase transition readiness"] }
        ],
        "frequency": { "interval": 14, "unit": "days" }
      }
    }
  }
}
```

#### Error Responses

| Condition                              | HTTP | `code`            | `message`                              |
|----------------------------------------|------|-------------------|----------------------------------------|
| Missing or invalid JWT                 | 401  | `UNAUTHORIZED`    | `"Authentication required"`            |
| Request body fails schema validation   | 422  | `VALIDATION_ERROR`| `"Invalid protocol input"` with `details` |
| Client not found for this tenant       | 404  | `NOT_FOUND`       | `"Client not found"`                   |
| Database or engine error               | 500  | `INTERNAL_ERROR`  | `"An unexpected error occurred"`       |

---

## 4. Engine Weights API

Routes are registered under the prefix `/engine`.
**All routes require a valid JWT.**

---

### 4.1 `GET /engine/weights`

Returns the current module weights used by the decision engine.

#### Required Headers

```
Authorization: Bearer <token>
```

#### Success Response — `200 OK`

```json
{
  "weights": {
    "hair": 0.35,
    "scalp": 0.30,
    "body": 0.20,
    "morphology": 0.15
  },
  "version": 1
}
```

**Note:** These are the API-layer persisted weights (in-memory, pending DB persistence). The engine package's `DEFAULT_WEIGHTS` uses different values: `hair=0.40`, `scalp=0.30`, `body=0.20`, `morphology=0.10`. The consultation wizard's `/api/evaluate` route uses `DEFAULT_WEIGHTS`.

#### Error Responses

| Condition              | HTTP | `code`         | `message`                   |
|------------------------|------|----------------|-----------------------------|
| Missing or invalid JWT | 401  | `UNAUTHORIZED` | `"Authentication required"` |

---

### 4.2 `PUT /engine/weights`

Update the engine module weights. **Requires `admin` role.**

#### Required Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Authorization

The authenticated user's `roles` array (from the JWT) MUST contain `"admin"`. Any other role returns 403.

#### Request Body Schema

```json
{
  "hair": 0.40,
  "scalp": 0.30,
  "body": 0.20,
  "morphology": 0.10
}
```

| Field        | Type   | Required | Constraints                                              |
|--------------|--------|----------|----------------------------------------------------------|
| `hair`       | number | yes      | `0.0` to `1.0`                                          |
| `scalp`      | number | yes      | `0.0` to `1.0`                                          |
| `body`       | number | yes      | `0.0` to `1.0`                                          |
| `morphology` | number | yes      | `0.0` to `1.0`                                          |

**Constraint:** `hair + scalp + body + morphology` MUST equal `1.0` (tolerance: `|sum - 1.0| < 0.001`).

#### Success Response — `200 OK`

```json
{
  "message": "Weights updated",
  "weights": {
    "hair": 0.40,
    "scalp": 0.30,
    "body": 0.20,
    "morphology": 0.10
  }
}
```

**Note:** Persistence to DB is not yet implemented. The response echoes back the submitted weights.

#### Error Responses

| Condition                                  | HTTP | `code`            | `message`                   |
|--------------------------------------------|------|-------------------|-----------------------------|
| Missing or invalid JWT                     | 401  | `UNAUTHORIZED`    | `"Authentication required"` |
| Authenticated user does not have `admin` role | 403 | `FORBIDDEN`    | `"Admin role required"`     |
| Any field out of `[0,1]` or sum ≠ 1.0      | 422  | `VALIDATION_ERROR`| `"Invalid weights"` with `details` |

---

## 5. Decision Engine Spec

The engine lives in `packages/engine` and is consumed both by the Next.js `/api/evaluate` route and by `protocol.service.ts` in the Fastify API.

---

### 5.1 `evaluate(input)` Pipeline

```
evaluate(input: EvaluationInput): Promise<EvaluationResult>
```

**Input shape:**

```typescript
interface EvaluationInput {
  profile: ClientProfile;      // the data to evaluate
  rules: Rule[];               // decision rules (use DEFAULT_RULES in practice)
  weights: WeightConfig;       // module + field weights
  normalizers: FieldNormalizer[]; // field → score mappings
  redFlagRules: RedFlag[];     // contraindication definitions
  includeTrace?: boolean;      // if true, include diagnostic trace in output
}
```

**Pipeline steps in order:**

| Step | Function                                      | Output                                                   |
|------|-----------------------------------------------|----------------------------------------------------------|
| 1    | `computeModuleScores(profile, normalizers, weights)` | `moduleScores: { hair, scalp, body, morphology }` — each 0–100 |
| 2    | `computeCompositeScore(moduleScores, weights.modules)` | `compositeScore` — weighted average 0–100          |
| 3    | `evaluateRedFlags(profile, redFlagRules)`     | `{ flags, totalPenalty, blocked }`                       |
| 4    | **BLOCK check** — if `blocked === true`        | Return early: `adjustedScore=0`, `assignedPhase="stabilization"`, empty protocol |
| 5    | `adjustedScore = compositeScore × (1 − totalPenalty)` | Penalty applied                                 |
| 6    | `evaluateRules(rules, ctx)`                   | `appliedActions`, `triggeredRuleIds`                     |
| 7    | Phase from rules or score: `SET_PHASE` action overrides; otherwise `assignPhase(adjustedScore, flags)` | `assignedPhase` |
| 8    | `generatePhases(assignedPhase, adjustedScore, flags)` | `phases`, `checkpoints`                         |
| 9    | Extract `ADD_SERVICE` actions → `services`    | `ServiceOutput[]`                                        |
| 10   | Extract `SET_FREQUENCY` action → `frequency` (default: `{ interval: 14, unit: "days" }`) | `frequency` |

**Default frequency** when no rule sets it: every **14 days**.

---

### 5.2 Module Score Computation

For each module (`hair`, `scalp`, `body`, `morphology`):
1. Filter normalizers whose `fieldPath` starts with `<module>.`.
2. For each matching normalizer, look up the field value from `profile[module]`.
3. Skip fields where the value is `null` or `undefined`.
4. Call `normalizeField(value, normalizer)` → 0–100 score.
5. Apply field weight from `weights.fields[module][fieldName]` (defaults to `1` if absent).
6. `moduleScore = sum(score × weight) / sum(weight)`.
7. If NO normalizers exist for a module, its score remains at the default of **50**.

**Composite score:**
```
compositeScore = sum(moduleScore[m] × weights.modules[m]) / sum(weights.modules[m])
```
Falls back to **50** if total module weight sum is 0.

---

### 5.3 Normalizer Types

#### `ENUM_MAP`

Maps a string value to a fixed numeric score using a lookup table.

- Input MUST be a string. Non-string values return **50** (default).
- Unknown keys return **50**.

| Example field         | Map                                                   | Notes                                           |
|-----------------------|-------------------------------------------------------|-------------------------------------------------|
| `hair.texture`        | `straight→80, wavy→75, curly→70, coily→60, kinky→55` |                                                 |
| `hair.porosity`       | `low→85, medium→70, high→35, highly_damaged→15`       |                                                 |
| `hair.elasticity`     | `excellent→90, good→70, moderate→45, poor→15`         |                                                 |
| `scalp.biotype`       | `dry→50, normal→90, oily→55, combination→65, sensitized→40` |                                         |
| `scalp.sebumProduction` | `"1"→55, "2"→90, "3"→55, "4"→25`                   | **String keys** — range input returns strings  |
| `body.activityLevel`  | `sedentary→30, light→55, moderate→75, active→85, athlete→70` |                                      |
| `body.dietType`       | `omnivore→70, vegetarian→75, vegan→65, keto→65, other→60` |                                         |
| `morphology.faceShape`| `oval→90, heart→80, diamond→78, round→68, square→68, oblong→62, triangle→62` |              |
| `morphology.undertone`| `neutral→85, warm→72, cool→72`                        |                                                 |

#### `RANGE_SCALE`

Linearly maps a numeric value from `[inputMin, inputMax]` to `[outputMin, outputMax]`.

- Non-numeric or non-finite values return **50**.
- Values are clamped to `[inputMin, inputMax]` before scaling.
- If `inputMax === inputMin`, returns `(outputMin + outputMax) / 2`.

Formula: `outputMin + ((clamped - inputMin) / (inputMax - inputMin)) × (outputMax - outputMin)`

| Example field             | inputMin | inputMax | outputMin | outputMax |
|---------------------------|----------|----------|-----------|-----------|
| `hair.density`            | 1        | 5        | 30        | 90        |
| `body.sleepQualityScore`  | 1        | 10       | 5         | 100       |
| `morphology.symmetryScore`| 0        | 100      | 0         | 100       |

#### `INVERTED_LINEAR`

Like `RANGE_SCALE` but inverted — higher raw input → lower score. Used for "worse = higher value" metrics.

Formula: `outputMin + (1 - linear) × (outputMax - outputMin)` where `linear = (clamped - inputMin) / (inputMax - inputMin)`

- Non-numeric or non-finite values return **50**.
- If `inputMax === inputMin`, returns `(outputMin + outputMax) / 2`.

| Example field           | inputMin | inputMax | outputMin | outputMax |
|-------------------------|----------|----------|-----------|-----------|
| `hair.damageIndex`      | 0        | 10       | 0         | 100       |
| `scalp.sensitivityLevel`| 1        | 5        | 10        | 90        |
| `scalp.phLevel`         | 3.5      | 7.5      | 10        | 90        |
| `body.stressIndex`      | 1        | 10       | 5         | 100       |

**Example** — `hair.damageIndex = 0` → score = `0 + (1 - 0) × 100 = 100`.
**Example** — `hair.damageIndex = 10` → score = `0 + (1 - 1) × 100 = 0`.
**Example** — `scalp.phLevel = 5.5` → linear = `(5.5 - 3.5) / (7.5 - 3.5) = 0.5` → score = `10 + (1 - 0.5) × 80 = 50`.

#### `BOOLEAN_SCORE`

Maps boolean to score: `true → 100`, `false → 0`.

---

### 5.4 Phase Thresholds

Phase assignment is based on `adjustedScore` (after red flag penalties):

| Phase            | Score Range         | `assignedPhase` value  |
|------------------|---------------------|------------------------|
| Stabilization    | 0 – 40 (inclusive)  | `"stabilization"`      |
| Transformation   | 41 – 65 (inclusive) | `"transformation"`     |
| Integration      | 66 – 100            | `"integration"`        |

**Override:** If any red flag has severity `"CRITICAL"` or `"BLOCK"`, `assignPhase()` returns `"stabilization"` regardless of score.

**Rule override:** If an active rule fires and produces a `SET_PHASE` action, that phase value takes precedence over the score-based assignment.

---

### 5.5 Phase Durations and Checkpoint Intervals

| Phase          | Min Weeks | Max Weeks | Checkpoint Interval |
|----------------|-----------|-----------|---------------------|
| Stabilization  | 4         | 12        | Every 2 weeks       |
| Transformation | 6         | 16        | Every 3 weeks       |
| Integration    | 8         | 52        | Every 4 weeks       |

**Duration formula:**
```
scoreFactor = 1 − adjustedScore / 100
flagExtension = sum of: CRITICAL flags × 3 weeks, WARNING flags × 1 week
rawWeeks = minWeeks + scoreFactor × (maxWeeks − minWeeks)
totalWeeks = min(round(rawWeeks) + flagExtension, maxWeeks)
```

**Checkpoint generation:** Checkpoints are placed at weeks `[interval, 2×interval, 3×interval, ...]` up to `totalWeeks`. Each checkpoint has two criteria:
1. `"Re-assess all module scores at week <N>"`
2. `"Evaluate phase transition readiness"`

---

### 5.6 Red Flag Rules

Red flags are evaluated by `evaluateRedFlags()` and are checked before rules.

#### RF_SCALP_007 — Open Lesions (BLOCK)

| Property               | Value                                                                          |
|------------------------|--------------------------------------------------------------------------------|
| `code`                 | `"RF_SCALP_007"`                                                               |
| `severity`             | `"BLOCK"`                                                                      |
| `penaltyFactor`        | `1.0`                                                                          |
| `requiresAcknowledgment` | `true`                                                                       |
| `message`              | `"Open scalp lesions detected — all chemical services are contraindicated until healed."` |
| **Trigger condition**  | `profile.scalp.openLesions === true`                                           |
| **Effect**             | `blocked = true` → pipeline returns early with `adjustedScore=0`, empty protocol, `assignedPhase="stabilization"` |

#### RF_SCALP_006 — Seborrheic + Elevated pH (CRITICAL)

| Property               | Value                                                                          |
|------------------------|--------------------------------------------------------------------------------|
| `code`                 | `"RF_SCALP_006"`                                                               |
| `severity`             | `"CRITICAL"`                                                                   |
| `penaltyFactor`        | `0.25`                                                                         |
| `requiresAcknowledgment` | `true`                                                                       |
| `message`              | `"Seborrheic condition with elevated pH — rebalancing protocol required before transformation work."` |
| **Trigger condition**  | `profile.scalp.conditions` (array) includes `"seborrheic"` AND `profile.scalp.phLevel > 6.0` |
| **Effect**             | `totalPenalty = max(currentPenalty, 0.25)` → `adjustedScore = compositeScore × 0.75`. Also forces `assignedPhase = "stabilization"` via `assignPhase()`. |

#### RF_HAIR_001 — Severe Damage (CRITICAL)

| Property               | Value                                                                          |
|------------------------|--------------------------------------------------------------------------------|
| `code`                 | `"RF_HAIR_001"`                                                                |
| `severity`             | `"CRITICAL"`                                                                   |
| `penaltyFactor`        | `0.30`                                                                         |
| `requiresAcknowledgment` | `false`                                                                      |
| `message`              | `"Severe structural damage (damage index 10/10) — emergency repair protocol initiated."` |
| **Trigger condition**  | `profile.hair.damageIndex >= 10`                                               |
| **Effect**             | `totalPenalty = max(currentPenalty, 0.30)` → `adjustedScore = compositeScore × 0.70`. Also forces `assignedPhase = "stabilization"`. |

**Important:** If both RF_SCALP_006 and RF_HAIR_001 trigger simultaneously, `totalPenalty = max(0.25, 0.30) = 0.30` (NOT additive — uses `Math.max`).

---

### 5.7 DEFAULT_RULES

Six rules are shipped in `DEFAULT_RULES`. Rules are sorted by `priority` ascending before evaluation (lower number = evaluated first). **Rule conditions use exact string matching — case is significant.**

#### rule-001 — Block on Open Lesions (priority 100)

| Property           | Value                                                        |
|--------------------|--------------------------------------------------------------|
| `moduleScope`      | `"scalp"`                                                    |
| `isActive`         | `true`                                                       |
| `conflictStrategy` | `"override"`                                                 |
| **Condition**      | `scalp.openLesions EQUALS true`                              |
| **Actions**        | `BLOCK_PROTOCOL` ("Open scalp lesions — chemical services contraindicated."), `TRIGGER_ALERT` target=`"OPEN_LESIONS"` value=`"BLOCK"` |
| **Effect**         | Returns `status: "BLOCKED"` from `evaluateRules()`, stopping further rule processing |

#### rule-002 — Critical Alert on Severe Damage (priority 90)

| Property           | Value                                                        |
|--------------------|--------------------------------------------------------------|
| `moduleScope`      | `"hair"`                                                     |
| `isActive`         | `true`                                                       |
| `conflictStrategy` | `"override"`                                                 |
| **Condition**      | `hair.damageIndex GREATER_THAN_OR_EQUAL 9`                   |
| **Actions**        | `TRIGGER_ALERT` target=`"SEVERE_DAMAGE"` value=`"CRITICAL"`, `SET_PHASE` value=`"stabilization"` |
| **Effect**         | Forces phase to `"stabilization"` for damage index 9 or 10  |

#### rule-003 — Warning on Seborrheic Scalp + Elevated pH (priority 80)

| Property           | Value                                                        |
|--------------------|--------------------------------------------------------------|
| `moduleScope`      | `"scalp"`                                                    |
| `isActive`         | `true`                                                       |
| `conflictStrategy` | `"merge"`                                                    |
| **Condition**      | `scalp.biotype EQUALS "SEBORRHEIC"` AND `scalp.phLevel GREATER_THAN 5.5` |
| **Actions**        | `TRIGGER_ALERT` target=`"SEBORRHEIC_HIGH_PH"` value=`"WARNING"` |
| **Note**           | Condition value `"SEBORRHEIC"` is uppercase — will NOT match `"seborrheic"` |

#### rule-004 — Penalise High Porosity (priority 70)

| Property           | Value                                                        |
|--------------------|--------------------------------------------------------------|
| `moduleScope`      | `"hair"`                                                     |
| `isActive`         | `true`                                                       |
| `conflictStrategy` | `"merge"`                                                    |
| **Condition**      | `hair.porosity EQUALS "HIGH"`                                |
| **Actions**        | `ADJUST_SCORE` target=`"hair"` value=`-5` modifier=`"ADD"`  |
| **Note**           | Condition value `"HIGH"` is uppercase — will NOT match `"high"` |

#### rule-005 — Boost Score for Excellent Body Health (priority 60)

| Property           | Value                                                         |
|--------------------|---------------------------------------------------------------|
| `moduleScope`      | `"body"`                                                      |
| `isActive`         | `true`                                                        |
| `conflictStrategy` | `"merge"`                                                     |
| **Condition**      | `body.nutritionalScore GREATER_THAN_OR_EQUAL 8` AND `body.stressIndex LESS_THAN_OR_EQUAL 3` |
| **Actions**        | `ADJUST_SCORE` target=`"body"` value=`+8` modifier=`"ADD"`   |

#### rule-006 — Warning on High Stress + Hormonal Disruption (priority 75)

| Property           | Value                                                         |
|--------------------|---------------------------------------------------------------|
| `moduleScope`      | `"body"`                                                      |
| `isActive`         | `true`                                                        |
| `conflictStrategy` | `"merge"`                                                     |
| **Condition**      | `body.stressIndex GREATER_THAN_OR_EQUAL 8` AND `body.hormonalIndex GREATER_THAN_OR_EQUAL 7` |
| **Actions**        | `TRIGGER_ALERT` target=`"HIGH_STRESS_HORMONAL"` value=`"WARNING"` |

**Rule evaluation order by priority (ascending):** rule-005 (60) → rule-004 (70) → rule-006 (75) → rule-003 (80) → rule-002 (90) → rule-001 (100).

---

### 5.8 DEFAULT_WEIGHTS

The weights used by the `/api/evaluate` Next.js route and by `protocol.service.ts`:

```json
{
  "modules": {
    "hair": 0.40,
    "scalp": 0.30,
    "body": 0.20,
    "morphology": 0.10
  },
  "fields": {
    "hair": { "texture": 0.10, "density": 0.15, "porosity": 0.20, "elasticity": 0.25, "damageIndex": 0.30 },
    "scalp": { "biotype": 0.15, "sebumProduction": 0.20, "sensitivity": 0.15, "phLevel": 0.20, "microbiomeBalance": 0.30 },
    "body": { "hormonalIndex": 0.25, "nutritionalScore": 0.30, "stressIndex": 0.25, "hydrationPct": 0.20 },
    "morphology": { "symmetryScore": 0.40, "undertone": 0.30, "faceShape": 0.30 }
  }
}
```

---

### 5.9 Expected Outputs for Key Scenarios

All scenarios below assume `DEFAULT_RULES`, `DEFAULT_WEIGHTS`, and the NORMALIZERS defined in `/api/evaluate/route.ts`.

#### Scenario A: `damageIndex=10, openLesions=true` → BLOCKED

- **Input:** `{ hair: { damageIndex: 10 }, scalp: { openLesions: true } }`
- **Step 3:** RF_SCALP_007 triggers (openLesions=true) → `blocked=true`
- **Step 4 BLOCK early return:**
  ```json
  {
    "adjustedScore": 0,
    "assignedPhase": "stabilization",
    "redFlags": [{ "code": "RF_SCALP_007", "severity": "BLOCK", ... }],
    "appliedActions": [],
    "protocol": { "phases": [], "services": [], "checkpoints": [], "frequency": { "interval": 0, "unit": "weeks" } }
  }
  ```
- **`isBlocked`** in `/api/evaluate` response: `true`
- **Services:** Not rendered in UI.
- **Red flag message displayed:** `"RF_SCALP_007: Open scalp lesions detected — all chemical services are contraindicated until healed."`

#### Scenario B: `damageIndex=9` → Stabilization

- **Input:** `{ hair: { damageIndex: 9, ... } }`
- **Red flags:** RF_HAIR_001 triggers (damageIndex >= 10? No — damageIndex=9 does NOT trigger RF_HAIR_001). Check: `damageIndex >= 10` → false. No red flag penalty.
- **rule-002** fires (damageIndex >= 9) → `SET_PHASE: "stabilization"`, `TRIGGER_ALERT: CRITICAL`
- **`assignedPhase`:** `"stabilization"` (forced by rule-002, regardless of score)
- **`isBlocked`:** `false`
- **Phase banner colour:** amber (`bg-amber-600`)

#### Scenario C: `damageIndex=5, biotype=normal, stress=3` → Transformation

- **Input:** `{ hair: { damageIndex: 5 }, scalp: { biotype: "normal" }, body: { stressIndex: 3 } }`
- **Red flags:** None trigger.
- **rule-002:** damageIndex=5, not >= 9 → does not fire.
- **Hair damage normalizer:** `INVERTED_LINEAR(5, inputMin=0, inputMax=10)` → linear=0.5 → score=50.
- **Scalp biotype normalizer:** `ENUM_MAP("normal")` → 90.
- **Composite score** (partial, with defaults for missing fields): approximately in range 41–65.
- **`assignedPhase`:** `"transformation"`
- **Phase banner colour:** brand/navy (`bg-brand`, `#1A1A2E`)

#### Scenario D: `damageIndex=0, biotype=normal, sleep=9, stress=1` → Integration

- **Input:** `{ hair: { damageIndex: 0 }, scalp: { biotype: "normal" }, body: { sleepQualityScore: 9, stressIndex: 1 } }`
- **Red flags:** None.
- **`hair.damageIndex` normalizer:** `INVERTED_LINEAR(0, 0, 10, 0, 100)` → score = 100.
- **`scalp.biotype` normalizer:** `ENUM_MAP("normal")` → 90.
- **`body.sleepQualityScore` normalizer:** `RANGE_SCALE(9, 1, 10, 5, 100)` → linear = (9−1)/(10−1) = 8/9 → score ≈ 89.4.
- **`body.stressIndex` normalizer:** `INVERTED_LINEAR(1, 1, 10, 5, 100)` → linear = 0 → score = 100.
- **rule-005** fires: `body.nutritionalScore >= 8` requires nutritionalScore to be provided; if not provided field is missing (score skipped). If nutritionalScore is also >= 8, +8 score boost on body module.
- **High composite score** → `adjustedScore >= 66`
- **`assignedPhase`:** `"integration"`
- **Phase banner colour:** emerald (`bg-emerald-700`)

---

### 5.10 `EvaluationResult` Shape

```typescript
interface EvaluationResult {
  evaluationId: string;           // UUID (crypto.randomUUID())
  compositeScore: number;         // before red flag penalty
  adjustedScore: number;          // after red flag penalty (0 if blocked)
  moduleScores: {
    hair: number;
    scalp: number;
    body: number;
    morphology: number;
  };
  assignedPhase: "stabilization" | "transformation" | "integration";
  redFlags: RedFlag[];
  appliedActions: RuleAction[];
  protocol: {
    phases: PhaseOutput[];
    services: ServiceOutput[];
    checkpoints: CheckpointOutput[];
    frequency: { interval: number; unit: "days" | "weeks" };
  };
  trace?: EvaluationTrace;        // only if includeTrace=true
}
```

---

## 6. Consultation Wizard Spec

The wizard lives in `apps/web/src/components/consultation/wizard.tsx` and is a 6-step client-side form. State accumulates in a `ConsultationData` object passed through all steps. Navigation: steps 1–5 advance on form submit; step 6 auto-fires the evaluation.

### Wizard State Type

```typescript
type ConsultationData = {
  clientId?: string;
  firstName?: string;
  lastName?: string;
  hair?: Record<string, unknown>;
  scalp?: Record<string, unknown>;
  body?: Record<string, unknown>;
  morphology?: Record<string, unknown>;
};
```

---

### Step 1 — Client Profile (`step1-profile.tsx`)

#### Fields Collected

| Field                  | HTML Input    | Type    | Required | Validation                                               |
|------------------------|---------------|---------|----------|----------------------------------------------------------|
| `firstName`            | text          | string  | yes      | Min 1 character ("Required")                             |
| `lastName`             | text          | string  | yes      | Min 1 character ("Required")                             |
| `dateOfBirth`          | date          | string  | no       | ISO date format; stored as string                        |
| `genderIdentity`       | select        | string  | no       | Options: `""` (Prefer not to say), `female`, `male`, `non_binary`, `other` |
| `consentDataProcessing`| checkbox      | boolean | yes      | MUST be `true` ("Consent required" shown if unchecked)   |

#### Validation Schema (Zod)

```typescript
z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  dateOfBirth: z.string().optional(),
  genderIdentity: z.string().optional(),
  consentDataProcessing: z.boolean().refine((v) => v === true, "Consent required"),
})
```

#### Behaviour

- On submit: saves `{ firstName, lastName }` into `ConsultationData` (note: `dateOfBirth` and `genderIdentity` are captured by the form but not passed to `onUpdate`).
- If consent checkbox is unchecked, form does NOT advance. Error message shown: `"Consent required"`.
- `consentDataProcessing` is local to the wizard UI and is NOT included in the payload sent to `/api/evaluate`.

---

### Step 2 — Hair Assessment (`step2-hair.tsx`)

#### Fields Collected

| Field             | Input Type   | Values (form)                                                  | Required |
|-------------------|--------------|----------------------------------------------------------------|----------|
| `texture`         | radio        | `straight`, `wavy`, `curly`, `coily`, `kinky`                  | yes      |
| `density`         | range slider | `1`–`5` (step 1); stored as **string** by RHF default         | no       |
| `porosity`        | radio        | `low`, `medium`, `high`, `highly_damaged`                      | no       |
| `elasticity`      | radio        | `excellent`, `good`, `moderate`, `poor`                        | no       |
| `chemicalHistory` | checkbox[]   | `colour_treated_(permanent)`, `colour_treated_(semi/demi)`, `bleach_/_lightening`, `relaxer_/_keratin`, `thermal_damage_(regular_heat)` | no |
| `damageIndex`     | range slider | `0`–`10` (step 1); stored as **number** (`valueAsNumber: true`) | no      |

**Important:** `density` range returns a string (no `valueAsNumber`). The `/api/evaluate` route coerces it via `Number(body.hair.density ?? 3)`.

#### Validation

- `texture` is the only required field — an error is shown if not selected.
- All other fields are optional; the form advances even without them.

#### On Submit

Saves entire form values object as `{ hair: <values> }` in `ConsultationData`.

---

### Step 3 — Scalp Assessment (`step3-scalp.tsx`)

#### Fields Collected

| Field              | Input Type   | Values (form)                                                        | Required |
|--------------------|--------------|----------------------------------------------------------------------|----------|
| `biotype`          | radio        | `dry`, `normal`, `oily`, `combination`, `sensitized`                 | yes      |
| `sebumProduction`  | range slider | `1`–`4` (step 1); stored as **string** by RHF default                | no       |
| `sensitivityLevel` | range slider | `1`–`5` (step 1); stored as **number** (`valueAsNumber: true`)       | no       |
| `phLevel`          | number input | `3.5`–`7.5` (step 0.1); stored as **number** (`valueAsNumber: true`) | no       |
| `conditions`       | checkbox[]   | `dandruff`, `seborrheic`, `psoriasis`, `open_lesions`, `alopecia`, `folliculitis` | no |

**`scalp.openLesions` derivation:** This field is NOT directly in the form. The `/api/evaluate` route derives it:
```typescript
openLesions = conditionsArr.includes("open_lesions")
```
So if `"open_lesions"` is checked in `conditions`, `scalp.openLesions` becomes `true` in the engine profile.

**`scalp.conditions` from RHF:** Depending on how many checkboxes are ticked:
- 0 checked: `undefined`
- 1 checked: `string` (single value)
- 2+ checked: `string[]`

The `/api/evaluate` route normalises this to always be `string[]`.

#### Validation

- `biotype` is required; error shown if not selected.
- All other fields are optional.

---

### Step 4 — Body Optimisation (`step4-body.tsx`)

#### Fields Collected

| Field               | Input Type   | Values (form)                                         | Required |
|---------------------|--------------|-------------------------------------------------------|----------|
| `sleepQualityScore` | range slider | `1`–`10`; stored as **number** (`valueAsNumber: true`) | no      |
| `stressIndex`       | range slider | `1`–`10`; stored as **number** (`valueAsNumber: true`) | no      |
| `activityLevel`     | radio        | `sedentary`, `light`, `moderate`, `active`, `athlete` | no       |
| `dietType`          | select       | `omnivore`, `vegetarian`, `vegan`, `keto`, `other`    | no       |
| `hormonalEvents`    | checkbox[]   | `post_partum`, `menopause_transition`, `thyroid_changes`, `significant_medication_change`, `significant_weight_change_(±10kg)` | no |

#### Validation

No required fields. Form always advances on submit.

#### Notes

- `hormonalEvents` is informational context; it is not used by any engine normalizer or default rule. It is passed through as part of `body` in the payload but has no scoring effect unless custom rules reference `body.hormonalEvents`.
- The route coerces: `sleepQualityScore: Number(body.body.sleepQualityScore ?? 5)`, `stressIndex: Number(body.body.stressIndex ?? 5)`.

---

### Step 5 — Morphology & Visagism (`step5-morphology.tsx`)

#### Fields Collected

| Field          | Input Type   | Values (form)                                              | Required |
|----------------|--------------|------------------------------------------------------------|----------|
| `faceShape`    | radio        | `oval`, `round`, `square`, `heart`, `diamond`, `oblong`, `triangle` | yes |
| `undertone`    | radio        | `warm`, `neutral`, `cool`                                  | yes      |
| `contrastLevel`| radio        | `low`, `medium`, `high`                                    | no       |

#### Notes

- A face scan camera placeholder UI is present (iPad/TrueDepth) but is decorative; no image capture is implemented.
- The `/api/evaluate` route forces `symmetryScore: 65` when `morphology` is provided (it ignores any `symmetryScore` from the form).
- `contrastLevel` is passed through but has no active normalizer or rule.

#### On Submit

Saves entire form values as `{ morphology: <values> }` in `ConsultationData`. Then navigates to step 6.

---

### Step 6 — Protocol Results (`step6-protocol.tsx`)

#### Behaviour

On mount (via `useEffect`), immediately fires:

```
POST /api/evaluate
Content-Type: application/json

{
  "hair": <ConsultationData.hair>,
  "scalp": <ConsultationData.scalp>,
  "body": <ConsultationData.body>,
  "morphology": <ConsultationData.morphology>
}
```

- Shows a loading spinner with "Analysing profile…" while awaiting response.
- On non-OK HTTP response or network error: shows error state with "Could not generate protocol. Please try again." and a Back button.
- On success: renders the protocol result.

#### `/api/evaluate` Endpoint (Next.js Route Handler)

`POST /api/evaluate` — handled in `apps/web/src/app/api/evaluate/route.ts`.

**Input transformation before calling engine:**

1. `scalp.conditions` normalised to `string[]` (handles `undefined`, single string, or array).
2. `scalp.openLesions` is derived: `conditionsArr.includes("open_lesions")`.
3. `hair.damageIndex` coerced to `Number()`.
4. `hair.density` coerced to `Number()`.
5. `scalp.phLevel`, `scalp.sebumProduction`, `scalp.sensitivityLevel` coerced to `Number()` if present.
6. `body.sleepQualityScore`, `body.stressIndex` coerced to `Number()`.
7. `morphology.symmetryScore` overridden to `65` (hardcoded).
8. Missing `hair` → defaults: `{ damageIndex: 3, density: 3, texture: "straight", porosity: "medium", elasticity: "good" }`.
9. Missing `scalp` → defaults: `{ biotype: "normal", sebumProduction: 2, sensitivityLevel: 2, conditions: [] }`.
10. Missing `body` → `undefined` (excluded from profile).
11. Missing `morphology` → `undefined` (excluded from profile).

**Engine call:**
```typescript
evaluate({
  profile,
  rules: DEFAULT_RULES,
  weights: DEFAULT_WEIGHTS,
  normalizers: NORMALIZERS,  // defined in route.ts
  redFlagRules: RED_FLAG_RULES,
  includeTrace: true,
})
```

**Response Shape:**

```json
{
  "phase": "Stabilization",        // Capitalised ("Stabilization" | "Transformation" | "Integration")
  "score": 34,                     // Math.round(adjustedScore)
  "compositeScore": 38,            // Math.round(compositeScore)
  "moduleScores": {
    "hair": 45,
    "scalp": 60,
    "body": 50,
    "morphology": 65
  },
  "redFlags": [
    "RF_SCALP_007: Open scalp lesions detected — all chemical services are contraindicated until healed."
  ],
  "isBlocked": true,               // true if any red flag has severity "BLOCK"
  "services": [
    "Emergency Scalp Detox Protocol — every session",
    "Porosity Sealing Treatment — every session"
  ],
  "checkpoints": [
    "Week 2 — Re-assess all module scores at week 2, Evaluate phase transition readiness",
    "Week 4 — Re-assess all module scores at week 4, Evaluate phase transition readiness"
  ],
  "frequency": { "interval": 14, "unit": "days" },
  "trace": { ... }
}
```

- `phase` is capitalised: `result.assignedPhase.charAt(0).toUpperCase() + result.assignedPhase.slice(1)`.
- `services` = base phase services + conditional extras, deduplicated.
- If engine produces no checkpoints, fallback is: `["Week 3 — Scalp re-assessment", "Week 6 — Full module re-score", "Week 12 — Phase transition evaluation"]`.
- On any exception: `{ "error": "Evaluation failed" }` with HTTP 500.

#### Phase-Based Base Services

| Phase          | Services                                                                      |
|----------------|-------------------------------------------------------------------------------|
| Stabilization  | Emergency Scalp Detox Protocol — every session; pH Rebalancing Therapy — every session; Reconstructive Repair Treatment — every 10 days; Gentle Moisture Infusion — every 14 days |
| Transformation | Scalp Rebalancing Treatment — every session; Deep Moisture Treatment — every 14 days; Protein-Moisture Balance — every 14 days; Keratin Reconstruction Booster — sessions 2 & 4 |
| Integration    | Maintenance Hydration Treatment — every 21 days; Scalp Health Maintenance — every session; Colour Protection & Gloss Service — every 28 days; Preventive Strengthening Mask — monthly |

#### Conditional Extra Services

| Trigger Condition                                                | Added Service                                                   |
|------------------------------------------------------------------|-----------------------------------------------------------------|
| `damageIndex >= 7`                                               | Keratin Reconstruction Booster — sessions 2 & 4                |
| `porosity === "high"` OR `porosity === "highly_damaged"`          | Porosity Sealing Treatment — every session                      |
| `conditions.includes("seborrheic")`                              | Anti-Seborrheic Scalp Treatment — every 10 days                 |
| `conditions.includes("dandruff")`                                | Anti-Dandruff Therapy — every session                           |
| `conditions.includes("alopecia")`                                | Trichology Stimulation Protocol — every session                 |
| `stressIndex >= 7`                                               | Stress-Recovery Scalp Ritual — monthly                          |
| `chemicalHistory` includes a string containing `"bleach"` or `"lightening"` | Bleach-Recovery Bond Building Treatment — every session |

#### UI Behaviour Requirements

**Phase Banner Colours:**

| Phase          | CSS Class        | Hex Colour   |
|----------------|------------------|--------------|
| Stabilization  | `bg-amber-600`   | `#D97706`    |
| Transformation | `bg-brand`       | `#1A1A2E`    |
| Integration    | `bg-emerald-700` | `#047857`    |

**Blocked State (`isBlocked: true`):**
- Show a red banner (`bg-red-50`, `border-red-200`) before the phase banner.
- Message: "Services Blocked — Chemical and invasive services are contraindicated. Please address the flagged conditions before proceeding."
- The "Prescribed Services" section is hidden (`!protocol.isBlocked` guard).
- The phase banner is still shown with `assignedPhase = "stabilization"`.

**Red Flag Warnings:**
- When `redFlags.length > 0`, show an amber warning panel (`bg-amber-50`, `border-amber-200`).
- Each red flag is rendered as `"<code>: <message>"`.

**Module Score Colours:**
- Score `>= 70`: `text-emerald-600`
- Score `45–69`: `text-amber-600`
- Score `< 45`: `text-red-500`

**Loading State:**
- Full-page spinner: a circular element with `animate-spin` class.
- Text: "Analysing profile…" + "Running decision engine across all modules"

**Save to Client File:**
- Clicking "Save to Client File" redirects to `/dashboard` (no API call in current implementation).

**Print:**
- A print icon button calls `window.print()`.

---

## 7. Settings Page Spec

Route: `/dashboard/settings`
Component: `apps/web/src/app/(dashboard)/settings/page.tsx`

The settings page has five tabs: **Salon**, **Account**, **GDPR & Privacy**, **Notifications**, **Appearance**.

---

### 7.1 Tab Navigation

| Tab ID          | Label            | Icon       |
|-----------------|------------------|------------|
| `salon`         | Salon            | Building2  |
| `account`       | Account          | User       |
| `gdpr`          | GDPR & Privacy   | Shield     |
| `notifications` | Notifications    | Bell       |
| `appearance`    | Appearance       | Palette    |

Active tab indicator: bottom border `border-[#C9A96E]` with `text-[#1A1A2E] font-medium`.

---

### 7.2 Salon Tab

#### Profile Fields

| Field      | Type   | Constraints                                                     | Notes                                    |
|------------|--------|-----------------------------------------------------------------|------------------------------------------|
| `salonName`| string | Free text input                                                 | Default: `"Salon Lumière"`               |
| `slug`     | string | Auto-lowercased; spaces replaced with `-`                       | Default: `"salon-lumiere"`               |
| `country`  | select | One of 28 predefined countries                                  | Default: `"France"`                      |
| `timezone` | select | One of 24 predefined IANA timezone strings                      | Default: `"Europe/Paris"`                |

**Countries list** (28 options): Australia, Austria, Belgium, Brazil, Canada, Denmark, Finland, France, Germany, Greece, India, Ireland, Italy, Japan, Luxembourg, Netherlands, New Zealand, Norway, Poland, Portugal, Singapore, South Africa, Spain, Sweden, Switzerland, United Arab Emirates, United Kingdom, United States.

**Timezones list** (24 options): UTC, Europe/London, Europe/Paris, Europe/Berlin, Europe/Rome, Europe/Madrid, Europe/Amsterdam, Europe/Brussels, Europe/Zurich, Europe/Warsaw, Europe/Lisbon, America/New\_York, America/Chicago, America/Denver, America/Los\_Angeles, America/Toronto, America/Sao\_Paulo, Asia/Dubai, Asia/Tokyo, Asia/Shanghai, Asia/Singapore, Asia/Kolkata, Australia/Sydney, Pacific/Auckland.

#### Data Residency Display (read-only)

| Field        | Displayed Value |
|--------------|-----------------|
| Region       | "EU West" (badge) |
| DPA Signed   | "Yes" (badge)   |

---

### 7.3 Account Tab

#### Fields

| Field             | Type     | Constraints                                                      |
|-------------------|----------|------------------------------------------------------------------|
| `email`           | email    | Standard email format                                            |
| `currentPassword` | password | Required to change password (UI only; no current enforcement)    |
| `newPassword`     | password | Min 8 characters (validation triggers only when `newPassword` is non-empty) |
| `confirmPassword` | password | MUST equal `newPassword`                                         |

#### Password Change Validation Rules

1. If `newPassword` is non-empty AND `newPassword !== confirmPassword`: error `"Passwords do not match"`.
2. If `newPassword` is non-empty AND `newPassword.length < 8`: error `"Password must be at least 8 characters"`.
3. Errors are displayed in a red `<p>` beneath the confirm field.
4. Errors clear automatically when either `newPassword` or `confirmPassword` input is changed.
5. If `newPassword` is empty, no password validation runs (password change is considered skipped).

---

### 7.4 Notifications Tab

Four toggles, all defaulting to **enabled (`true`)**:

| Key                    | Label                        | Description                                         |
|------------------------|------------------------------|-----------------------------------------------------|
| `checkpointReminders`  | Checkpoint reminders         | Get notified when a client checkpoint is due        |
| `protocolCompletions`  | Protocol completions         | Alert when a client completes a phase               |
| `newConsultation`      | New consultation booked      | Notify when a new consultation is scheduled         |
| `redFlagAlerts`        | Red flag alerts              | Immediate alert when a red flag is detected         |

Toggles are `<button role="switch" aria-checked={enabled}>` elements. Clicking toggles the boolean state.

---

### 7.5 Appearance Tab

Four themes available:

| `id`      | Label     | Primary Colour | Accent Colour |
|-----------|-----------|----------------|---------------|
| `default` | Default   | `#1A1A2E`      | `#C9A96E`     |
| `rose`    | Rosé      | `#2D1B1B`      | `#E8A0A0`     |
| `sage`    | Sage      | `#1B2D1E`      | `#8EC3A7`     |
| `slate`   | Slate     | `#1A2030`      | `#8EB3C9`     |

Default active theme: `"default"`.

Theme selection is visual only — it sets `activeTheme` state but does NOT apply CSS variables at this time. A note states: "Theme preference is saved locally. Full CSS variable switching coming soon."

---

### 7.6 GDPR & Privacy Tab (read-only display + retention settings)

**Compliance status display (read-only):**

| Item                    | Value                                       |
|-------------------------|---------------------------------------------|
| Data Processing Agreement | Signed 2026-01-01                         |
| Right to Erasure          | Enabled                                   |
| Consent Records           | Active                                    |
| Audit Logging             | Active                                    |
| Biometric Processing      | On-device only (GDPR compliant)           |

**Data Retention fields:**

| Field              | Type   | Constraints  | Default |
|--------------------|--------|--------------|---------|
| `clientRetention`  | number | 1–10 (years) | `"7"`   |
| `auditRetention`   | number | 1–10 (years) | `"5"`   |

---

### 7.7 Save Behaviour

Clicking "Save changes":
1. If on the **Account** tab, password validation runs first. If it fails, save is aborted and error shown.
2. All settings are serialised as JSON and written to `localStorage` under the key `"hc_settings"`:
   ```json
   {
     "salon": { "salonName": "...", "slug": "...", "country": "...", "timezone": "..." },
     "notifications": { "checkpointReminders": true, "protocolCompletions": true, "newConsultation": true, "redFlagAlerts": true },
     "appearance": { "activeTheme": "default" },
     "gdpr": { "clientRetention": "7", "auditRetention": "5" }
   }
   ```
3. The button icon and text changes to a checkmark "Saved!" for **2000ms**, then reverts to "Save changes".
4. **No backend API call is made** — all persistence is client-side via `localStorage`.

---

## 8. GDPR Compliance Spec

---

### 8.1 When `gdprConsentGiven` is Required

`gdprConsentGiven: true` (the boolean literal `true`) is **mandatory** on the `POST /clients` endpoint. This is enforced via a Zod `z.literal(true)` schema:

- Submitting `gdprConsentGiven: false` → HTTP 422, `VALIDATION_ERROR`, with message `"GDPR consent must be explicitly granted before creating a client record."`
- Omitting `gdprConsentGiven` entirely → HTTP 422, same error.
- The API does not accept `"true"` (string) or `1` (number) — only the boolean `true`.

When `gdprConsentGiven = true`, `gdprConsentGivenAt` is automatically set to the current server timestamp.

In the **consultation wizard** (UI only), `consentDataProcessing` must be checked (Step 1). The form will not advance if it is unchecked. However, this wizard consent flag is NOT sent to any API — it gates local UI progression only.

---

### 8.2 What Happens if Consent is False

- Any attempt to create a client record with `gdprConsentGiven !== true` returns a `422` error.
- There is no concept of creating a client in "pending consent" state via the API — a client record CANNOT exist without GDPR consent.

---

### 8.3 Data That Must Be Deletable (Right to Erasure)

The DB schema provides explicit erasure tracking:

| Table      | Column       | Type                | Purpose                                           |
|------------|--------------|---------------------|---------------------------------------------------|
| `clients`  | `deletedAt`  | timestamp with tz   | Soft delete timestamp                             |
| `clients`  | `erasedAt`   | timestamp with tz   | GDPR erasure timestamp (personal data wiped)      |

A GDPR erasure event MUST:
1. Set `clients.erasedAt` to the current timestamp.
2. Remove or anonymise all personally identifiable information: `firstName`, `lastName`, `primaryEmail`, `primaryPhone`, `dateOfBirth`, `preferredName`, `notes`.
3. Cascade to linked profile tables (`hair_profiles`, `scalp_profiles`, `body_profiles`, `morphology_profiles`) — profile records for the client should also be erased.
4. Retain: `id`, `tenantId`, `clientRef`, `gdprConsentGiven`, `gdprConsentGivenAt`, `createdAt`, `erasedAt` for legal audit purposes.

**Audit log retention:** Configurable per-tenant in the UI (default 5 years, range 1–10 years). Audit logs are not subject to the same erasure as client PII.

**Client data retention:** Configurable per-tenant (default 7 years, range 1–10 years).

**Tenant-level GDPR fields:**
- `tenants.gdprDpaSignedAt` — when the Data Processing Agreement was signed.
- `tenants.dataResidencyRegion` — where data is stored (default `"eu-west-1"`).

**Consent records** are considered always active (as shown in the UI compliance status panel).

**Biometric data** (face geometry from morphology step): processed on-device only, not stored or transmitted (per UI disclaimer in Step 5).

---

## 9. Security Spec

---

### 9.1 Rate Limiting

Applied globally to all routes via `@fastify/rate-limit`:

| Property     | Value                                           |
|--------------|-------------------------------------------------|
| Max requests | 100 per time window                             |
| Time window  | 1 minute                                        |
| HTTP status  | 429                                             |
| Error code   | `"RATE_LIMIT_EXCEEDED"`                         |
| Error message| `"Rate limit exceeded. Retry in <time>"`        |

The `<time>` value is provided by `context.after` from the rate-limit plugin (e.g. `"30 seconds"`).

---

### 9.2 UUID Validation on ID Parameters

Applies to: `GET /clients/:id`, `GET /clients/:id/full-profile`.

Validation regex (applied before any DB query):
```
/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
```

If the `:id` parameter does not match this regex:
- HTTP 400
- `code: "INVALID_ID"`
- `message: "Client ID must be a valid UUID"`

This prevents SQL injection via ID parameters and ensures no DB query is fired for malformed IDs.

---

### 9.3 LIKE Wildcard Escaping

In `GET /clients?search=<query>`, the search term is used in a PostgreSQL `ILIKE` query. Before interpolation, all LIKE metacharacters are escaped:

```typescript
search.replace(/[%_\\]/g, "\\$&")
```

| Character | Escaped form |
|-----------|-------------|
| `%`       | `\%`        |
| `_`       | `\_`        |
| `\`       | `\\`        |

This prevents LIKE-injection attacks where a client could scan for arbitrary patterns.

---

### 9.4 Tenant Isolation

Every authenticated route enforces tenant isolation:

1. The `tenantMiddleware` (`apps/api/src/plugins/tenant.ts`) runs as a `preHandler` hook on every request.
2. It calls `request.jwtVerify()` for all non-public routes.
3. If the JWT is missing or invalid → 401.
4. If the JWT payload lacks `tenantId` → 401 with `"Invalid token: missing tenantId"`.
5. The `tenantId` from the verified JWT is extracted as `req.user.tenantId` and used for all DB queries.
6. EVERY query against multi-tenant tables includes `WHERE tenant_id = <jwt.tenantId>`.

#### Public Routes (no JWT required)

- `GET /health`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

---

### 9.5 Global Error Handler

The Fastify global error handler intercepts all unhandled errors:

- If the error's HTTP status is **< 500**: the original `message` and `code` are forwarded to the client.
- If the error's HTTP status is **>= 500** (or undefined): always responds with `"An unexpected error occurred"` — no DB error messages, stack traces, or internal details are leaked.

This is in addition to the explicit try/catch blocks in each route handler, which already sanitise responses.

---

### 9.6 Password Security

- Passwords are hashed with `bcrypt` using a **cost factor of 12** (`bcrypt.hash(password, 12)`).
- The `verifyCredentials` function uses constant-time comparison via `bcrypt.compare`.
- Minimum password length enforced at login: **8 characters** (Zod schema).
- Minimum password length for change in settings UI: **8 characters** (client-side validation only).
- The `users` table stores `passwordHash` — the raw password is never stored.

---

### 9.7 CORS Configuration

- Allowed origin: `APP_URL` environment variable (default: `http://localhost:3000`).
- Credentials: allowed (`credentials: true`).
- Allowed methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.

---

### 9.8 HTTP Security Headers

Applied via `@fastify/helmet`. Provides standard security headers:
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Strict-Transport-Security`

---

### 9.9 JWT Configuration

| Property           | Value                                                     |
|--------------------|-----------------------------------------------------------|
| Algorithm          | HS256 (default for `@fastify/jwt`)                        |
| Secret source      | `JWT_SECRET` env var (minimum 32 characters enforced)     |
| Access token TTL   | 900 seconds (15 minutes)                                  |
| Refresh token      | Stored in `hc_refresh` cookie (HttpOnly, unsigned)        |
| Refresh secret     | `JWT_REFRESH_SECRET` env var (min 32 chars; validated at startup) |

---

*End of HairCode™ Formal System Specifications v1.0.0*
