# HairCode™ — Code Review Findings

**Reviewer:** Claude Sonnet 4.6 (automated review agent)
**Date:** 2026-03-05
**Scope:** Full monorepo review — `apps/web`, `apps/api`, `packages/engine`, `packages/db`

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 7     |
| HIGH     | 9     |
| MEDIUM   | 8     |
| LOW      | 6     |
| **Total**| **30**|

---

## CRITICAL Issues

---

### CRIT-01 — No authentication on `/api/evaluate` Next.js route — unauthenticated engine access

**File:** `apps/web/src/app/api/evaluate/route.ts`, line 170
**Description:**
The `POST /api/evaluate` route handler runs the full decision engine without any JWT verification or session check. Any unauthenticated external caller can POST arbitrary data to this endpoint and receive a scored evaluation result. This bypasses the Fastify tenant middleware entirely because this is a Next.js route handler, not a Fastify route. There is no call to `getServerSession`, no `Authorization` header check, and no tenant context established.

**Impact:** Full engine access without authentication; potential DoS via compute abuse; competitor intelligence leakage.

**Suggested fix:**
```typescript
// At the top of the POST handler, before any logic:
import { headers } from "next/headers";
import { verifyJWT } from "@/lib/auth"; // implement thin verifier using jose or jsonwebtoken

export async function POST(req: NextRequest) {
  const authHeader = (await headers()).get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyJWT(token); // throws on invalid
  if (!payload?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // ... rest of handler
}
```

---

### CRIT-02 — `scalp.sebumProduction` range input returns a string but normalizer ENUM_MAP uses numeric keys

**File:** `apps/web/src/components/consultation/steps/step3-scalp.tsx`, line 49
**File:** `apps/web/src/app/api/evaluate/route.ts`, line 197

**Description:**
In `step3-scalp.tsx` line 49, the `sebumProduction` range input is registered as:
```tsx
<input {...register("sebumProduction")} type="range" min={1} max={4} step={1} ... />
```
There is **no** `{ valueAsNumber: true }` option. React Hook Form therefore returns this as a **string** (e.g., `"2"`). The `route.ts` handler at line 197 then does:
```ts
...(body.scalp.sebumProduction != null ? { sebumProduction: Number(body.scalp.sebumProduction) } : {})
```
This converts it to a number. However, the ENUM_MAP normalizer for `scalp.sebumProduction` in `route.ts` lines 43–45 uses **string** keys:
```ts
map: { "1": 55, "2": 90, "3": 55, "4": 25 },
```
But the `normalizeField` function (`packages/engine/src/normalizer.ts` line 9) requires `typeof value !== "string"` for the ENUM_MAP guard — it passes straight through to the `map[value]` lookup. After `route.ts` converts `sebumProduction` to a number, the lookup `map[2]` will always miss (keys are strings `"1"` through `"4"`), returning the default score of `50` for all sebum values. This silently produces incorrect scores.

**Impact:** Sebum production score is always `50` regardless of actual input — completely wrong scoring for a 20%-weighted scalp field.

**Suggested fix:**
Either keep the value as a string by **removing** the `Number()` coercion at `route.ts` line 197, OR change the ENUM_MAP to use numeric keys and the `RANGE_SCALE` normalizer type. The cleanest solution is to add `{ valueAsNumber: true }` in the form registration AND change the normalizer to `RANGE_SCALE`:
```typescript
// step3-scalp.tsx line 49
<input {...register("sebumProduction", { valueAsNumber: true })} type="range" min={1} max={4} step={1} ... />
// route.ts normalizer: change to RANGE_SCALE
{ fieldPath: "scalp.sebumProduction", type: "RANGE_SCALE", inputMin: 1, inputMax: 4, outputMin: 25, outputMax: 90 }
```

---

### CRIT-03 — Tenant isolation gap in `getClientFullProfile` — sub-profile tables not filtered by `tenantId`

**File:** `apps/api/src/services/client.service.ts`, lines 47–69

**Description:**
`getClientById` correctly filters by both `tenantId` AND `clientId`. However, `getClientFullProfile` performs the initial client lookup with `tenantId`, but then queries the four sub-profile tables (`hairProfiles`, `scalpProfiles`, `bodyProfiles`, `morphologyProfiles`) using **only** `clientId` — no `tenantId` filter:
```typescript
const [hair] = await db.select().from(hairProfiles)
  .where(and(eq(hairProfiles.clientId, clientId), eq(hairProfiles.isCurrent, true)))
  .limit(1);
```
If `hairProfiles` (and the other profile tables) carry a `tenantId` column (as stated in the architecture — "every DB table has `tenantId`"), this is a tenant isolation gap. Profile records for client IDs belonging to other tenants could be served if a UUID collision or cross-tenant manipulation is possible.

