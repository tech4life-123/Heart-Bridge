# ADR 0001: Phase 1 foundation choices

- **Next.js 16 `proxy.ts`** replaces `middleware.ts` (deprecated rename). Session refresh and route guarding live there.
- **Email/password auth first**, as specified. Phone auth is deferred; it needs a reliable, affordable SMS provider for Liberia and is not mandatory.
- **Age enforced in the database**, not only in the app, because the Supabase Auth API can be called directly.
- **System font stack**: no font download, better on slow connections.
- **Owner-editable launch config in a table** (not env vars) so the 100-user threshold and subscription switch can change without a deploy.
- **`audit_logs` append-only** with a single exception for anonymising `actor_id` on user deletion, so account deletion is never blocked.
- **No Terms/Privacy pages yet**: legal text must be reviewed by a professional; placeholders would be misleading.
