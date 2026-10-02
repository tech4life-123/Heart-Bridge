# Database (Phase 1)

Migration: `supabase/migrations/20261002000000_foundation.sql`

| Table | Purpose | Client access |
|---|---|---|
| `profiles` | One row per user: first name, date of birth, account status. Created by trigger on signup. | Select own; update `first_name` only. Admins can select. |
| `user_settings` | Privacy and notification preferences. Created by trigger. | Select own; update the preference columns only. |
| `admin_roles` | Staff roles (`moderator`, `admin`). | **None.** Read only through `is_admin()`. |
| `app_settings` | Owner-controlled config (launch mode, free-user limit, subscriptions switch). | Public rows readable by anyone; admins can update `value`. |
| `audit_logs` | Append-only record of sensitive actions. | Admins can select; nobody can insert/update/delete from the client. |

## Key rules

- `profiles.id` references `auth.users(id)` with cascade delete.
- Age: `enforce_adult` trigger (18-120 years) on insert and on DOB change; `handle_new_user` fails the signup if the DOB is invalid.
- `app_settings` changes write an `audit_logs` row via a SECURITY DEFINER trigger.
- All SECURITY DEFINER functions set `search_path = ''` and have `EXECUTE` revoked from roles that do not need it.

## Lifecycle

`account_status`: `active` -> `suspended` | `banned`. Only staff will change it (Phase 5); users cannot.

## Next (Phase 2+)

`profile_photos`, `preferences`, then `likes`, `matches`, `conversations`, `conversation_members`, `messages`, `notifications`, `reports`, `blocks`, `subscription_plans`, `subscriptions`, `payments`. Each is documented here before it is built.