**Impact:** Potential cross-tenant data leakage of hair/scalp/body/morphology profiles.

**Suggested fix:**
```typescript
const [hair] = await db.select().from(hairProfiles)
  .where(and(
    eq(hairProfiles.tenantId, tenantId),
    eq(hairProfiles.clientId, clientId),
    eq(hairProfiles.isCurrent, true)
  ))
  .limit(1);
// Repeat for scalpProfiles, bodyProfiles, morphologyProfiles
```

---

### CRIT-04 — `clientId` UUID not validated in `protocolRoutes` — missing UUID guard on `:clientId`

**File:** `apps/api/src/routes/protocols.ts`, lines 40–71

**Description:**
The `clientRoutes` at `apps/api/src/routes/clients.ts` lines 59 and 75 correctly validates `:id` against `UUID_REGEX` before querying. However, the `protocolRoutes` at `apps/api/src/routes/protocols.ts` performs no UUID validation on `:clientId` before passing it directly to `listProtocolsForClient` (line 44) and `generateProtocol` (line 62). A malformed `:clientId` (e.g., SQL-injection-style string, or excessively long string) will be passed directly to Drizzle/PostgreSQL, potentially causing unexpected errors or, in edge cases, injection-adjacent behavior.

**Impact:** Missing input validation; potential for unexpected DB errors or parameter injection.

**Suggested fix:**
```typescript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

app.get("/clients/:clientId/protocols", async (req, reply) => {
  const { clientId } = req.params as { clientId: string };
  if (!UUID_REGEX.test(clientId)) {
    return reply.status(400).send({ error: { code: "INVALID_ID", message: "Client ID must be a valid UUID", status: 400 } });
  }
  // ...
});
```

---

### CRIT-05 — `default-rules.ts` rule-003 uses uppercase `"SEBORRHEIC"` but form submits lowercase `"seborrheic"` — red flag never fires via rules

**File:** `packages/engine/src/default-rules.ts`, line 53

**Description:**
Rule `rule-003` checks:
```typescript
{ type: "LEAF", field: "scalp.biotype", operator: "EQUALS", value: "SEBORRHEIC" }
```
However, the form at `step3-scalp.tsx` submits `b.toLowerCase()` — i.e., `"seborrheic"` (lowercase). The `EQUALS` operator in `rule-evaluator.ts` line 35 uses strict equality (`===`), so `"seborrheic" === "SEBORRHEIC"` is `false`. This rule **never** fires.

Similarly, rule `rule-004` checks `hair.porosity === "HIGH"` (uppercase), but the form submits `"high"` (lowercase). This rule also never fires.

**Impact:** Seborrheic + elevated pH warning is silently suppressed. High-porosity score adjustment never applies. Clinical safety rule is bypassed.

**Suggested fix:**
```typescript
// default-rules.ts rule-003, line 53
{ type: "LEAF", field: "scalp.biotype", operator: "EQUALS", value: "seborrheic" }

// default-rules.ts rule-004, line 73
{ type: "LEAF", field: "hair.porosity", operator: "EQUALS", value: "high" }
```

---

### CRIT-06 — `evaluate` function call in `protocol.service.ts` passes raw `EvaluationInput` but `GenerateProtocolSchema` omits required fields (`rules`, `weights`, `normalizers`, `redFlagRules`)

**File:** `apps/api/src/services/protocol.service.ts`, line 33
**File:** `apps/api/src/routes/protocols.ts`, line 5

**Description:**
`GenerateProtocolSchema` in `protocols.ts` accepts a partial profile object (`hair`, `scalp`, `body`, `morphology`). This is cast as `any` and passed directly to `evaluate()` at `protocol.service.ts` line 33:
```typescript
const result = await evaluate(input);
```
The `EvaluationInput` type requires `profile`, `rules`, `weights`, `normalizers`, and `redFlagRules`. None of these are provided by the incoming request body. Without `rules`, `weights`, `normalizers`, and `redFlagRules`, the engine will either crash or produce meaningless results (it defaults to empty arrays in `index.ts` line 13, but `weights` is NOT optional in the type — `weights.modules` will be `undefined`, causing `computeCompositeScore` to divide by zero or throw).

**Impact:** Protocol generation via the Fastify API (`POST /clients/:id/protocols/generate`) is broken — it will crash or return corrupted scores. Protocols saved to the database will have incorrect objectives.

