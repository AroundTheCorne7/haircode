# HairCode™ — Project Instructions

## What This Is
B2B SaaS for premium hair salons. 8-step consultation wizard → rule-based scoring engine → personalized treatment protocols + transformation blueprint.

## Monorepo Structure
```
apps/web          Next.js 15, App Router, React 19, PWA
apps/api          Fastify v5, JWT, Drizzle ORM
packages/engine   Rule-based decision engine (pure TS, no DB)
packages/db       Drizzle ORM schemas + migrations (Supabase)
packages/ui       Shared shadcn/ui components
```

## Key Commands
```bash
pnpm --filter @haircode/web dev
pnpm --filter @haircode/api dev
pnpm --filter @haircode/engine test
pnpm --filter @haircode/engine build    # required after engine/src/index.ts changes
pnpm --filter @haircode/web type-check
pnpm --filter @haircode/api type-check
pnpm --filter @haircode/db db:generate  # drizzle migration codegen
pnpm --filter @haircode/db db:migrate   # apply to Supabase
```

## Critical TypeScript Rules
- `exactOptionalPropertyTypes: true` everywhere — use `?? null` or `...(x != null ? { prop: x } : {})` for optional fields
- Engine is ESM — imports use `.js` extension in source
- After changing `engine/src/index.ts` → always rebuild engine before using from web/api

## Architecture
- **JWT**: `{ sub: userId, tenantId, roles[] }` — use `sub`, not `userId`
- **Multi-tenant**: every table has `tenantId`; middleware validates JWT → `req.user`
- **Evaluate flow**: web `/api/evaluate` (Next.js route) imports `@haircode/engine` directly
- **Protocol save**: Fastify `POST /clients/:id/protocols/generate` also calls engine
- **Normalizers**: range inputs are strings — ENUM_MAPs use string keys `"1"`, `"2"` etc.
- **DB migration**: uses `node --require tsx/cjs bin.cjs` to bypass drizzle-kit ESM/CJS conflict

## DB Schema Key Fields
- `clients`: `firstName`, `lastName`, `primaryEmail`, `primaryPhone`, `gdprConsentGiven`, `gdprConsentGivenAt`
- `users`: no `name` — use `email` + `passwordHash` + `role`
- `protocols`: `objective` stores phase+score summary; `createdBy` is userId (NOT NULL)
- `color_profiles`: `colorSeason`, `contrastScore` (smallint 1-5), `undertone`
- `archetype_profiles`: `primaryArchetype` NOT NULL, `primaryWeight`, optional secondary
- `transformation_blueprints`: JSONB columns for all design engine output

## Engine Pipeline
```
evaluate(input) →
  1-4. Score modules → composite → red flags → adjustedScore
  5.   evaluateRules → SET_PHASE / ADD_SERVICE / ADJUST_SCORE
  6.   assignPhase: ≤40=stabilization, 41-65=transformation, ≥66=integration
  7.   generatePhases → checkpoints + duration
  10.  runDesignEngine → TransformationBlueprintOutput (6-layer methodology)
        L1 face-morphology → L2 hair-structure → L3 body → L4 color → L5 archetype → L6 scalp
        cross-layer-resolver applies priority rules; conflicts recorded
```

## Consultation Wizard (8 steps)
- Steps 1-7 collect `ConsultationData` in `wizard.tsx` (incl. step3b color identity, step5b archetype)
- Step 8 POSTs to `/api/evaluate` → runs engine → returns scores + blueprint
- Route: `apps/web/src/app/api/evaluate/route.ts`

## Red Flag Codes
- `RF_SCALP_007` → BLOCK (open lesions)
- `RF_SCALP_006` → CRITICAL 25% penalty (seborrheic + pH > 6.0)
- `RF_HAIR_001` → CRITICAL 30% penalty (damage index ≥ 10)

## Common Gotchas
- Range inputs → always strings unless `{ valueAsNumber: true }`
- `scalp.conditions` from RHF can be `undefined | string | string[]`
- `scalp.openLesions` derived from `conditions.includes("open_lesions")`
- `DEFAULT_RULES` compare exact strings — `"HIGH"` ≠ `"high"`
- Phase banner: stabilization=amber, transformation=brand(#1A1A2E), integration=emerald

## Key File Paths
```
apps/web/src/components/consultation/steps/step*.tsx      wizard steps
apps/web/src/app/api/evaluate/route.ts                    evaluation endpoint
apps/api/src/routes/auth.ts | clients.ts | protocols.ts   API routes
apps/api/src/services/protocol.service.ts
packages/engine/src/index.ts                              pipeline orchestration
packages/engine/src/design-engine.ts                      6-layer design engine
packages/engine/src/cross-layer-resolver.ts               conflict resolution
packages/engine/src/rules/                                face/color/archetype/body rules
packages/engine/src/types.ts                              all engine types
packages/db/src/schema/                                   all DB schemas
```
