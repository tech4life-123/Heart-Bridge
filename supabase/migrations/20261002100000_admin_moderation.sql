-- HeartBridge Phase 8 (part 2): staff-only moderation.
-- Staff never get table access. Every capability is a function that checks the caller's
-- role first and writes an audit_logs row for every action that changes something or
-- reveals private content. Roles: admin = Super Admin (everything), moderator = reports,
-- profiles, user safety, support = look people up, finance = payments (Phase 7).

-- ---------------------------------------------------------------------------
-- Role helpers
-- ---------------------------------------------------------------------------
create function public.staff_has(p_roles public.admin_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_roles
    where user_id = (select auth.uid()) and role = any (p_roles)
  );
$$;
revoke execute on function public.staff_has(public.admin_role[]) from public, anon;
grant execute on function public.staff_has(public.admin_role[]) to authenticated;

create function public.staff_role()
returns public.admin_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.admin_roles where user_id = (select auth.uid());
$$;
revoke execute on function public.staff_role() from public, anon;
grant execute on function public.staff_role() to authenticated;

create function public.require_staff(p_roles public.admin_role[])
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.staff_has(p_roles) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
end;
$$;
revoke execute on function public.require_staff(public.admin_role[]) from public, anon, authenticated;

create function public.write_audit(p_action text, p_entity_type text, p_entity_id text, p_metadata jsonb default '{}'::jsonb)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values ((select auth.uid()), p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb));
$$;
revoke execute on function public.write_audit(text, text, text, jsonb) from public, anon, authenticated;

-- Staff may look at profile photos for moderation (read only).
create policy profile_photos_read_staff on storage.objects
  for select to authenticated
  using (bucket_id = 'profile-photos' and (select public.staff_has(array['moderator', 'admin']::public.admin_role[])));

-- ---------------------------------------------------------------------------
-- Warnings (a person sees them in the app until they acknowledge)
-- ---------------------------------------------------------------------------
create table public.user_warnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  message text not null constraint user_warnings_len check (char_length(message) between 5 and 1000),
  issued_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz
);
create index user_warnings_user_idx on public.user_warnings (user_id, created_at desc);
alter table public.user_warnings enable row level security;
revoke all on public.user_warnings from anon, authenticated;
grant select on public.user_warnings to authenticated;
create policy user_warnings_select_own on public.user_warnings
  for select to authenticated using (user_id = (select auth.uid()));

create function public.ack_warning(p_id uuid)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.user_warnings set acknowledged_at = now()
  where id = p_id and user_id = (select auth.uid()) and acknowledged_at is null;