**Suggested fix:**
```typescript
// protocol.service.ts — import and apply defaults
import { DEFAULT_RULES, DEFAULT_WEIGHTS } from "@haircode/engine";
import { DEFAULT_NORMALIZERS, DEFAULT_RED_FLAG_RULES } from "./evaluation-defaults.js"; // define these

const result = await evaluate({
  profile: {
    clientId,
    hair: input.hair,
    scalp: input.scalp,
    body: input.body,
    morphology: input.morphology,
  },
  rules: DEFAULT_RULES,
  weights: DEFAULT_WEIGHTS,
  normalizers: DEFAULT_NORMALIZERS,
  redFlagRules: DEFAULT_RED_FLAG_RULES,
});
```

---

### CRIT-07 — Login form does not send `tenantSlug` — auth will always return 422

**File:** `apps/web/src/components/auth/login-form.tsx`, lines 9–13 and 31

**Description:**
The login form's Zod schema only includes `email` and `password`:
```typescript
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
```
The `POST /auth/login` Fastify route (`apps/api/src/routes/auth.ts` line 5–9) requires `tenantSlug: z.string().min(1)` and returns `422` if it is missing. There is no `tenantSlug` field in the login form, no hidden input, and no derivation from URL path or subdomain. Every login attempt will therefore return `422 VALIDATION_ERROR` — the login page is completely broken.

**Impact:** No user can log in via the web application. Complete authentication failure.

**Suggested fix:**
Add a `tenantSlug` field to the login schema and form:
```typescript
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  tenantSlug: z.string().min(1, "Salon identifier required"),
});
```
Or derive it from the subdomain/URL and include it as a hidden field or as part of the request body programmatically.

---

## HIGH Issues

---

### HIGH-01 — `step2-hair.tsx` density range input missing `{ valueAsNumber: true }` — string passed to `RANGE_SCALE` normalizer, always returns default 50

**File:** `apps/web/src/components/consultation/steps/step2-hair.tsx`, line 57

**Description:**
The density slider:
```tsx
<input {...register("density")} type="range" min={1} max={5} step={1} ... />
```
Lacks `{ valueAsNumber: true }`. RHF returns a string. The `route.ts` handler at line 188 does:
```typescript
density: Number(body.hair.density ?? 3)
```
This correctly converts it to a number for the evaluate call. However, if `body.hair.density` is `undefined` (field not submitted — possible if user skips), it defaults to `3` rather than applying the default from the normalizer's range. This is acceptable but inconsistently handled vs. other fields that use `valueAsNumber: true` in the form itself (e.g., `damageIndex` at line 104 correctly uses `{ valueAsNumber: true }`).

**Impact:** Inconsistent handling. The route workaround is functional, but if route.ts is ever removed or the API is called directly, the field will be incorrect.

**Suggested fix:**
```tsx
// step2-hair.tsx line 57
<input {...register("density", { valueAsNumber: true })} type="range" min={1} max={5} step={1} ... />
```

---

### HIGH-02 — `rule-evaluator.ts` sorts rules by ascending priority — lower numbers fire first, contradicting intended behavior

**File:** `packages/engine/src/rule-evaluator.ts`, line 88

**Description:**
Rules are sorted:
```typescript
.sort((a, b) => a.priority - b.priority);
```
This sorts in **ascending** order (lowest number first). In `default-rules.ts`, rules are defined with priority values `100, 90, 80, 70, 60, 75` — higher numbers clearly indicate higher priority. However with ascending sort, rule-005 (priority 60, "Boost score for excellent body health") fires **before** rule-001 (priority 100, "Block on open lesions"). This means low-priority score boosts can be applied before a BLOCK action halts processing.

While `BLOCK_PROTOCOL` does short-circuit the loop, the actions array will already contain the low-priority actions at the point of early return, meaning they will be returned alongside the BLOCK action.

**Impact:** Logic inversion — high-priority rules including clinical safety rules fire last instead of first. Score boosts and phase overrides from low-priority rules may be incorrectly applied before the block is encountered.

**Suggested fix:**
```typescript
// rule-evaluator.ts line 88 — sort descending (higher priority first)
.sort((a, b) => b.priority - a.priority);
```

---

### HIGH-03 — `red-flag.ts` uses `Math.max` for penalty accumulation — multiple simultaneous red flags only apply the largest single penalty, not additive penalties

**File:** `packages/engine/src/red-flag.ts`, lines 26 and 45

