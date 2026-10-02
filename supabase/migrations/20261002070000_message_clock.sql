-- Use the real clock (not the transaction start) for message ordering and read/hide marks.

create or replace function public.send_message(p_match_id uuid, p_body text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  body text := btrim(coalesce(p_body, ''));
  other uuid;
  mid uuid;
begin
  if me is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if char_length(body) < 1 or char_length(body) > 2000 then
    raise exception 'invalid_message' using errcode = 'check_violation';
  end if;

  select case when m.user_a = me then m.user_b else m.user_a end into other
  from public.matches m
  where m.id = p_match_id and me in (m.user_a, m.user_b);
  if other is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles where id = me and account_status = 'active')
     or not exists (select 1 from public.profiles where id = other and account_status = 'active')
     or exists (
       select 1 from public.blocks b
       where (b.blocker_id = me and b.blocked_id = other) or (b.blocker_id = other and b.blocked_id = me)) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  -- Basic anti-spam: bursts and daily volume.
  if (select count(*) from public.messages where sender_id = me and created_at > now() - interval '1 minute') >= 20
     or (select count(*) from public.messages where sender_id = me and created_at > now() - interval '24 hours') >= 1000 then
    raise exception 'rate_limited' using errcode = 'check_violation';
  end if;

  insert into public.messages (match_id, sender_id, body, created_at) values (p_match_id, me, body, clock_timestamp())
  returning id into mid;

  update public.match_participants
     set last_read_at = clock_timestamp(), seen_at = coalesce(seen_at, clock_timestamp())
   where match_id = p_match_id and user_id = me;
  return mid;
end;
$$;

create or replace function public.mark_conversation_read(p_match_id uuid)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.match_participants
     set last_read_at = clock_timestamp(), seen_at = coalesce(seen_at, clock_timestamp())
   where match_id = p_match_id and user_id = (select auth.uid());
$$;

create or replace function public.hide_conversation(p_match_id uuid)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.match_participants
     set hidden_at = clock_timestamp(), last_read_at = clock_timestamp(), seen_at = coalesce(seen_at, clock_timestamp())
   where match_id = p_match_id and user_id = (select auth.uid());
$$;
