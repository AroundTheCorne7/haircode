---
name: deploy-check
description: Check that Render API, Vercel web, and Supabase DB are all live and in sync with the latest commit.
triggers:
  - "/deploy-check"
  - "check deployment"
  - "is everything deployed"
  - "deployment status"
---

# HairCode Deploy Check Skill

Run all checks and print a status report. Use parallel Bash calls where possible.

## Check 1 — Git sync
```bash
git log --oneline -3
git status --short
```
Report: is working tree clean? Is master ahead of origin?

## Check 2 — Render API health
```bash
curl -s -o /dev/null -w "%{http_code}" https://haircode-api.onrender.com/health --max-time 15
```
- 200 → ✅ Render API is live
- 503 / timeout → ❌ Render may be spinning up (free tier sleeps) or deployment failed
- If sleeping, hit it once more after 30s: Render free tier takes ~30s cold start

Also check the full response:
```bash
curl -s https://haircode-api.onrender.com/health --max-time 15
```

## Check 3 — Vercel web
```bash
curl -s -o /dev/null -w "%{http_code}" https://haircode.vercel.app --max-time 15
```
- 200 → ✅ Vercel web is live
- Non-200 → ❌ check Vercel dashboard

## Check 4 — Supabase migration status
List local migration files:
```bash
ls packages/db/migrations/*.sql
```
Compare against the last commit that touched `packages/db/migrations/` to confirm migrations are applied.

## Check 5 — Latest commit on remote
```bash
git log origin/master --oneline -1
```
Confirm the commit SHA matches what GitHub shows — if it diverges, a push may have failed.

## Report Format
Print a clean status table:

```
DEPLOY STATUS — [timestamp]
─────────────────────────────────────
Git          [✅ clean / ⚠️ N uncommitted files]
Remote sync  [✅ up to date / ❌ N commits behind]
Render API   [✅ live (200) / ❌ down / ⏳ cold start]
Vercel web   [✅ live (200) / ❌ down]
Migrations   [✅ N applied / ⚠️ check manually]
─────────────────────────────────────
```

Flag any issues with a recommended action.