**Description:**
```typescript
totalPenalty = Math.max(totalPenalty, flag.penaltyFactor);
```
If both `RF_SCALP_006` (25% penalty) and `RF_HAIR_001` (30% penalty) are triggered simultaneously, the total penalty is `0.30`, not `0.55`. The intent described in `CLAUDE.md` and the route comments implies additive penalties, but the implementation uses maximum-only logic. For a client with both severe damage and seborrheic scalp with high pH, only the single worst penalty applies — scores are less aggressively penalized than the clinical situation warrants.

**Impact:** Incorrect score adjustment for multi-flag clients. May result in assignment to a less intensive treatment phase than clinically indicated.

**Suggested fix:**
```typescript
// red-flag.ts — use additive capped at 1.0
totalPenalty = Math.min(1.0, totalPenalty + flag.penaltyFactor);
```

---

### HIGH-04 — `step6-protocol.tsx` "Save to Client File" button navigates to dashboard without actually saving

**File:** `apps/web/src/components/consultation/steps/step6-protocol.tsx`, line 213

**Description:**
```typescript
onClick={() => (window.location.href = "/dashboard")}
```
The "Save to Client File" button only redirects to `/dashboard`. It does not call `POST /clients/:id/protocols/generate` or any other API endpoint to persist the protocol. The generated protocol result displayed on screen is never saved to the database. Users may believe they have saved the protocol, then navigate away — data is lost.

**Impact:** Silent data loss — protocols generated through the consultation wizard are never persisted. The button label "Save to Client File" is actively misleading.

**Suggested fix:**
Before navigating, POST to the Fastify API or call the evaluate endpoint with a `clientId` to persist the result:
```typescript
const handleSave = async () => {
  if (!protocol || !data.clientId) return;
  await api.post(`/clients/${data.clientId}/protocols/generate`, {
    hair: data.hair, scalp: data.scalp, body: data.body, morphology: data.morphology,
  });
  window.location.href = "/dashboard";
};
```

---

### HIGH-05 — `settings/page.tsx` saves GDPR settings to `localStorage` — sensitive settings silently not persisted to backend

**File:** `apps/web/src/app/(dashboard)/settings/page.tsx`, lines 93–101

**Description:**
```typescript
localStorage.setItem("hc_settings", JSON.stringify({ ... gdpr: { clientRetention, auditRetention } ... }));
```
GDPR data retention settings (client data retention years, audit log retention years) are stored only in `localStorage` with no API call. These settings have no effect on actual database retention policies. A user changing these settings will see them persist across sessions on the same browser but they are completely ignored by the backend. More critically, on different browsers or after clearing storage, the settings revert silently. The account email change and password change fields also perform no API call.

**Impact:** GDPR retention settings are decorative — no backend enforcement. Email/password changes are also not persisted.

**Suggested fix:** Wire `handleSave` to call the appropriate API endpoints:
```typescript
const handleSave = async () => {
  if (activeTab === "salon") {
    await api.patch("/settings/salon", { salonName, slug, country, timezone });
  } else if (activeTab === "account") {
    if (newPassword && newPassword !== confirmPassword) { ... }
    await api.patch("/settings/account", { email, currentPassword, newPassword });
  }
  // etc.
};
```

---

### HIGH-06 — `evaluate` route hardcodes `symmetryScore: 65` regardless of submitted morphology data

**File:** `apps/web/src/app/api/evaluate/route.ts`, line 207

**Description:**
```typescript
const morphologyProfile: Record<string, unknown> | undefined = body.morphology
  ? { ...body.morphology, symmetryScore: 65 }
  : undefined;
```
Even though the engine normalizer for `morphology.symmetryScore` exists and uses `RANGE_SCALE`, the route always overwrites this field with `65`. Any value submitted in `body.morphology.symmetryScore` is silently discarded. The `symmetryScore` carries a 40% field weight in the morphology module, meaning the morphology score is always partially derived from a hardcoded value rather than actual client data.

**Impact:** Morphology scores are always partially incorrect. Clinical evaluation based on facial symmetry is always skewed toward `65` regardless of actual assessment.

**Suggested fix:** Remove the hardcoded override and use the submitted value:
```typescript
const morphologyProfile: Record<string, unknown> | undefined = body.morphology
  ? { ...body.morphology }
  : undefined;
```

---

### HIGH-07 — `topbar.tsx` uses hardcoded mock notifications — no real notification fetching

**File:** `apps/web/src/components/layout/topbar.tsx`, lines 8–33

**Description:**
```typescript
const MOCK_NOTIFICATIONS = [
  { id: "1", type: "red_flag", title: "Red flag detected", body: "Sophie Laurent — RF_SCALP_006 triggered", ... },
  ...
];
```
The topbar always shows hardcoded mock data for a specific client ("Sophie Laurent") across all tenants and users. This is a real-name fictional client displayed to every user of the system regardless of their actual notifications. In a B2B SaaS with multiple salon tenants, Tenant B will see a notification about "Sophie Laurent" from Tenant A (or the demo tenant). This is both a data confusion issue and a potential tenant isolation perception problem.

