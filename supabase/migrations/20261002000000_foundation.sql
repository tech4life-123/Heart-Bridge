-- HeartBridge Phase 1: foundation schema
-- Tables: profiles, user_settings, admin_roles, app_settings, audit_logs
-- Security model: RLS enabled on EVERY table; client roles get the minimum
-- privileges needed; sensitive writes only happen through triggers or
-- SECURITY DEFINER functions.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.account_status as enum ('active', 'suspended', 'banned');
create type public.admin_role as enum ('moderator', 'admin');

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- admin_roles: who is staff. No client access at all; read only through
-- is_admin(). Rows are created by the project owner via SQL / service role.
-- ---------------------------------------------------------------------------
create table public.admin_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.admin_role not null,
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.admin_roles enable row level security;
revoke all on public.admin_roles from anon, authenticated;
-- Intentionally no policies: with RLS on and no policy, clients see nothing.

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_roles
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- profiles: one row per user, created by the signup trigger.
-- Phase 1 holds only what registration collects. Phase 2 extends it.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null
    constraint profiles_first_name_length
    check (char_length(btrim(first_name)) between 1 and 50),
  date_of_birth date not null,
  account_status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Age rule enforced in the database so it cannot be bypassed by calling the
-- Auth API directly. Fires on insert and whenever date_of_birth changes.
create function public.enforce_adult()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.date_of_birth > (current_date - interval '18 years')::date then
    raise exception 'must_be_adult' using errcode = 'check_violation';
  end if;
  if new.date_of_birth < (current_date - interval '120 years')::date then
    raise exception 'invalid_birth_date' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger profiles_enforce_adult
  before insert or update of date_of_birth on public.profiles
  for each row execute function public.enforce_adult();

alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
-- Column-level: users may edit their name only. They can NOT change
-- date_of_birth, account_status or id, whatever the RLS policy says.
grant update (first_name) on public.profiles to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_select_admin on public.profiles
  for select to authenticated
  using ((select public.is_admin()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No INSERT or DELETE policy: rows are created by the signup trigger and
-- removed only when the auth user is deleted (ON DELETE CASCADE).
-- NOTE: viewing OTHER users' profiles (discovery) is added in Phase 3 with
-- explicit visibility, block and age-range rules.

-- ---------------------------------------------------------------------------
-- user_settings: privacy and notification preferences, one row per user.
-- ---------------------------------------------------------------------------
create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  profile_visible boolean not null default true,
  discovery_visible boolean not null default true,
  show_activity_status boolean not null default true,
  notify_new_match boolean not null default true,
  notify_new_message boolean not null default true,
  notify_likes boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;

revoke all on public.user_settings from anon, authenticated;
grant select on public.user_settings to authenticated;
grant update (
  profile_visible,
  discovery_visible,
  show_activity_status,
  notify_new_match,
  notify_new_message,
  notify_likes
) on public.user_settings to authenticated;

create policy user_settings_select_own on public.user_settings
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy user_settings_update_own on public.user_settings
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Signup trigger: creates profile + settings from the signup metadata.
-- If the date of birth is missing, malformed or under 18, this raises and the
-- whole signup is rolled back: no account exists without a valid adult DOB.
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, date_of_birth)
  values (
    new.id,
    btrim(coalesce(new.raw_user_meta_data ->> 'first_name', '')),
    (new.raw_user_meta_data ->> 'date_of_birth')::date
  );

  insert into public.user_settings (user_id) values (new.id);

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- audit_logs: append-only record of sensitive actions.
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id);

create function public.audit_logs_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- The only permitted change: anonymising actor_id when that user is deleted
  -- (the ON DELETE SET NULL foreign key). Everything else is immutable.
  if tg_op = 'UPDATE'
     and new.actor_id is null
     and (new.id, new.action, new.entity_type, new.entity_id, new.metadata, new.created_at)
         is not distinct from
         (old.id, old.action, old.entity_type, old.entity_id, old.metadata, old.created_at)
  then
    return new;
  end if;
  raise exception 'audit_logs is append-only';
end;
$$;

create trigger audit_logs_no_update_delete
  before update or delete on public.audit_logs
  for each row execute function public.audit_logs_immutable();

alter table public.audit_logs enable row level security;

revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;

create policy audit_logs_select_admin on public.audit_logs
  for select to authenticated
  using ((select public.is_admin()));
-- No INSERT policy or grant for clients: only SECURITY DEFINER triggers write.

-- ---------------------------------------------------------------------------
-- app_settings: owner-controlled configuration (launch mode, limits, flags).
-- Public rows are readable by anyone; only admins can change values.
-- ---------------------------------------------------------------------------
create table public.app_settings (
  key text primary key
    constraint app_settings_key_format check (key ~ '^[a-z][a-z0-9_]*$'),
  value jsonb not null,
  is_public boolean not null default false,
  description text,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

revoke all on public.app_settings from anon, authenticated;
grant select on public.app_settings to anon, authenticated;
grant update (value) on public.app_settings to authenticated;

create policy app_settings_select_public on public.app_settings
  for select to anon, authenticated
  using (is_public);

create policy app_settings_select_admin on public.app_settings
  for select to authenticated
  using ((select public.is_admin()));

create policy app_settings_update_admin on public.app_settings
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create function public.app_settings_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  new.updated_by = (select auth.uid());
  return new;
end;
$$;

create trigger app_settings_stamp
  before update on public.app_settings
  for each row execute function public.app_settings_before_update();

create function public.app_settings_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    (select auth.uid()),
    'app_setting.updated',
    'app_setting',
    new.key,
    jsonb_build_object('old', old.value, 'new', new.value)
  );
  return new;
end;
$$;

revoke execute on function public.app_settings_audit() from public, anon, authenticated;

create trigger app_settings_audit_trg
  after update on public.app_settings
  for each row execute function public.app_settings_audit();

-- Launch configuration (reference data, owner-editable later).
insert into public.app_settings (key, value, is_public, description) values
  ('launch_mode', '"FREE"', true, 'FREE during the initial launch; PAID once subscriptions go live'),
  ('free_user_limit', '100', true, 'Number of users the free launch targets'),
  ('subscriptions_enabled', 'false', true, 'Master switch for premium subscriptions');
