# Project status

**Current phase:** 1 (Foundation) complete. Stopped at the Phase 1 boundary.

## Completed

- Next.js 16 + React 19 + TypeScript + Tailwind 4 app, mobile-first, system fonts
- HeartBridge identity: heart-and-bridge logo mark (SVG), warm rose/gold/cream palette, favicon/manifest
- Landing page (how it works, safety/privacy, CTAs), `/safety` community rules and tips
- Email auth: sign up (18+ DOB + confirmation checkbox), sign in, sign out, forgot/reset password, email-link confirmation (supports default `code` and custom `token_hash` links), protected `/app`
- Supabase integration (server client, session proxy), validated environment config
- Database foundation applied to the live Supabase project "Heart Bridge": `profiles`, `user_settings`, `admin_roles`, `app_settings`, `audit_logs`, all with RLS
- Old empty prototype tables (`profiles`, `matches`, `messages`, 0 rows, 0 users) removed by the owner; replaced by the normalized schema
- Owner-controlled launch config (FREE mode, 100-user limit, subscriptions off), nothing hard-coded
- Security headers, error mapping, structured logging, open-redirect protection
- Docs: README, ARCHITECTURE, SECURITY, ROADMAP, database doc, ADR

## Verification

Done:
- `npm run lint`, `npm run typecheck`: pass
- `npm test`: 30/30 pass (age rule, schemas, redirects, error mapping, launch config)
- `npm run build` against the real project env: pass (14 routes)
- Running production server smoke test: landing/auth/safety/robots/manifest return 200; `/app` redirects to `/login` when signed out; `/reset-password` and bogus or open-redirect confirm links redirect safely to `/login`; security headers present
- Live database inspected read-only: grants, column-level update grants, policies and triggers match the design (anon can only read the 3 public launch settings; users can read own rows and edit only `first_name` and their privacy/notification toggles; `admin_roles` has no client access)
- Supabase security advisor: no errors. Warnings are accepted (see SECURITY.md)

Not yet verified:
- **Behavioural RLS test** (signed-in user A vs B, under-18 signup rejection, admin escalation attempts, audit immutability). A transactional test script was prepared but the run was cancelled. Run it before launch.
- **End-to-end auth** (real signup, email delivery, confirmation, reset): requires Supabase email settings and a deployed or local URL reachable from a browser.
- No visual or device testing.

## Deployment

Vercel project `heartbridge` (team liberia-software-production-corporation), production deploys from `main` of `tech4life-123/Heart-Bridge`. Env vars set: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`. Build succeeded; Vercel Authentication disabled so the site is public. Live routes were not smoke-tested from the build environment (network restrictions); verify by hand.

## Known limitations

See SECURITY.md "Known gaps". No profile editing, photos, discovery or chat yet (Phases 2-4).

## Next phase

Phase 2 (Profiles): profile fields, photos, preferences, onboarding.

## Unresolved decisions

1. Custom production domain (currently the Vercel alias `heartbridge-liberia-software-production-corporation.vercel.app`; keep Supabase Site URL and `NEXT_PUBLIC_SITE_URL` in sync if it changes).
2. Custom SMTP provider for auth emails (free tier sender is heavily rate-limited).
3. Whether to disable the unused `pg_graphql` extension (hides table names from the public schema).
4. Phone auth later, and which SMS provider.
5. Terms of Service and Privacy Policy text (legal review).
