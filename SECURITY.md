# Security

## Model

1. **RLS on every table**, with client privileges revoked and re-granted minimally (column-level where needed).
2. **Server-side validation** (Zod) on every action; client validation is UX only.
3. **No secrets in the client.** Only `NEXT_PUBLIC_*` values reach the browser. The service-role key is not used yet and must stay server-only.
4. **Sensitive writes only via triggers / SECURITY DEFINER functions** (profile creation, audit logging).

## Implemented in Phase 1

| Threat | Control |
|---|---|
| Under-18 accounts | Validated in the app **and** enforced by DB trigger `enforce_adult` + signup trigger; signup is rolled back if the DOB is missing or invalid. DOB cannot be edited by users (column privilege). |
| Privilege escalation to admin | `admin_roles` has no client access and no policies; `is_admin()` is SECURITY DEFINER. Roles are granted only via SQL/service role. |
| Users editing others' data | RLS `id = auth.uid()`; only `first_name` is updatable on profiles; `account_status` cannot be changed by users. |
| Tampering with audit trail | `audit_logs` is append-only (trigger blocks update/delete, except anonymising `actor_id` when a user is deleted); clients cannot insert. |
| Config tampering | `app_settings` writable by admins only; every change is audit-logged. |
| Open redirects | `safeNextPath` allows only same-site relative paths. |
| Account enumeration | Password reset returns the same message regardless of account existence. |
| Raw error leakage | `toUserMessage` maps errors to safe text; details go to the logger only (no PII, passwords or tokens). |
| Clickjacking / sniffing | `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS. |
| Private pages indexed | `noindex` on account pages, `robots.txt` disallows them. |
| Session theft/staleness | Cookies managed by `@supabase/ssr`; user verified against Auth server (`getUser`) on every protected request. |

## Known gaps (scheduled)

- **CSP header** needs a nonce strategy: Phase 6.
- **App-level rate limiting**: Supabase Auth's built-in limits apply today; add per-IP/user limits for likes, messages and reports in Phases 3-4.
- **Suspended/banned enforcement** at sign-in and in RLS: Phase 5.
- **Upload security** (type/size checks, private buckets): Phase 2.
- **Terms of Service and Privacy Policy** must be written and reviewed by a legal professional before public launch.
- **RLS behavioural tests** against a live database: pending a Supabase project (see PROJECT_STATUS.md).
