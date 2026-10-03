-- HeartBridge: admin extras = account appeals, audited locations editor, analytics.

-- ---------------------------------------------------------------------------
-- Appeals: a suspended or banned member can ask for a human to look again.
-- ---------------------------------------------------------------------------
create table public.account_appeals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  message text not null check (char_length(btrim(message)) between 20 and 1000),
  status text not null default 'open' check (status in ('open', 'granted', 'denied')),
  decision_note text check (decision_note is null or char_length(decision_note) <= 500),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index account_appeals_one_open_uidx on public.account_appeals (user_id) where status = 'open';
create index account_appeals_user_idx on public.account_appeals (user_id, created_at desc);
create index account_appeals_reviewer_idx on public.account_appeals (reviewed_by);
alter table public.account_appeals enable row level security;
revoke all on public.account_appeals from anon, authenticated;

create function public.submit_appeal(p_message text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  m text := btrim(coalesce(p_message, ''));
  st public.account_status;
  aid uuid;
begin
  if me is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  select account_status into st from public.profiles where id = me;
  if st is null or st = 'active' then
    raise exception 'not_restricted' using errcode = 'check_violation';
  end if;
  if char_length(m) < 20 or char_length(m) > 1000 then
    raise exception 'invalid_appeal' using errcode = 'check_violation';
  end if;
  if (select count(*) from public.account_appeals where user_id = me and created_at > now() - interval '30 days') >= 3 then
    raise exception 'rate_limited' using errcode = 'check_violation';
  end if;
  begin
    insert into public.account_appeals (user_id, message) values (me, m) returning id into aid;
  exception when unique_violation then
    raise exception 'appeal_open' using errcode = 'check_violation';
  end;
  return aid;
end;
$$;
revoke execute on function public.submit_appeal(text) from public, anon;
grant execute on function public.submit_appeal(text) to authenticated;

-- The member's latest appeal (they can see their own outcome, never the reviewer).
create function public.my_appeal()
returns table (status text, decision_note text, created_at timestamptz, reviewed_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select a.status, a.decision_note, a.created_at, a.reviewed_at
  from public.account_appeals a
  where a.user_id = (select auth.uid())
  order by a.created_at desc
  limit 1;
$$;
revoke execute on function public.my_appeal() from public, anon;
grant execute on function public.my_appeal() to authenticated;

create function public.admin_appeals_queue(p_status text default 'open', p_limit int default 50)
returns table (id uuid, user_id uuid, first_name text, account_status public.account_status, message text,
               status text, decision_note text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_staff(array['moderator', 'admin']::public.admin_role[]);
  return query
    select a.id, a.user_id, p.first_name, p.account_status, a.message, a.status, a.decision_note, a.created_at
    from public.account_appeals a join public.profiles p on p.id = a.user_id
    where a.status = p_status
    order by a.created_at
    limit least(greatest(p_limit, 1), 100);
end;
$$;
revoke execute on function public.admin_appeals_queue(text, int) from public, anon;
grant execute on function public.admin_appeals_queue(text, int) to authenticated;

-- Granting an appeal restores the account. Only a Super Admin may grant an appeal against a ban.
-- A reviewer cannot be the person whose own appeal it is, and every decision is audited.
create function public.admin_review_appeal(p_id uuid, p_decision text, p_note text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  n text := btrim(coalesce(p_note, ''));
  a public.account_appeals;
  st public.account_status;
begin
  perform public.require_staff(array['moderator', 'admin']::public.admin_role[]);
  if p_decision not in ('granted', 'denied') or char_length(n) < 5 or char_length(n) > 500 then
    raise exception 'invalid_decision' using errcode = 'check_violation';
  end if;
  select * into a from public.account_appeals where id = p_id for update;
  if not found or a.status <> 'open' then
    raise exception 'not_found' using errcode = 'no_data_found';
  end if;
  if a.user_id = me then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  select account_status into st from public.profiles where id = a.user_id;
  if p_decision = 'granted' then
    if st = 'banned' then
      perform public.require_staff(array['admin']::public.admin_role[]);
    end if;
    update public.profiles set account_status = 'active' where id = a.user_id;
  end if;
  update public.account_appeals
    set status = p_decision, decision_note = n, reviewed_by = me, reviewed_at = now()
    where id = p_id;
  perform public.write_audit('review_appeal', 'appeal', p_id::text,
    jsonb_build_object('decision', p_decision, 'user', a.user_id, 'note', n));
end;
$$;
revoke execute on function public.admin_review_appeal(uuid, text, text) from public, anon;
grant execute on function public.admin_review_appeal(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Locations editor (Super Admin, audited). Places are switched off instead of being removed,
-- so existing profiles keep a valid location.
-- ---------------------------------------------------------------------------
create function public.admin_list_locations()
returns table (id uuid, parent_id uuid, kind public.location_kind, name text, slug text, sort_order int, is_active boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_staff(array['admin']::public.admin_role[]);
  return query select l.id, l.parent_id, l.kind, l.name, l.slug, l.sort_order, l.is_active
               from public.locations l order by l.kind, l.sort_order, l.name;
end;
$$;
revoke execute on function public.admin_list_locations() from public, anon;
grant execute on function public.admin_list_locations() to authenticated;

create function public.admin_save_location(
  p_id uuid, p_parent uuid, p_kind public.location_kind, p_name text, p_slug text, p_sort int, p_active boolean)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  nm text := btrim(coalesce(p_name, ''));
  sl text := lower(btrim(coalesce(p_slug, '')));
  rid uuid;
begin
  perform public.require_staff(array['admin']::public.admin_role[]);
  if char_length(nm) not between 1 and 80 or sl !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'invalid_location' using errcode = 'check_violation';
  end if;
  begin
    if p_id is null then
      insert into public.locations (parent_id, kind, name, slug, sort_order, is_active)
      values (p_parent, p_kind, nm, sl, coalesce(p_sort, 0), coalesce(p_active, true))
      returning id into rid;
    else
      update public.locations
        set name = nm, slug = sl, sort_order = coalesce(p_sort, 0), is_active = coalesce(p_active, true)
        where id = p_id
        returning id into rid;
      if rid is null then
        raise exception 'not_found' using errcode = 'no_data_found';
      end if;
    end if;
  exception when unique_violation then
    raise exception 'location_exists' using errcode = 'check_violation';
  end;
  perform public.write_audit(case when p_id is null then 'create_location' else 'update_location' end,
    'location', rid::text, jsonb_build_object('name', nm, 'slug', sl, 'active', coalesce(p_active, true)));
  return rid;
end;
$$;
revoke execute on function public.admin_save_location(uuid, uuid, public.location_kind, text, text, int, boolean) from public, anon;
grant execute on function public.admin_save_location(uuid, uuid, public.location_kind, text, text, int, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Analytics: aggregate counts only, never individual people.
-- ---------------------------------------------------------------------------
create function public.admin_analytics(p_days int default 30)
returns table (day date, signups int, likes int, matches int, messages int)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  d int := least(greatest(coalesce(p_days, 30), 7), 90);
begin
  perform public.require_staff(array['moderator', 'admin']::public.admin_role[]);
  return query
  select g.day::date,
    (select count(*)::int from public.profiles p where p.created_at::date = g.day::date),
    (select count(*)::int from public.likes l where l.created_at::date = g.day::date),
    (select count(*)::int from public.matches m where m.created_at::date = g.day::date),
    (select count(*)::int from public.messages x where x.created_at::date = g.day::date)
  from generate_series(current_date - (d - 1), current_date, interval '1 day') as g(day)
  order by g.day;
end;
$$;
revoke execute on function public.admin_analytics(int) from public, anon;
grant execute on function public.admin_analytics(int) to authenticated;

create function public.admin_report_breakdown()
returns table (category public.report_category, total int, open int)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_staff(array['moderator', 'admin']::public.admin_role[]);
  return query
    select r.category, count(*)::int, count(*) filter (where r.status in ('open', 'reviewing'))::int
    from public.reports r group by r.category order by count(*) desc;
end;
$$;
revoke execute on function public.admin_report_breakdown() from public, anon;
grant execute on function public.admin_report_breakdown() to authenticated;

-- Money figures: finance and Super Admin only.
create function public.admin_revenue()
returns table (currency text, last_30_days bigint, all_time bigint, payments int)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_staff(array['finance', 'admin']::public.admin_role[]);
  return query
    select p.currency,
      coalesce(sum(p.amount_minor) filter (where p.reviewed_at > now() - interval '30 days'), 0)::bigint,
      coalesce(sum(p.amount_minor), 0)::bigint,
      count(*)::int
    from public.payments p where p.status = 'successful' group by p.currency;
end;
$$;
revoke execute on function public.admin_revenue() from public, anon;
grant execute on function public.admin_revenue() to authenticated;

create function public.admin_premium_count()
returns int
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_staff(array['finance', 'admin']::public.admin_role[]);
  return (select count(*)::int from public.subscriptions s where s.ends_at > now());
end;
$$;
revoke execute on function public.admin_premium_count() from public, anon;
grant execute on function public.admin_premium_count() to authenticated;
