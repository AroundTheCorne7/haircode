# HairCode™ — Project Instructions

## What This Is
B2B SaaS decision engine for premium hair salons. A 6-step consultation wizard collects client data (hair, scalp, body, morphology) and runs it through a rule-based scoring engine to generate personalized treatment protocols.

## Monorepo Structure
```
apps/web          Next.js 15, App Router, React 19, PWA — frontend
apps/api          Fastify v5, JWT, Drizzle ORM — REST API
packages/engine   Rule-based decision engine (pure TypeScript, no DB)
packages/db       Drizzle ORM schemas + migrations for PostgreSQL/Supabase
packages/ui       Shared shadcn/ui components
```

## Key Commands
```bash
pnpm --filter @haircode/web dev          # Start web on :3000
pnpm --filter @haircode/api dev          # Start API on :3001
pnpm --filter @haircode/engine test      # Run 12 engine unit tests (vitest)
pnpm --filter @haircode/engine build     # Build engine (required after index.ts changes)
pnpm --filter @haircode/web type-check   # TypeScript check — web
pnpm --filter @haircode/api type-check   # TypeScript check — API
pnpm install                             # Install all workspace deps
```

## Critical TypeScript Rules
- `exactOptionalPropertyTypes: true` is ON everywhere — never pass `undefined` to optional DB fields, use `?? null` or spread with conditional
- Engine is ESM (`"type": "module"`) — imports must use `.js` extension in source
- After modifying `packages/engine/src/index.ts`, always run `pnpm --filter @haircode/engine build` before using from web/api

## Architecture Decisions
- **JWT payload**: `{ sub: userId, tenantId, roles[] }` — use `sub`, NOT `userId`
- **Multi-tenant**: every DB table has `tenantId`; tenant middleware validates JWT and sets `req.user`
- **Engine integration**: web app calls `/api/evaluate` (Next.js route) → imports `@haircode/engine` directly (no Fastify API needed for consultation flow)
- **Protocol generation**: Fastify API at `POST /clients/:id/protocols/generate` also calls engine (for saved protocols)
- **Normalizers**: form range inputs return strings — normalizer ENUM_MAPs use string keys like `"1"`, `"2"` etc.

## DB Schema Key Fields
- `clients`: `firstName`, `lastName`, `primaryEmail`, `primaryPhone`, `gdprConsentGiven`, `gdprConsentGivenAt`
- `users`: no `name` field — use `email` + `passwordHash` + `role`
- `protocols`: `objective` field stores phase+score summary; `createdBy` is userId (NOT NULL)

## Engine Pipeline
```
evaluate(input) →
  1. computeModuleScores(profile, normalizers, weights)  — normalise fields → 0-100 per module
  2. computeCompositeScore(moduleScores, weights.modules) — weighted average
  3. evaluateRedFlags(profile, redFlagRules)             — penalty factors + BLOCK
  4. adjustedScore = compositeScore × (1 - totalPenalty)
  5. evaluateRules(rules, ctx)                           — SET_PHASE / ADD_SERVICE / ADJUST_SCORE
  6. assignPhase(adjustedScore, flags): ≤40=stabilization, 41-65=transformation, ≥66=integration
  7. generatePhases(phase, score, flags)                 — checkpoints + duration
```

## Consultation Wizard Data Flow
- Steps 1-5 collect data into `ConsultationData` state in `wizard.tsx`
- Step 6 POSTs to `/api/evaluate` (Next.js route) with `{ hair, scalp, body, morphology }`
- Route at `apps/web/src/app/api/evaluate/route.ts` runs real engine, returns real scores

## Red Flag Codes
- `RF_SCALP_007` → BLOCK (open lesions — all services contraindicated)
- `RF_SCALP_006` → CRITICAL (seborrheic + pH > 6.0 — 25% penalty)
- `RF_HAIR_001` → CRITICAL (damage index ≥ 10 — 30% penalty)

## Security (All Fixed as of 2026-03-05)
- Login requires `tenantSlug` + calls `verifyCredentials()` (bcrypt)
- `gdprConsentGiven` is `z.literal(true)` — false is rejected
- Rate limit plugin registered; global error handler hides DB internals
- LIKE wildcards escaped in search params; UUID validation on `:id` params

## Common Gotchas
- Range inputs → always strings unless `{ valueAsNumber: true }` is set
- `scalp.conditions` from RHF can be `undefined | string | string[]` (0/1/multiple checkboxes)
- `scalp.openLesions` is derived from `conditions.includes("open_lesions")` at evaluation time
- Engine `DEFAULT_RULES` compare against exact string values — `"HIGH"` ≠ `"high"`
- Phase banner color: stabilization=amber, transformation=brand(#1A1A2E), integration=emerald

## File Paths — Most Edited
```
apps/web/src/app/(dashboard)/settings/page.tsx
apps/web/src/components/consultation/steps/step*.tsx
apps/web/src/components/layout/topbar.tsx
apps/web/src/app/api/evaluate/route.ts
apps/api/src/routes/auth.ts | clients.ts | protocols.ts
apps/api/src/services/protocol.service.ts
packages/engine/src/index.ts | normalizer.ts | red-flag.ts | default-rules.ts
packages/db/src/schema/
```
