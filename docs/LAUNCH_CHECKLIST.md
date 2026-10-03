# HeartBridge launch checklist

Status key: DONE = verified by tests/inspection, YOU = needs the owner, LATER = not built yet.

## Verified
- DONE RLS and permissions: behavioural SQL tests in `supabase/tests/` (profiles 51, discovery 40, matching 32, safety 15, admin 30 checks, all true live). Foundation test (34) needs one clean run by the owner.
- DONE Authorization: staff roles checked in the database on every admin function; `/admin` returns 404 to non-staff.
- DONE Uploads: private bucket, signed URLs, size/type limits (Phase 3).
- DONE Messaging: matched-only, rate limited, blocks respected, delete-from-own-view.
- DONE Secrets: Vercel has only the public URL, public anon key and site URL; no service-role key anywhere in the app or client.
- DONE Security headers incl. Content-Security-Policy, HSTS, frame denial; checked in a real browser with no violations.
- DONE Dependencies: `npm audit --omit=dev` reports 0 vulnerabilities.
- DONE Error handling: friendly error, not-found and loading pages; technical errors only in logs.
- DONE Health check: `/api/health`.
- DONE Legal drafts: `/privacy`, `/terms` (plain-language; need lawyer review).
- DONE Account deletion screen and function (function must be run once: see below).

## You must do before public launch
1. Run `supabase/migrations/20261002120000_delete_account.sql` in the Supabase SQL Editor (approve the prompt).
2. Run `supabase/tests/rls_foundation.sql` once and confirm all values are true.
3. Make yourself Super Admin (SQL in PROJECT_STATUS.md, Phase 8).
4. Supabase Auth > URL configuration: Site URL `https://heartbridge-liberia-software-production-corporation.vercel.app`; redirect URLs `<site>/auth/confirm` and `http://localhost:3000/auth/confirm`.
5. Set up custom SMTP (the built-in email sender is heavily rate-limited, so signup confirmation emails will fail under real traffic).
6. Supabase Auth > enable leaked-password protection (needs a paid plan on some tiers).
7. Backups: the free Supabase plan has no point-in-time recovery. Upgrade before storing real members' data, or schedule regular exports.
8. Test with two real accounts on a phone: sign up, onboard, like each other, chat, report, block, delete account.
9. Have a Liberian lawyer review Privacy and Terms.
10. Decide how people reach support (the app says "contact HeartBridge support" but has no contact page yet).

## Premium and AI (owner)
11. Set the merchant wallet numbers (Orange Money, Lonestar MTN MoMo) and account name with the SQL in PROJECT_STATUS.md (Phase 7). Until then Premium shows "opening soon".
12. Create at least one `finance` staff member (Staff page) and agree a routine for checking the wallet statement and confirming payments promptly.
13. Make a real US$2 test payment end to end before announcing Premium.
14. To enable AI: add `ANTHROPIC_API_KEY` in Vercel (optionally `AI_MODEL`, `AI_SAFETY_ENABLED=true`), redeploy, and set a spending limit in the Anthropic console.

## Later
- Phone OTP login (needs an SMS budget), real identity verification, push/email notifications, nonce-based CSP, automated browser end-to-end tests with a test Supabase project, analytics/monitoring (e.g. Vercel Analytics, error reporting).
