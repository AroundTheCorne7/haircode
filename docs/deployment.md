# HairCode™ Beta Deployment Guide

## Stack
- **Web** → Vercel (Next.js 15)
- **API** → Railway (Fastify)
- **Database** → Supabase (PostgreSQL)

---

## Step 1 — Supabase (Database)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your **Connection String (URI)** from:
   `Project Settings → Database → Connection string → URI`
   It looks like: `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`

3. Run migrations locally against Supabase:
   ```bash
   # Set DATABASE_URL in apps/api/.env (copy from .env.example)
   cp apps/api/.env.example apps/api/.env
   # Edit apps/api/.env and set DATABASE_URL to your Supabase URI

   pnpm --filter @haircode/db db:migrate
   pnpm --filter @haircode/db db:seed
   ```
   This creates all tables and inserts a demo tenant + user.

4. **Enable RLS** in Supabase dashboard for each table:
   - Go to `Table Editor` → select table → `RLS` → Enable
   - Add policy: `tenantId = current_setting('app.tenant_id')::uuid`
   - Repeat for: `clients`, `hairProfiles`, `scalpProfiles`, `bodyProfiles`, `morphologyProfiles`, `protocols`, `users`, `tenants`, `tenantUsers`

---

## Step 2 — Railway (API)

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
2. Select your repo
3. Railway will detect `railway.toml` at the root and use it automatically

4. Add environment variables in Railway dashboard (`Variables` tab):
   ```
   NODE_ENV=production
   DATABASE_URL=<your Supabase URI>
   JWT_SECRET=<64-char random string>
   JWT_REFRESH_SECRET=<different 64-char random string>
   APP_URL=https://<your-vercel-app>.vercel.app   ← fill in after Vercel deploy
   API_URL=https://<your-railway-app>.up.railway.app
   PORT=3001
   ```

   Generate secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

5. Deploy — Railway runs:
   ```
   pnpm install
   pnpm --filter @haircode/engine build
   pnpm --filter @haircode/api build
   node apps/api/dist/index.js
   ```

6. Verify: `https://<your-app>.up.railway.app/health` → `{ "status": "ok" }`

---

## Step 3 — Vercel (Web)

1. Go to [vercel.com](https://vercel.com) → **New Project → Import Git Repository**
2. Select your repo
3. Vercel will detect `vercel.json` at the root

4. Set **Root Directory** to: *(leave blank — vercel.json handles it)*

5. Add environment variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://<your-railway-app>.up.railway.app
   JWT_SECRET=<same secret as Railway — must match exactly>
   ```

6. Deploy

7. Copy your Vercel URL and update Railway's `APP_URL` variable to match:
   ```
   APP_URL=https://<your-vercel-app>.vercel.app
   ```
   Then redeploy the Railway API (required for CORS to work).

---

## Step 4 — Verify End-to-End

1. Open `https://<your-vercel-app>.vercel.app/login`
2. Login with the seeded demo credentials (check `packages/db/src/seed.ts` for the email/password)
3. Create a new client and run through the consultation wizard
4. Verify a protocol is generated and saved

---

## Demo Credentials
After running `db:seed`, check `packages/db/src/seed.ts` for the demo tenant slug, email, and password.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| API 500 on login | Wrong DATABASE_URL | Check Supabase URI, run migrations |
| CORS error in browser | APP_URL mismatch | Set APP_URL in Railway to exact Vercel URL |
| 401 on all requests | JWT_SECRET mismatch | Ensure web + API use identical JWT_SECRET |
| Protocol generation fails | Migrations not run | Run `db:migrate` + `db:seed` |
| White screen on Vercel | Build error | Check Vercel build logs, run `pnpm --filter @haircode/web build` locally |
