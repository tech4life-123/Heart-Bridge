-- HeartBridge: member feedback (bugs, ideas, praise) with a staff inbox.

create type public.feedback_category as enum ('bug', 'idea', 'praise', 'safety_concern', 'other');
create type public.feedback_status as enum ('new', 'reviewed', 'done');

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  category public.feedback_category not null,
  rating smallint check (rating is null or rating between 1 and 5),
  message text not null check (char_length(btrim(message)) between 10 and 1000),
  page text check (page is null or char_length(page) <= 100),
  status public.feedback_status not null default 'new',
  handled_by uuid references auth.users (id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
create index feedback_user_idx on public.feedback (user_id);
create index feedback_handler_idx on public.feedback (handled_by);
create index feedback_status_idx on public.feedback (status, created_at desc);
alter table public.feedback enable row level security;
revoke all on public.feedback from anon, authenticated;

-- Members can send feedback; 5 a day. Feedback is not an emergency channel: safety problems go to Report.
create function public.submit_feedback(p_category public.feedback_category, p_message text, p_rating int, p_page text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  m text := btrim(coalesce(p_message, ''));
  pg text := left(btrim(coalesce(p_page, '')), 100);
  fid uuid;
begin
  if me is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if char_length(m) < 10 or char_length(m) > 1000 or (p_rating is not null and p_rating not between 1 and 5) then
    raise exception 'invalid_feedback' using errcode = 'check_violation';
  end if;
  if (select count(*) from public.feedback where user_id = me and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'rate_limited' using errcode = 'check_violation';
  end if;
  insert into public.feedback (user_id, category, rating, message, page)
  values (me, p_category, p_rating::smallint, m, nullif(pg, ''))
  returning id into fid;
  return fid;
end;
$$;
revoke execute on function public.submit_feedback(public.feedback_category, text, int, text) from public, anon;
grant execute on function public.submit_feedback(public.feedback_category, text, int, text) to authenticated;

create function public.admin_feedback_queue(p_status public.feedback_status default 'new', p_limit int default 50)
returns table (id uuid, user_id uuid, first_name text, category public.feedback_category, rating smallint,
               message text, page text, status public.feedback_status, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_staff(array['moderator', 'admin', 'support']::public.admin_role[]);
  return query
    select f.id, f.user_id, p.first_name, f.category, f.rating, f.message, f.page, f.status, f.created_at
    from public.feedback f left join public.profiles p on p.id = f.user_id
    where f.status = p_status
    order by f.created_at desc
    limit least(greatest(p_limit, 1), 100);
end;
$$;
revoke execute on function public.admin_feedback_queue(public.feedback_status, int) from public, anon;
grant execute on function public.admin_feedback_queue(public.feedback_status, int) to authenticated;

create function public.admin_set_feedback_status(p_id uuid, p_status public.feedback_status)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.require_staff(array['moderator', 'admin', 'support']::public.admin_role[]);
  update public.feedback
    set status = p_status, handled_by = (select auth.uid()), handled_at = now()
    where id = p_id;
  if not found then
    raise exception 'not_found' using errcode = 'no_data_found';
  end if;
  perform public.write_audit('set_feedback_status', 'feedback', p_id::text, jsonb_build_object('status', p_status));
end;
$$;
revoke execute on function public.admin_set_feedback_status(uuid, public.feedback_status) from public, anon;
grant execute on function public.admin_set_feedback_status(uuid, public.feedback_status) to authenticated;

create function public.admin_feedback_summary()
returns table (total int, new_count int, avg_rating numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_staff(array['moderator', 'admin', 'support']::public.admin_role[]);
  return query
    select count(*)::int, (count(*) filter (where f.status = 'new'))::int, round(avg(f.rating), 1)
    from public.feedback f;
end;
$$;
revoke execute on function public.admin_feedback_summary() from public, anon;
grant execute on function public.admin_feedback_summary() to authenticated;
