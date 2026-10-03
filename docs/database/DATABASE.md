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

## Phase 3 additions

Migrations: `20261002010000_profiles.sql` (applied), `20261002020000_profile_photo_functions.sql` (pending).

| Table | Purpose | Client access |
|---|---|---|
| `locations` | Hierarchy country > region > city > community; diaspora countries | Read all; writes admin only |
| `interests` | Fixed interest list | Read all |
| `user_interests` | Up to 10 per user | Own rows |
| `preferences` | Seeking genders, age range, visibility scope | Own row |
| `user_contacts` | Optional private phone, `phone_verified` not user-writable | Own row only |
| `profile_photos` | Up to 6 per user, position 0 = main | Own rows (others' photos arrive in Phase 4 with block rules) |

`profiles` gained gender, bio, occupation, education, languages, lifestyle, intentions, location chain, onboarding fields. Date of birth, account status and onboarding completion are not user-writable; `complete_onboarding()` validates required fields. Storage bucket `profile-photos` is private (2MB, WebP/JPEG) with per-user folder policies.

## Phase 4 additions

Migration: `20261002040000_discovery.sql` (applied).

| Object | Purpose | Client access |
|---|---|---|
| `likes` | Who liked whom | Insert as self when `can_view_profile`; read only likes you sent |
| `passes` | Hidden from your feed | Own rows |
| `saved_profiles` | Your saved list | Own rows; insert needs `can_view_profile` |
| `blocks` | Block list (UI in Phase 6) | Own rows; the blocked user cannot see it |
| `compatibility_questions` | Short optional questionnaire | Read active; admins manage |
| `compatibility_answers` | Your private answers | Own rows only |
| `can_view_profile(target)` | Single visibility gate: both active and onboarded, mutual gender and age preferences, the target's "where I appear" settings, no block either way | Callable by signed-in users |
| `profile_cards(ids)` / `discover_profiles(...)` | The only shape in which other people's profiles leave the database: age (not DOB), approximate place, no contact details, no neighbourhood | Signed-in users, gated by `can_view_profile` |

Storage: an extra read policy lets a signed-in user sign photos only of people `can_view_profile` allows. `daily_like_limit` lives in `app_settings` (not public).

## Next (Phase 5+)

`profile_photos`, `preferences`, then `likes`, `matches`, `conversations`, `conversation_members`, `messages`, `notifications`, `reports`, `blocks`, `subscription_plans`, `subscriptions`, `payments`. Each is documented here before it is built.


## Phase 5 additions
Tables: `matches` (ordered pair, trigger-created), `match_participants` (seen/read/hidden marks per person), `messages` (write only via `send_message`). Functions: `my_matches`, `chat_meta`, `unread_summary`, `send_message`, `mark_conversation_read`, `mark_match_seen`, `hide_conversation`, `match_id_with`, `are_matched`, `can_use_typing_topic`. Realtime publication: `messages`, `match_participants`. Storage policy `profile_photos_read_matched`. Realtime policies on `realtime.messages` for private `typing:<match>` topics.


## Phase 6 additions
Tables `reports` (+ enums `report_category`, `report_status`) and `safety_flags`: RLS on, no client grants. Functions `report_user`, `record_message_flag`, `my_blocked`.


## Phase 8 additions
Enum `admin_role` now: moderator, admin (Super Admin), support, finance. Table `user_warnings`. Helpers `staff_has`, `staff_role` (callable), `require_staff`, `write_audit` (internal only). Staff functions: `admin_stats`, `admin_report_queue`, `admin_report_detail`, `admin_set_report_status`, `admin_report_messages` (audited), `admin_find_user`, `admin_user_overview`, `admin_set_account_status`, `admin_warn_user`, `admin_flags_queue`, `admin_review_flag`, `admin_audit_log`, `admin_list_staff`, `admin_set_staff_role`. Storage policy `profile_photos_read_staff`.


## Phase 7 and 9 additions
Enums `payment_provider` (orange_money, lonestar_momo, card) and `payment_status`. Tables `plans` (seed `premium_monthly`), `payments` (column-level select; reviewer hidden), `subscriptions`, `ai_usage`. `app_settings` seeds: wallet numbers and account name (private, empty), `premium_daily_like_limit`. Functions: `user_is_premium`, `my_entitlements`, `payment_options`, `submit_payment`, `cancel_my_payment`, `admin_payments_queue`, `admin_review_payment`, `admin_refund_payment`, `likes_received_count`, `likes_received` (premium only), `ai_consume`; `likes_enforce_limit` now premium-aware.


## Admin extras additions
Table `account_appeals` (no client grants). Functions: `submit_appeal`, `my_appeal`, `admin_appeals_queue`, `admin_review_appeal`, `admin_list_locations`, `admin_save_location`, `admin_analytics`, `admin_report_breakdown`, `admin_revenue`, `admin_premium_count`.

## Feedback additions
Enums `feedback_category`, `feedback_status`. Table `feedback` (no client grants). Functions `submit_feedback`, `admin_feedback_queue`, `admin_set_feedback_status`, `admin_feedback_summary`.

Migration `20261003020000_notifications.sql`: `notification_settings`, `notification_outbox` (no client grants), triggers that queue emails, worker functions `outbox_claim`/`outbox_finish` (guarded by `app_settings.notify_secret`), member functions `my_notification_settings`/`set_notification_settings`. `20261003030000_notifications_schedule.sql` installs pg_cron + pg_net and the 5-minute job.