$$;
revoke execute on function public.ack_warning(uuid) from public, anon;
grant execute on function public.ack_warning(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Dashboard numbers
-- ---------------------------------------------------------------------------
create function public.admin_stats()
returns table (
  users_total int, users_active int, users_suspended int, users_banned int, new_users_7d int,
  matches_total int, messages_24h int, open_reports int, open_flags int
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_staff(array['moderator', 'admin']::public.admin_role[]);
  return query select
    (select count(*)::int from public.profiles),
    (select count(*)::int from public.profiles where account_status = 'active'),
    (select count(*)::int from public.profiles where account_status = 'suspended'),
    (select count(*)::int from public.profiles where account_status = 'banned'),
    (select count(*)::int from public.profiles where created_at > now() - interval '7 days'),
    (select count(*)::int from public.matches),
    (select count(*)::int from public.messages where created_at > now() - interval '24 hours'),
    (select count(*)::int from public.reports where status in ('open', 'reviewing')),
    (select count(*)::int from public.safety_flags where status = 'open');
end;
$$;
revoke execute on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------
create function public.admin_report_queue(p_status public.report_status default null, p_limit int default 50, p_offset int default 0)
returns table (
  id uuid, category public.report_category, status public.report_status, created_at timestamptz,
  reported_id uuid, reported_name text, reported_status public.account_status, reports_against int
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_staff(array['moderator', 'admin']::public.admin_role[]);
  return query
    select r.id, r.category, r.status, r.created_at, r.reported_id, p.first_name, p.account_status,
           (select count(*)::int from public.reports x where x.reported_id = r.reported_id)
    from public.reports r
    join public.profiles p on p.id = r.reported_id
    where (p_status is null and r.status in ('open', 'reviewing')) or r.status = p_status
    order by (r.category = 'underage_user') desc, r.created_at asc
    limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
end;
$$;
revoke execute on function public.admin_report_queue(public.report_status, int, int) from public, anon;
grant execute on function public.admin_report_queue(public.report_status, int, int) to authenticated;

create function public.admin_report_detail(p_id uuid)
returns table (
  id uuid, category public.report_category, description text, status public.report_status,
  created_at timestamptz, resolved_at timestamptz, match_id uuid,
  reporter_id uuid, reporter_name text, reported_id uuid, reported_name text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_staff(array['moderator', 'admin']::public.admin_role[]);
  return query
    select r.id, r.category, r.description, r.status, r.created_at, r.resolved_at, r.match_id,
           r.reporter_id, rp.first_name, r.reported_id, dp.first_name
    from public.reports r
    join public.profiles rp on rp.id = r.reporter_id
    join public.profiles dp on dp.id = r.reported_id
    where r.id = p_id;
end;
$$;
revoke execute on function public.admin_report_detail(uuid) from public, anon;
grant execute on function public.admin_report_detail(uuid) to authenticated;

create function public.admin_set_report_status(p_id uuid, p_status public.report_status, p_note text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.require_staff(array['moderator', 'admin']::public.admin_role[]);
  update public.reports
     set status = p_status,
         resolved_by = case when p_status in ('resolved', 'dismissed') then (select auth.uid()) else null end,
         resolved_at = case when p_status in ('resolved', 'dismissed') then now() else null end
   where id = p_id;
  if not found then
    raise exception 'not_found' using errcode = 'no_data_found';
  end if;
  perform public.write_audit('report_' || p_status::text, 'report', p_id::text, jsonb_build_object('note', left(p_note, 500)));
end;
$$;
revoke execute on function public.admin_set_report_status(uuid, public.report_status, text) from public, anon;
grant execute on function public.admin_set_report_status(uuid, public.report_status, text) to authenticated;

-- Only the conversation that was reported, only for a report that links one, always audited.
create function public.admin_report_messages(p_report_id uuid)
returns table (sender_id uuid, sender_name text, body text, created_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  mid uuid;
begin
  perform public.require_staff(array['moderator', 'admin']::public.admin_role[]);
  select r.match_id into mid from public.reports r where r.id = p_report_id;
  if mid is null then
    return;
  end if;
  perform public.write_audit('view_reported_messages', 'report', p_report_id::text, jsonb_build_object('match_id', mid));
  return query
    select m.sender_id, p.first_name, m.body, m.created_at
    from public.messages m join public.profiles p on p.id = m.sender_id
    where m.match_id = mid
    order by m.created_at desc
    limit 100;
end;
$$;
revoke execute on function public.admin_report_messages(uuid) from public, anon;
grant execute on function public.admin_report_messages(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------
create function public.admin_find_user(p_query text)
returns table (id uuid, first_name text, account_status public.account_status, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  q text := btrim(coalesce(p_query, ''));
begin
  perform public.require_staff(array['moderator', 'admin', 'support']::public.admin_role[]);
  if char_length(q) < 2 then
    return;
  end if;
  return query
    select p.id, p.first_name, p.account_status, p.created_at
    from public.profiles p
    where p.first_name ilike replace(replace(q, '%', ''), '_', '') || '%'
       or (public.staff_has(array['admin', 'support']::public.admin_role[])
           and exists (select 1 from auth.users u where u.id = p.id and lower(u.email) = lower(q)))
       or p.id::text = q
    order by p.created_at desc
    limit 20;
end;
$$;
revoke execute on function public.admin_find_user(text) from public, anon;
grant execute on function public.admin_find_user(text) to authenticated;

create function public.admin_user_overview(p_user uuid)
returns table (
  id uuid, first_name text, age int, gender public.gender, account_status public.account_status,
  created_at timestamptz, bio text, occupation text, photo_paths text[],
  reports_open int, reports_total int, warnings int, matches int, is_staff boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_staff(array['moderator', 'admin', 'support']::public.admin_role[]);
  return query
    select p.id, p.first_name, public.age_years(p.date_of_birth), p.gender, p.account_status, p.created_at,
           case when public.staff_has(array['moderator', 'admin']::public.admin_role[]) then p.bio end,
           case when public.staff_has(array['moderator', 'admin']::public.admin_role[]) then p.occupation end,
           case when public.staff_has(array['moderator', 'admin']::public.admin_role[])
                then coalesce((select array_agg(pp.storage_path order by pp.position) from public.profile_photos pp where pp.user_id = p.id), '{}')
                else '{}'::text[] end,
           (select count(*)::int from public.reports r where r.reported_id = p.id and r.status in ('open', 'reviewing')),
           (select count(*)::int from public.reports r where r.reported_id = p.id),
           (select count(*)::int from public.user_warnings w where w.user_id = p.id),
           (select count(*)::int from public.matches m where p.id in (m.user_a, m.user_b)),
           exists (select 1 from public.admin_roles a where a.user_id = p.id)
    from public.profiles p where p.id = p_user;
end;
$$;
revoke execute on function public.admin_user_overview(uuid) from public, anon;
grant execute on function public.admin_user_overview(uuid) to authenticated;

create function public.admin_set_account_status(p_user uuid, p_status public.account_status, p_reason text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  r text := btrim(coalesce(p_reason, ''));
begin
  perform public.require_staff(array['moderator', 'admin']::public.admin_role[]);
  if p_status = 'banned' then
    perform public.require_staff(array['admin']::public.admin_role[]);
  end if;
  if char_length(r) < 5 or char_length(r) > 1000 then
    raise exception 'reason_required' using errcode = 'check_violation';
  end if;
  if p_user = (select auth.uid()) or exists (select 1 from public.admin_roles where user_id = p_user) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  update public.profiles set account_status = p_status where id = p_user;
  if not found then
    raise exception 'not_found' using errcode = 'no_data_found';
  end if;
  perform public.write_audit(
    case p_status when 'active' then 'restore_user' when 'suspended' then 'suspend_user' else 'ban_user' end,
    'user', p_user::text, jsonb_build_object('reason', r));
end;
$$;
revoke execute on function public.admin_set_account_status(uuid, public.account_status, text) from public, anon;
grant execute on function public.admin_set_account_status(uuid, public.account_status, text) to authenticated;

create function public.admin_warn_user(p_user uuid, p_message text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  m text := btrim(coalesce(p_message, ''));
begin
  perform public.require_staff(array['moderator', 'admin']::public.admin_role[]);
  if char_length(m) < 5 or char_length(m) > 1000 then
    raise exception 'reason_required' using errcode = 'check_violation';
  end if;
  if p_user = (select auth.uid()) or exists (select 1 from public.admin_roles where user_id = p_user) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  insert into public.user_warnings (user_id, message, issued_by) values (p_user, m, (select auth.uid()));
  perform public.write_audit('warn_user', 'user', p_user::text, jsonb_build_object('message', m));
end;
$$;
revoke execute on function public.admin_warn_user(uuid, text) from public, anon;
grant execute on function public.admin_warn_user(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Safety flags
-- ---------------------------------------------------------------------------
create function public.admin_flags_queue(p_limit int default 50)
returns table (id uuid, user_id uuid, first_name text, kind text, details jsonb, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_staff(array['moderator', 'admin']::public.admin_role[]);
  return query
    select f.id, f.user_id, p.first_name, f.kind, f.details, f.created_at
    from public.safety_flags f join public.profiles p on p.id = f.user_id
    where f.status = 'open'
    order by (f.kind = 'underage_report') desc, f.created_at asc
    limit least(greatest(p_limit, 1), 100);
end;
$$;
revoke execute on function public.admin_flags_queue(int) from public, anon;
grant execute on function public.admin_flags_queue(int) to authenticated;

create function public.admin_review_flag(p_id uuid, p_status text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.require_staff(array['moderator', 'admin']::public.admin_role[]);
  if p_status not in ('reviewed', 'dismissed') then
    raise exception 'invalid_status' using errcode = 'check_violation';
  end if;
  update public.safety_flags set status = p_status where id = p_id;
  if not found then
    raise exception 'not_found' using errcode = 'no_data_found';
  end if;
  perform public.write_audit('flag_' || p_status, 'safety_flag', p_id::text);
end;
$$;
revoke execute on function public.admin_review_flag(uuid, text) from public, anon;
grant execute on function public.admin_review_flag(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Super Admin only: audit log and staff roles
-- ---------------------------------------------------------------------------
create function public.admin_audit_log(p_limit int default 50, p_offset int default 0)
returns table (id bigint, actor_name text, action text, entity_type text, entity_id text, metadata jsonb, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_staff(array['admin']::public.admin_role[]);
  return query
    select a.id, p.first_name, a.action, a.entity_type, a.entity_id, a.metadata, a.created_at
    from public.audit_logs a left join public.profiles p on p.id = a.actor_id
    order by a.id desc
    limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0);
end;
$$;
revoke execute on function public.admin_audit_log(int, int) from public, anon;
grant execute on function public.admin_audit_log(int, int) to authenticated;

create function public.admin_list_staff()
returns table (user_id uuid, first_name text, role public.admin_role, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_staff(array['admin']::public.admin_role[]);
  return query
    select a.user_id, p.first_name, a.role, a.created_at
    from public.admin_roles a left join public.profiles p on p.id = a.user_id
    order by a.created_at;
end;
$$;
revoke execute on function public.admin_list_staff() from public, anon;
grant execute on function public.admin_list_staff() to authenticated;

create function public.admin_set_staff_role(p_user uuid, p_role public.admin_role default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.require_staff(array['admin']::public.admin_role[]);
  if p_user = (select auth.uid()) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_user) then
    raise exception 'not_found' using errcode = 'no_data_found';
  end if;
  if p_role is null then
    delete from public.admin_roles where user_id = p_user;
  else
    insert into public.admin_roles (user_id, role, granted_by)
    values (p_user, p_role, (select auth.uid()))
    on conflict (user_id) do update set role = excluded.role, granted_by = excluded.granted_by;
  end if;
  perform public.write_audit('set_staff_role', 'user', p_user::text, jsonb_build_object('role', p_role));
end;
$$;
revoke execute on function public.admin_set_staff_role(uuid, public.admin_role) from public, anon;
grant execute on function public.admin_set_staff_role(uuid, public.admin_role) to authenticated;