**Impact:** Wrong data shown to every user; tenant isolation perception breach; potential confusion in clinical context.

**Suggested fix:** Replace with a `useEffect` to fetch real notifications from the API:
```typescript
const [notifications, setNotifications] = useState<Notification[]>([]);
useEffect(() => {
  api.get<{ data: Notification[] }>("/notifications").then((r) => setNotifications(r.data));
}, []);
```

---

### HIGH-08 — `topbar.tsx` and `sidebar.tsx` both implement `handleLogout`/`handleSignOut` with `localStorage.removeItem` only — no server-side token invalidation

**File:** `apps/web/src/components/layout/topbar.tsx`, line 65
**File:** `apps/web/src/components/layout/sidebar.tsx`, line 21

**Description:**
Both components clear only the client-side token:
```typescript
const handleLogout = () => {
  localStorage.removeItem("hc_token");
  router.push("/login");
};
```
There is no call to `POST /auth/logout` (which exists on the Fastify API). While the current access token is 15-minute short-lived, no refresh token cookie is cleared, no server-side session is invalidated, and the logout endpoint (`auth.ts` line 40–43, which calls `reply.clearCookie("hc_refresh")`) is never invoked from the client. Additionally, there are two separate logout implementations that could diverge.

**Impact:** Incomplete logout — refresh cookie persists; potential session hijacking risk; duplicated code that may diverge.

**Suggested fix:** Deduplicate into a shared `useLogout` hook that calls the API:
```typescript
// lib/use-logout.ts
export function useLogout() {
  const router = useRouter();
  return async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    localStorage.removeItem("hc_token");
    router.push("/login");
  };
}
```

---

### HIGH-09 — `step1-profile.tsx` consent field uses `z.boolean().refine()` instead of `z.literal(true)` — GDPR consent validation is weaker than required

**File:** `apps/web/src/components/consultation/steps/step1-profile.tsx`, line 13

**Description:**
```typescript
consentDataProcessing: z.boolean().refine((v) => v === true, "Consent required"),
```
The project rules (CLAUDE.md) explicitly state: "`gdprConsentGiven` must be `z.literal(true)`". Using `z.boolean().refine()` is functionally similar for runtime validation but has meaningful type-system differences — `z.infer<typeof schema>` will type `consentDataProcessing` as `boolean` rather than `true`. Additionally, this field is mapped in `onSubmit` (line 31) but `consentDataProcessing` is **not passed** to `onUpdate`. The wizard's `ConsultationData` state never receives the consent flag, and it is therefore never sent to the API or stored in the client record.

**Impact:** GDPR consent captured in form validation but silently dropped — never propagated to the data model or API. Also violates the `z.literal(true)` project rule.

**Suggested fix:**
```typescript
// step1-profile.tsx line 13
consentDataProcessing: z.literal(true, { errorMap: () => ({ message: "Consent required" }) }),

// step1-profile.tsx onSubmit — include consent in update
onUpdate({
  firstName: values.firstName,
  lastName: values.lastName,
  consentDataProcessing: values.consentDataProcessing,
});
```
And add `consentDataProcessing?: true` to `ConsultationData` type in `wizard.tsx`.

---

## MEDIUM Issues

---

### MED-01 — `verifyCredentials` in `auth.service.ts` does not check `user.isActive` or `tenantUser.isActive`

**File:** `apps/api/src/services/auth.service.ts`, lines 23–45

**Description:**
The `users` table has an `isActive` boolean column, and `tenantUsers` also has `isActive`. Neither is checked during credential verification:
```typescript
const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
if (!user?.passwordHash) return null;
```
A deactivated user (e.g., terminated employee) with a known password can still log in and receive a valid JWT. The same applies to a tenant membership that has been revoked.

**Suggested fix:**
```typescript
if (!user?.passwordHash || !user.isActive) return null;
// ...
if (!membership || !membership.isActive) return null;
```

---

### MED-02 — `verifyCredentials` does not check `user.lockedUntil` — account lockout not enforced at login

**File:** `apps/api/src/services/auth.service.ts`, lines 23–31

**Description:**
The `users` table has `failedLoginAttempts` and `lockedUntil` columns, but `verifyCredentials` never checks them. A user account can be locked (via `lockedUntil` set to a future timestamp) but the lock is never evaluated — the user can still authenticate. Similarly, failed login attempts are not incremented.

