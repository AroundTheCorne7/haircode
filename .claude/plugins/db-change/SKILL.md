---
name: db-change
description: Guided workflow for making HairCode database schema changes — edit schema, generate migration, apply to Supabase, update engine types.
triggers:
  - "/db-change"
  - "add a column"
  - "add a table"
  - "change the schema"
  - "create a migration"
  - "db migration"
---

# HairCode DB Change Skill

Follow these steps in order. Never skip a step.

## Step 1 — Clarify the change
If the user hasn't described the change fully, ask:
- Which table(s) are affected?
- What columns are being added/modified/removed?
- Any foreign keys or constraints?

## Step 2 — Edit the schema file
Schema files live in `packages/db/src/schema/`.
- Read the relevant file(s) first
- Make the change using Drizzle column types
- If creating a new table, also export it from `packages/db/src/schema/index.ts`
- Follow existing patterns: uuid PK, tenantId FK, timestamps (createdAt/updatedAt)

## Step 3 — Generate the migration
```bash
pnpm --filter @haircode/db db:generate
```
This uses `node --require tsx/cjs bin.cjs generate` under the hood (ESM/CJS workaround).
Read the generated SQL file in `packages/db/migrations/` and show it to the user for confirmation before proceeding.

## Step 4 — Apply to Supabase
Only after the user confirms the SQL looks correct:
```bash
pnpm --filter @haircode/db db:migrate
```
If this fails with ECONNRESET or ENOTFOUND, the Supabase pooler host may be unreachable. Check network or try again.

## Step 5 — Update engine types (if needed)
If the schema change introduces new fields that the engine uses:
- Update `packages/engine/src/types.ts` — add to `ClientProfile` or relevant interfaces
- Update any affected rule files in `packages/engine/src/rules/`
- Rebuild: `pnpm --filter @haircode/engine build`

## Step 6 — Update API layer (if needed)
If new fields need to be read/written via the API:
- Update the relevant service in `apps/api/src/services/`
- Update Zod schemas / request validators in the route file

## Step 7 — Confirm
Run `pnpm --filter @haircode/web type-check && pnpm --filter @haircode/api type-check` to verify nothing broke.
