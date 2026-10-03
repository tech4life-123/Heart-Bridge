-- HeartBridge: email notifications. A database outbox + a worker the site calls every few minutes.
-- Privacy: emails never contain message text or profile details, only "someone did something, open the app".

create table public.notification_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email_matches boolean not null default true,
  email_messages boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.notification_settings enable row level security;
revoke all on public.notification_settings from anon, authenticated;

create function public.my_notification_settings()
returns table (email_matches boolean, email_messages boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(s.email_matches, true), coalesce(s.email_messages, true)
  from (select 1) d
  left join public.notification_settings s on s.user_id = (select auth.uid());
$$;
revoke execute on function public.my_notification_settings() from public, anon;
grant execute on function public.my_notification_settings() to authenticated;

create function public.set_notification_settings(p_matches boolean, p_messages boolean)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  insert into public.notification_settings (user_id, email_matches, email_messages)
  values (me, coalesce(p_matches, true), coalesce(p_messages, true))
  on conflict (user_id) do update
    set email_matches = excluded.email_matches, email_messages = excluded.email_messages, updated_at = now();
end;
$$;
revoke execute on function public.set_notification_settings(boolean, boolean) from public, anon;
grant execute on function public.set_notification_settings(boolean, boolean) to authenticated;

create table public.notification_outbox (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('new_match', 'new_message', 'premium_active', 'payment_failed', 'appeal_decided')),
  ref_id uuid,
  payload jsonb not null default '{}'::jsonb,
  send_after timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now()
);
create index notification_outbox_user_idx on public.notification_outbox (user_id);
create index notification_outbox_due_idx on public.notification_outbox (send_after) where sent_at is null;
-- At most one waiting "new message" email per person per conversation.
create unique index notification_outbox_msg_uidx on public.notification_outbox (user_id, ref_id)
  where sent_at is null and kind = 'new_message';
alter table public.notification_outbox enable row level security;
revoke all on public.notification_outbox from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Producers (triggers). They only queue; sending and eligibility checks happen in the worker.
-- ---------------------------------------------------------------------------
create function public.enqueue_new_match()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notification_outbox (user_id, kind, ref_id, send_after)
  values (new.user_a, 'new_match', new.id, now() + interval '1 minute'),
         (new.user_b, 'new_match', new.id, now() + interval '1 minute');
  return new;
end;
$$;
revoke execute on function public.enqueue_new_match() from public, anon, authenticated;
create trigger matches_enqueue_notification after insert on public.matches
  for each row execute function public.enqueue_new_match();

create function public.enqueue_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare other uuid;
begin
  select mp.user_id into other from public.match_participants mp
    where mp.match_id = new.match_id and mp.user_id <> new.sender_id limit 1;
  if other is not null then
    insert into public.notification_outbox (user_id, kind, ref_id, send_after)
    values (other, 'new_message', new.match_id, now() + interval '10 minutes')
    on conflict (user_id, ref_id) where sent_at is null and kind = 'new_message' do nothing;
  end if;
  return new;
end;
$$;
revoke execute on function public.enqueue_new_message() from public, anon, authenticated;
create trigger messages_enqueue_notification after insert on public.messages
  for each row execute function public.enqueue_new_message();

create function public.enqueue_payment_result()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status and new.status in ('successful', 'failed') then
    insert into public.notification_outbox (user_id, kind, ref_id)
    values (new.user_id, case new.status when 'successful' then 'premium_active' else 'payment_failed' end, new.id);
  end if;
  return new;
end;
$$;
revoke execute on function public.enqueue_payment_result() from public, anon, authenticated;
create trigger payments_enqueue_notification after update of status on public.payments
  for each row execute function public.enqueue_payment_result();

create function public.enqueue_appeal_result()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status and new.status in ('granted', 'denied') then
    insert into public.notification_outbox (user_id, kind, ref_id, payload)
    values (new.user_id, 'appeal_decided', new.id, jsonb_build_object('decision', new.status));
  end if;
  return new;
end;
$$;
revoke execute on function public.enqueue_appeal_result() from public, anon, authenticated;
create trigger appeals_enqueue_notification after update of status on public.account_appeals
  for each row execute function public.enqueue_appeal_result();