**Suggested fix:**
```typescript
if (user.lockedUntil && user.lockedUntil > new Date()) return null; // account locked
// After failed bcrypt comparison, increment failedLoginAttempts and set lockedUntil if threshold exceeded
```

---

### MED-03 — `engine/src/index.ts` blocked result returns empty `protocol.frequency` with `interval: 0` — consumers may divide by zero or display "Every 0 weeks"

**File:** `packages/engine/src/index.ts`, line 33

**Description:**
When a BLOCK is triggered:
```typescript
protocol: { phases: [], services: [], checkpoints: [], frequency: { interval: 0, unit: "weeks" } },
```
`interval: 0` is an invalid frequency. In `step6-protocol.tsx` line 102–104:
```typescript
const freq = protocol.frequency
  ? `Every ${protocol.frequency.interval} ${protocol.frequency.unit}`
  : "Every 14 days";
```
When blocked, the `protocol.frequency` object exists (truthy), so the fallback is never used. The UI will display "Every 0 weeks" which is clinically meaningless and confusing.

**Suggested fix:**
```typescript
// index.ts — use null instead of interval: 0 to trigger fallback
protocol: { phases: [], services: [], checkpoints: [], frequency: null },

// step6-protocol.tsx — handle null:
const freq = protocol.frequency?.interval
  ? `Every ${protocol.frequency.interval} ${protocol.frequency.unit}`
  : "N/A — Services blocked";
```

---

### MED-04 — `DEFAULT_WEIGHTS` scalp fields include `sensitivityLevel` key mismatch with normalizer `fieldPath`

**File:** `packages/engine/src/weights.ts`, line 22
**File:** `apps/web/src/app/api/evaluate/route.ts`, line 47

**Description:**
`DEFAULT_WEIGHTS.fields.scalp` contains key `"sensitivity"`:
```typescript
scalp: { biotype: 0.15, sebumProduction: 0.20, sensitivity: 0.15, phLevel: 0.20, microbiomeBalance: 0.30 }
```
But the normalizer in `route.ts` uses `fieldPath: "scalp.sensitivityLevel"`. The scorer in `scorer.ts` uses `fieldWeights[fieldName]` where `fieldName` is derived from the normalizer's `fieldPath` (splitting after the first dot). So `fieldName` becomes `"sensitivityLevel"`, but the weight lookup is `fieldWeights["sensitivityLevel"]` which will be `undefined` (key is `"sensitivity"`), falling back to weight `1`. The sensitivity field will be weighted at `1` instead of `0.15`.

Additionally, `DEFAULT_WEIGHTS.fields.scalp` includes `microbiomeBalance: 0.30` but there is no corresponding normalizer for this field — it simply never contributes to the score, making the total scalp field weights effectively `0.70` before normalization.

**Suggested fix:**
```typescript
// weights.ts — align key with normalizer fieldPath
scalp: { biotype: 0.15, sebumProduction: 0.20, sensitivityLevel: 0.15, phLevel: 0.20, microbiomeBalance: 0.30 }
```

---

### MED-05 — `DEFAULT_WEIGHTS` body fields do not match consultation form fields — scoring uses phantom fields

**File:** `packages/engine/src/weights.ts`, lines 25–30

**Description:**
`DEFAULT_WEIGHTS.fields.body` contains:
```typescript
body: { hormonalIndex: 0.25, nutritionalScore: 0.30, stressIndex: 0.25, hydrationPct: 0.20 }
```
The consultation form (`step4-body.tsx`) collects: `sleepQualityScore`, `stressIndex`, `activityLevel`, `dietType`, `hormonalEvents`. None of `hormonalIndex`, `nutritionalScore`, or `hydrationPct` are collected by the form. The normalizers defined in `route.ts` cover `sleepQualityScore`, `stressIndex`, `activityLevel`, `dietType` — but the weights only recognize `hormonalIndex`, `nutritionalScore`, `stressIndex`, `hydrationPct`. This means `sleepQualityScore`, `activityLevel`, and `dietType` all default to weight `1` (since their weight keys are absent), while `hormonalIndex`, `nutritionalScore`, and `hydrationPct` have defined weights but no corresponding normalizer — they are ghost fields.

**Impact:** Body module scoring is based on unconfigured weights for the actual fields collected, and weighted fields that are never populated.

**Suggested fix:** Align `DEFAULT_WEIGHTS.fields.body` with the actual normalizer field paths:
```typescript
body: { sleepQualityScore: 0.25, stressIndex: 0.25, activityLevel: 0.20, dietType: 0.15, hormonalEvents: 0.15 }
```

