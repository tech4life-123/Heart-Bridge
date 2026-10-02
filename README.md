# HeartBridge

**Where Hearts Connect.** A dating and relationship platform built for Liberia, designed to expand across Africa.

Stack: Next.js (App Router) · React · TypeScript · Tailwind CSS · Supabase (Postgres, Auth, Storage, Realtime) · Vercel.

> Status: **Phase 1 (Foundation) complete.** See [PROJECT_STATUS.md](PROJECT_STATUS.md).

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # http://localhost:3000
```

Checks (run before every commit): `npm run check` runs lint, typecheck, tests and a production build.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Anon/publishable key. Safe to expose only because RLS is on for every table |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical URL, used in email links |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Not used yet. Never prefix with `NEXT_PUBLIC_` |

Never commit `.env.local`. Missing or invalid variables fail fast with a clear error (`src/lib/env.ts`).

## Supabase setup

1. Create a Supabase project.
2. Apply `supabase/migrations/*.sql` in order (SQL editor, or `supabase db push` with the CLI).
3. Authentication > URL Configuration: set **Site URL** to `NEXT_PUBLIC_SITE_URL` and add `<site>/auth/confirm` (and `http://localhost:3000/auth/confirm` for local dev) to Redirect URLs.
4. Email templates: the default Supabase templates work as-is (the `/auth/confirm` route accepts both the default `code` links and custom `token_hash` links).
5. Keep **Confirm email** enabled.
6. Copy the URL and anon key into `.env.local`.

> Free-tier note: Supabase's built-in email sender is heavily rate-limited (a few emails per hour). For real users, configure a custom SMTP provider (Authentication > SMTP Settings) before launch.

### Creating the first admin

Admin rights cannot be granted from the app (by design). In the Supabase SQL editor:

```sql
insert into public.admin_roles (user_id, role)
values ('<the user''s auth.users id>', 'admin');
```

## Deployment (Vercel)

Import the GitHub repo, add the three public environment variables, deploy. Set `NEXT_PUBLIC_SITE_URL` to the production domain.

## Project layout

```
src/app            routes (landing, auth pages, /app, /safety, robots, sitemap, manifest)
src/features/auth  auth server actions and forms
src/components     Logo and UI primitives
src/config         brand constants and owner-controlled launch config
src/lib            env, supabase clients, validation, errors, logging, safe redirects
src/proxy.ts       session refresh + route protection
supabase/migrations  database schema, RLS, triggers
docs               architecture, database, security, decisions
```

## Docs

[ARCHITECTURE.md](ARCHITECTURE.md) · [SECURITY.md](SECURITY.md) · [ROADMAP.md](ROADMAP.md) · [docs/database/DATABASE.md](docs/database/DATABASE.md)