-- ---------------------------------------------------------------------------
-- Worker API. Called by the site with a shared secret stored in app_settings (key notify_secret).
-- ---------------------------------------------------------------------------
create function public.notify_secret_ok(p_secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_secret is not null and char_length(p_secret) >= 32 and exists (
    select 1 from public.app_settings s
    where s.key = 'notify_secret'
      and extensions.digest(s.value #>> '{}', 'sha256') = extensions.digest(p_secret, 'sha256'));
$$;
revoke execute on function public.notify_secret_ok(text) from public, anon, authenticated;

create function public.outbox_claim(p_secret text, p_limit int default 25)
returns table (id bigint, kind text, to_email text, first_name text, other_name text, payload jsonb)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  r public.notification_outbox;
  em text; fn text; st public.account_status; confirmed timestamptz;
  s_matches boolean; s_messages boolean; oname text; skip text; extra jsonb;
begin
  if not public.notify_secret_ok(p_secret) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  for r in
    select o.* from public.notification_outbox o
    where o.sent_at is null and o.send_after <= now() and o.attempts < 5
      and (o.claimed_at is null or o.claimed_at < now() - interval '10 minutes')
    order by o.send_after
    limit least(greatest(p_limit, 1), 50)
    for update skip locked
  loop
    skip := null; oname := null; extra := r.payload;
    select u.email, u.email_confirmed_at into em, confirmed from auth.users u where u.id = r.user_id;
    select p.first_name, p.account_status into fn, st from public.profiles p where p.id = r.user_id;
    select coalesce(ns.email_matches, true), coalesce(ns.email_messages, true) into s_matches, s_messages
      from (select 1) d left join public.notification_settings ns on ns.user_id = r.user_id;

    if em is null or confirmed is null or fn is null then
      skip := 'no_email';
    elsif r.kind in ('new_match', 'new_message') and st <> 'active' then
      skip := 'inactive';
    elsif r.kind = 'new_match' then
      if not s_matches then skip := 'opted_out';
      elsif exists (select 1 from public.match_participants mp where mp.match_id = r.ref_id and mp.user_id = r.user_id and mp.seen_at is not null) then skip := 'already_seen';
      end if;
      select p.first_name into oname from public.match_participants mp join public.profiles p on p.id = mp.user_id
        where mp.match_id = r.ref_id and mp.user_id <> r.user_id limit 1;
    elsif r.kind = 'new_message' then
      if not s_messages then skip := 'opted_out';
      elsif not exists (
        select 1 from public.messages m
        join public.match_participants mp on mp.match_id = m.match_id and mp.user_id = r.user_id
        where m.match_id = r.ref_id and m.sender_id <> r.user_id
          and (mp.last_read_at is null or m.created_at > mp.last_read_at)) then skip := 'already_read';
      end if;
      select p.first_name into oname from public.match_participants mp join public.profiles p on p.id = mp.user_id
        where mp.match_id = r.ref_id and mp.user_id <> r.user_id limit 1;
      if exists (select 1 from public.blocks b where (b.blocker_id = r.user_id and b.blocked_id in (select mp.user_id from public.match_participants mp where mp.match_id = r.ref_id and mp.user_id <> r.user_id))
                 or (b.blocked_id = r.user_id and b.blocker_id in (select mp.user_id from public.match_participants mp where mp.match_id = r.ref_id and mp.user_id <> r.user_id))) then
        skip := 'blocked';
      end if;
    elsif r.kind = 'premium_active' then
      select jsonb_build_object('until', s.ends_at) into extra from public.subscriptions s where s.user_id = r.user_id;
    end if;

    if skip is not null then
      update public.notification_outbox o set sent_at = now(), last_error = 'skipped:' || skip where o.id = r.id;
    else
      update public.notification_outbox o set claimed_at = now(), attempts = o.attempts + 1 where o.id = r.id;
      id := r.id; kind := r.kind; to_email := em; first_name := fn; other_name := oname; payload := coalesce(extra, '{}'::jsonb);
      return next;
    end if;
  end loop;
end;
$$;
revoke execute on function public.outbox_claim(text, int) from public;
grant execute on function public.outbox_claim(text, int) to anon, authenticated;

create function public.outbox_finish(p_secret text, p_id bigint, p_ok boolean, p_error text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.notify_secret_ok(p_secret) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_ok then
    update public.notification_outbox set sent_at = now(), last_error = null where id = p_id;
  else
    update public.notification_outbox set claimed_at = null, last_error = left(coalesce(p_error, 'failed'), 200) where id = p_id;
  end if;
end;
$$;
revoke execute on function public.outbox_finish(text, bigint, boolean, text) from public;
grant execute on function public.outbox_finish(text, bigint, boolean, text) to anon, authenticated;