---

### MED-06 — `step1-profile.tsx` `onSubmit` does not pass `dateOfBirth` or `genderIdentity` to `onUpdate`

**File:** `apps/web/src/components/consultation/steps/step1-profile.tsx`, lines 30–33

**Description:**
```typescript
const onSubmit: SubmitHandler<FormData> = (values) => {
  onUpdate({ firstName: values.firstName, lastName: values.lastName });
  onNext();
};
```
`dateOfBirth` and `genderIdentity` are registered in the schema, shown in the form, and collected by RHF — but never passed to `onUpdate`. They are silently dropped. These fields are never available in `ConsultationData` for later steps or API submission.

**Suggested fix:**
```typescript
onUpdate({
  firstName: values.firstName,
  lastName: values.lastName,
  dateOfBirth: values.dateOfBirth,
  genderIdentity: values.genderIdentity,
});
```
Also add these fields to the `ConsultationData` type in `wizard.tsx`.

---

### MED-07 — `topbar.tsx` hardcodes user identity ("SL" avatar, "Salon Lumière", "admin@salon-lumiere.fr")

**File:** `apps/web/src/components/layout/topbar.tsx`, lines 128–136

**Description:**
The user dropdown always shows:
```tsx
<span className="text-xs font-medium text-white">SL</span>
// ...
<p className="text-sm font-medium text-gray-900">Salon Lumière</p>
<p className="text-xs text-gray-500">admin@salon-lumiere.fr</p>
```
These are hardcoded strings not derived from the JWT or any auth context. Every user on every tenant will see "Salon Lumière" and "admin@salon-lumiere.fr" as their identity. This is a regression risk — if this ships as-is, users from other tenants see another salon's branding.

**Suggested fix:** Read tenant/user identity from JWT claims or a `useSession` context.

---

### MED-08 — `evaluate` route ignores auth/no request validation — any JSON body shape is accepted without schema validation

**File:** `apps/web/src/app/api/evaluate/route.ts`, lines 172–177

**Description:**
The route casts the body to a permissive type with no Zod validation:
```typescript
const body = await req.json() as {
  hair?: Record<string, unknown>;
  scalp?: Record<string, unknown>;
  body?: Record<string, unknown>;
  morphology?: Record<string, unknown>;
};
```
A malformed or adversarial payload (e.g., extremely large arrays, deeply nested objects, non-JSON content type) is passed directly to the engine. There is no size limit, no structure validation, and no content-type check. Combined with CRIT-01 (no auth), this is an unprotected compute endpoint.

**Suggested fix:** Add Zod input validation before processing:
```typescript
const bodySchema = z.object({
  hair: z.record(z.unknown()).optional(),
  scalp: z.record(z.unknown()).optional(),
  body: z.record(z.unknown()).optional(),
  morphology: z.record(z.unknown()).optional(),
});
const parsed = bodySchema.safeParse(await req.json());
if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });
```

---

## LOW Issues

---

### LOW-01 — `sidebar.tsx` active route matching is over-broad — `/settings` matches `/settings/anything`

**File:** `apps/web/src/components/layout/sidebar.tsx`, line 32

**Description:**
```typescript
const active = pathname.startsWith(item.href);
```
Using `startsWith` means the `/dashboard` nav item will be highlighted for any path starting with `/dashboard`, e.g., `/dashboard-old` (hypothetical). More relevantly, `/settings` will be highlighted for `/settings/notifications` sub-pages. This is minor but can cause visual confusion.

**Suggested fix:** Use exact match or trailing-slash aware match:
```typescript
const active = pathname === item.href || pathname.startsWith(item.href + "/");
```

---

### LOW-02 — `wizard.tsx` "Save Draft" button is non-functional

**File:** `apps/web/src/components/consultation/wizard.tsx`, line 51

**Description:**
```tsx
<button className="text-sm text-brand font-medium">Save Draft</button>
```
No `onClick` handler is attached. This button does nothing and will mislead users into thinking their draft has been saved.

**Suggested fix:** Either implement draft saving (POST to a drafts endpoint) or remove/disable the button until implemented, with a tooltip explaining it is coming soon.

---

### LOW-03 — `settings/page.tsx` timezone display replaces only first underscore in timezone strings

**File:** `apps/web/src/app/(dashboard)/settings/page.tsx`, line 171

**Description:**
```tsx
{tz.replace("_", " ")}
```
`String.prototype.replace` with a string argument replaces only the **first** occurrence. `"America/New_York"` becomes `"America/New York"` (correct), but a hypothetical zone like `"America/Indiana/Knox"` would be fine, however `"Pacific/Port_Moresby"` correctly becomes `"Pacific/Port Moresby"`. The real risk is `"America/Indiana_Knox"` style strings. Use `replaceAll` to be safe.

