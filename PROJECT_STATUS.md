# Project status

**Current phase:** 1 (Foundation), code complete. Stopped at the Phase 1 boundary.

## Completed

- Next.js 16 + React 19 + TypeScript + Tailwind 4 app, mobile-first, system fonts
- HeartBridge identity: heart-and-bridge logo mark (SVG), warm rose/gold/cream palette, favicon/manifest
- Landing page (how it works, safety/privacy, CTAs), `/safety` community rules and tips
- Email auth: sign up (with 18+ DOB and confirmation checkbox), sign in, sign out, forgot/reset password, email-link confirmation, protected `/app`
- Supabase integration (server client, session proxy), validated environment config
- Database foundation migration with RLS: `profiles`, `user_settings`, `admin_roles`, `app_settings`, `audit_logs`
- Owner-controlled launch config (FREE mode, 100-user limit, subscriptions off), nothing hard-coded
- Security headers, error mapping, structured logging, open-redirect protection
- Docs: README, ARCHITECTURE, SECURITY, ROADMAP, database doc, ADR

## Verification (run locally)

- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm test`: 30/30 pass (age rule, schemas, redirects, error mapping, launch config)
- `npm run build`: pass (14 routes)

## Not yet verified

- **The migration has not been applied to a database**, so RLS and the signup trigger are untested against Postgres. No Heart Bridge Supabase project exists yet.
- Auth flows are untested end to end (need a Supabase project with email configured).
- No visual or device testing yet (no browser pass in this session).

## Files

`src/app/*` (landing, safety, auth pages, `/app`, robots, sitemap, manifest, icon), `src/features/auth/*`, `src/components/*`, `src/config/*`, `src/lib/*`, `src/proxy.ts`, `supabase/migrations/20261002000000_foundation.sql`, `docs/*`, root docs.

## Known limitations

See SECURITY.md "Known gaps". No profile editing, photos, discovery or chat yet (Phases 2-4).

## Next phase

Phase 2 (Profiles), after the migration is applied and RLS is verified.

## Unresolved decisions

1. Which Supabase project to use (create a new one; may incur cost).
2. Production domain and Vercel project.
3. Whether to add phone auth later, and which SMS provider.
4. Terms of Service and Privacy Policy text (legal review).
