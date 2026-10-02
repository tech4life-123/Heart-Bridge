# Architecture

## Principles

Simplicity, safety, privacy, low cost, and performance on 3G/4G Android phones. No fake features: anything that needs an external provider is built as an interface and marked unconfigured until real.

## Layers

- **UI (Server Components first).** Pages render on the server; only forms and interactive pieces are client components. System fonts, no heavy media, minimal JS.
- **Server actions** (`src/features/*/actions.ts`) hold all auth and business operations. Every input is validated with Zod before use. UI components never talk to the database for writes that matter.
- **Supabase** provides Auth, Postgres, Storage and Realtime. Browser and server share one anon key; **Row Level Security is the real authorization layer**.
- **`src/proxy.ts`** (Next 16's replacement for middleware) refreshes the session and redirects unauthenticated users away from `/app`. Pages re-check the user server-side (defence in depth).

## Configuration that must not be hard-coded

Launch mode, free-user limit and the subscriptions switch live in the `app_settings` table (public rows), read through `src/config/launch.ts` with a safe free-launch fallback. Only admins can change them, and changes are audit-logged. Brand constants live in `src/config/app.ts`.

## Expansion

Country, region, language, currency and payment provider are not assumed anywhere in the schema or code. Phase 2 stores country/region as data, not constants. Payments will use a provider interface (Orange Money, Lonestar MTN MoMo) with server-side verification only; no provider is faked.

## Decisions

See `docs/decisions/`.
