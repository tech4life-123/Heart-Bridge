-- HeartBridge Phase 6: reports, safety flags, blocked list.
-- Reports and flags are written ONLY through functions and are never readable by
-- clients (staff tools arrive in Phase 8). A reported person is never told who reported.

create type public.report_category as enum (
  'fake_profile', 'scam', 'harassment', 'sexual_misconduct', 'threatening_behavior',
  'spam', 'underage_user', 'inappropriate_content', 'other'
);
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  category public.report_category not null,
  description text constraint reports_description_len check (description is null or char_length(description) <= 1000),
  match_id uuid references public.matches (id) on delete set null,
  status public.report_status not null default 'open',
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_not_self check (reporter_id <> reported_id)
);
create index reports_reported_idx on public.reports (reported_id, status);
create index reports_status_created_idx on public.reports (status, created_at);
create index reports_reporter_created_idx on public.reports (reporter_id, created_at desc);
create unique index reports_one_open_per_category
  on public.reports (reporter_id, reported_id, category) where status in ('open', 'reviewing');

create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

create table public.safety_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('scam_pattern', 'multiple_reports', 'underage_report')),
  details jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index safety_flags_status_idx on public.safety_flags (status, created_at);
create index safety_flags_user_idx on public.safety_flags (user_id, kind, created_at desc);

create trigger safety_flags_set_updated_at
  before update on public.safety_flags
  for each row execute function public.set_updated_at();

alter table public.reports enable row level security;
alter table public.safety_flags enable row level security;
revoke all on public.reports, public.safety_flags from anon, authenticated;
-- No policies and no grants: clients can neither read nor write these tables.

-- ---------------------------------------------------------------------------
-- Report a person (from a profile or a conversation)
-- ---------------------------------------------------------------------------
create function public.report_user(
  p_reported uuid,
  p_category public.report_category,
  p_description text default null,
  p_match_id uuid default null
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  d text := nullif(btrim(coalesce(p_description, '')), '');
  distinct_reporters int;
  mid uuid;
begin
  if me is null or p_reported is null or me = p_reported then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if d is not null and char_length(d) > 1000 then
    raise exception 'invalid_report' using errcode = 'check_violation';
  end if;

  -- Only people who could actually encounter this person may report them:
  -- visible in discovery, or matched (a match survives a later block).
  select m.id into mid from public.matches m
   where m.user_a = least(me, p_reported) and m.user_b = greatest(me, p_reported);
  if mid is null and not public.can_view_profile(p_reported) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if (select count(*) from public.reports where reporter_id = me and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'rate_limited' using errcode = 'check_violation';
  end if;

  insert into public.reports (reporter_id, reported_id, category, description, match_id)
  values (me, p_reported, p_category, d, mid)
  on conflict (reporter_id, reported_id, category) where status in ('open', 'reviewing') do nothing;

  if p_category = 'underage_user' then
    insert into public.safety_flags (user_id, kind, details)
    select p_reported, 'underage_report', jsonb_build_object('source', 'report')
    where not exists (select 1 from public.safety_flags
                      where user_id = p_reported and kind = 'underage_report' and status = 'open');
  end if;

  select count(distinct reporter_id) into distinct_reporters
    from public.reports where reported_id = p_reported and status in ('open', 'reviewing');
  if distinct_reporters >= 3 then
    insert into public.safety_flags (user_id, kind, details)
    select p_reported, 'multiple_reports', jsonb_build_object('reporters', distinct_reporters)
    where not exists (select 1 from public.safety_flags
                      where user_id = p_reported and kind = 'multiple_reports' and status = 'open');
  end if;
end;
$$;
revoke execute on function public.report_user(uuid, public.report_category, text, uuid) from public, anon;
grant execute on function public.report_user(uuid, public.report_category, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- A reminder was shown for a sent message that looked like a money request.
-- Records a neutral flag for staff review (never an accusation, never automatic action).
-- ---------------------------------------------------------------------------
create function public.record_message_flag(p_message_id uuid, p_reason text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  mid uuid;
begin
  if p_reason is null or p_reason not in ('money_request', 'emergency_money', 'investment', 'payment_details') then
    raise exception 'invalid_reason' using errcode = 'check_violation';
  end if;
  select m.match_id into mid from public.messages m where m.id = p_message_id and m.sender_id = me;
  if mid is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  -- At most one open flag per person per day, so one conversation cannot flood the queue.
  if not exists (
    select 1 from public.safety_flags
    where user_id = me and kind = 'scam_pattern' and created_at > now() - interval '24 hours'
  ) then
    insert into public.safety_flags (user_id, kind, details)
    values (me, 'scam_pattern', jsonb_build_object('reason', p_reason, 'message_id', p_message_id, 'match_id', mid));
  end if;
end;
$$;
revoke execute on function public.record_message_flag(uuid, text) from public, anon;
grant execute on function public.record_message_flag(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Blocked list (first name only; the profile itself stays hidden)
-- ---------------------------------------------------------------------------
create function public.my_blocked()
returns table (blocked_id uuid, first_name text, blocked_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select b.blocked_id, p.first_name, b.created_at
  from public.blocks b
  join public.profiles p on p.id = b.blocked_id
  where b.blocker_id = (select auth.uid())
  order by b.created_at desc
  limit 200;
$$;
revoke execute on function public.my_blocked() from public, anon;
grant execute on function public.my_blocked() to authenticated;