**Suggested fix:**
```tsx
{tz.replaceAll("_", " ")}
```

---

### LOW-04 — `step2-hair.tsx` `chemicalHistory` checkbox value for "Bleach / Lightening" will not match `conditionalServices` check

**File:** `apps/web/src/components/consultation/steps/step2-hair.tsx`, line 94
**File:** `apps/web/src/app/api/evaluate/route.ts`, line 163

**Description:**
The checkbox value is generated as:
```typescript
value={item.toLowerCase().replace(/[^a-z]+/g, "_")}
```
For `"Bleach / Lightening"` this produces `"bleach__lightening"` (double underscore from `" / "`). The `conditionalServices` check at `route.ts` line 163 is:
```typescript
h.includes("bleach") || h.includes("lightening")
```
This uses `includes` on the string value, so `"bleach__lightening".includes("bleach")` is `true` — it works. However it is fragile. The generated slug `"bleach__lightening"` is ugly and could cause confusion if stored.

**Suggested fix:** Either use explicit `value` attributes instead of computed slugs, or clean up the regex: `replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")`.

---

### LOW-05 — `engines/src/index.ts` `EvaluationTrace.ruleDetails` hardcodes `conditionResult: true` for all fired rules

**File:** `packages/engine/src/index.ts`, lines 90–95

**Description:**
```typescript
ruleDetails: ruleResult.triggeredRuleIds.map((id) => ({
  ruleId: id,
  fired: true,
  conditionResult: true,
})),
```
`conditionResult` is always `true` because the array only contains IDs of rules that fired. The trace is technically correct but redundant — any future debugging use case expecting `conditionResult: false` entries for non-fired rules will not find them. The trace also does not include `rulesEvaluated` count for rules that were checked but did not fire.

**Suggested fix:** Capture both fired and non-fired rules in trace output to enable proper debugging.

---

### LOW-06 — `auth.ts` refresh endpoint returns `501` but is listed in `PUBLIC_ROUTES` — inconsistent status

**File:** `apps/api/src/routes/auth.ts`, lines 35–38
**File:** `apps/api/src/plugins/tenant.ts`, line 3

**Description:**
`/auth/refresh` is in `PUBLIC_ROUTES` (correctly not requiring auth), and the handler immediately returns `501 NOT_IMPLEMENTED`. This is acceptable as a placeholder but should be tracked. More importantly, `JWT_REFRESH_SECRET` is defined in `config.ts` (line 9) and the JWT plugin is configured with a cookie (line 28–29 in `app.ts`) but refresh token logic is entirely absent — the refresh cookie is cleared on logout (`auth.ts` line 42) but never set during login. The refresh infrastructure is partially built with no complete path.

**Suggested fix:** Either remove `JWT_REFRESH_SECRET` and the cookie configuration until refresh is implemented, or implement the full refresh flow to match the existing infrastructure.

---

## Cross-Cutting Observations

### Architecture Gap — Consultation wizard has no client record creation step

The consultation wizard (`wizard.tsx`) collects `firstName` and `lastName` (Step 1) and generates a protocol (Step 6), but there is no step that creates a client record via `POST /clients`. The `ConsultationData.clientId` field is always `undefined` throughout the wizard. When Step 6 attempts to "Save to Client File" (which currently only navigates anyway — see HIGH-04), there is no `clientId` to post against. The entire consultation workflow is disconnected from the client management system.

### Architecture Gap — `scalp.conditions` checkbox handling is not normalized consistently

CLAUDE.md documents that `scalp.conditions` from RHF can be `undefined | string | string[]`. The `route.ts` handles this correctly at lines 181–185. However, only the Next.js route performs this normalization. The Fastify `GenerateProtocolSchema` at `protocols.ts` line 19 validates `conditions` as `z.array(z.string())` — if the API is called with a single string (as RHF might send), the schema will reject it with a 422 error.

### Security Observation — Access token stored in `localStorage`

`localStorage.setItem("hc_token", accessToken)` in `login-form.tsx` line 41 stores the JWT in localStorage, making it accessible to any JavaScript running on the page (XSS attack surface). The server-side infrastructure already supports `httpOnly` cookies via `@fastify/cookie`. Consider using `httpOnly` cookie for the access token as well as the refresh token to reduce XSS exposure.

---

*End of findings report. Total findings: 30 (7 CRITICAL, 9 HIGH, 8 MEDIUM, 6 LOW).*
