-- HeartBridge Phase 5: mutual matches and private chat.
-- Rules enforced here, not in the app:
--   * a match exists only when BOTH people liked each other (created by trigger);
--   * only the two matched people can read a match or its messages;
--   * messages are written only through send_message() (match, block, status and
--     rate-limit checks); nobody can message someone they have not matched with;
--   * "delete conversation" hides history from ONE person's view only;
--   * the other person's data leaves the database only through the functions below
--     (first name, age, first photo path) - never phone, email or birth date.

-- ---------------------------------------------------------------------------
-- matches / per-person state
-- ---------------------------------------------------------------------------
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint matches_ordered check (user_a < user_b),
  constraint matches_pair_uniq unique (user_a, user_b)
);
create index matches_user_b_idx on public.matches (user_b);

create table public.match_participants (
  match_id uuid not null references public.matches (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  seen_at timestamptz,            -- when the "It's a Match!" screen was opened
  last_read_at timestamptz,       -- messages up to here are read
  hidden_at timestamptz,          -- history before this is removed from MY view only
  primary key (match_id, user_id)
);
create index match_participants_user_idx on public.match_participants (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null constraint messages_body_len check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index messages_match_created_idx on public.messages (match_id, created_at desc);
create index messages_sender_created_idx on public.messages (sender_id, created_at desc);

alter table public.matches enable row level security;
alter table public.match_participants enable row level security;
alter table public.messages enable row level security;

revoke all on public.matches, public.match_participants, public.messages from anon, authenticated;
grant select on public.matches, public.match_participants, public.messages to authenticated;

create policy matches_select_own on public.matches
  for select to authenticated
  using ((select auth.uid()) in (user_a, user_b));

create policy match_participants_select_own on public.match_participants
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Messages: only participants, and only what is newer than their own "delete" mark.
create policy messages_select_participant on public.messages
  for select to authenticated
  using (exists (
    select 1 from public.match_participants mp
    where mp.match_id = messages.match_id
      and mp.user_id = (select auth.uid())
      and (mp.hidden_at is null or messages.created_at > mp.hidden_at)
  ));
-- No insert/update/delete policies or grants: writes go through send_message().

-- ---------------------------------------------------------------------------
-- Mutual like -> match
-- ---------------------------------------------------------------------------
create function public.likes_make_match()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  mid uuid;
begin
  if exists (select 1 from public.likes l where l.liker_id = new.liked_id and l.liked_id = new.liker_id) then
    insert into public.matches (user_a, user_b)
    values (least(new.liker_id, new.liked_id), greatest(new.liker_id, new.liked_id))
    on conflict (user_a, user_b) do nothing
    returning id into mid;
    if mid is not null then
      insert into public.match_participants (match_id, user_id)
      values (mid, new.liker_id), (mid, new.liked_id);
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.likes_make_match() from public, anon, authenticated;

create trigger likes_make_match
  after insert on public.likes
  for each row execute function public.likes_make_match();

-- Backfill: likes that were already mutual before this migration.
with pairs as (
  select least(l1.liker_id, l1.liked_id) as a, greatest(l1.liker_id, l1.liked_id) as b
  from public.likes l1
  join public.likes l2 on l2.liker_id = l1.liked_id and l2.liked_id = l1.liker_id
  group by 1, 2
), ins as (
  insert into public.matches (user_a, user_b)
  select a, b from pairs
  on conflict (user_a, user_b) do nothing
  returning id, user_a, user_b
)
insert into public.match_participants (match_id, user_id)
select id, user_a from ins
union all
select id, user_b from ins;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function public.are_matched(p_other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.matches m
    where m.user_a = least((select auth.uid()), p_other)
      and m.user_b = greatest((select auth.uid()), p_other)
      and (select auth.uid()) is not null
      and (select auth.uid()) <> p_other
  ) and not exists (
    select 1 from public.blocks b
    where (b.blocker_id = (select auth.uid()) and b.blocked_id = p_other)
       or (b.blocker_id = p_other and b.blocked_id = (select auth.uid()))
  );
$$;
revoke execute on function public.are_matched(uuid) from public, anon;
grant execute on function public.are_matched(uuid) to authenticated;

-- Matched people may sign each other's photos even if discovery preferences changed later.
create policy profile_photos_read_matched on storage.objects
  for select to authenticated
  using (
    bucket_id = 'profile-photos'
    and case
          when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then (select public.are_matched(((storage.foldername(name))[1])::uuid))
          else false
        end
  );

create function public.match_id_with(p_other uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.id from public.matches m
  where m.user_a = least((select auth.uid()), p_other)
    and m.user_b = greatest((select auth.uid()), p_other)
    and (select auth.uid()) <> p_other;
$$;
revoke execute on function public.match_id_with(uuid) from public, anon;
grant execute on function public.match_id_with(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Reading: the list, one chat header, unread counters
-- ---------------------------------------------------------------------------
create function public.my_matches()
returns table (
  match_id uuid,
  matched_at timestamptz,
  other_id uuid,
  first_name text,
  age int,
  photo_path text,
  last_body text,
  last_at timestamptz,
  last_sender uuid,
  unread int,
  is_new boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    m.id, m.created_at, o.id, o.first_name, public.age_years(o.date_of_birth),
    (select pp.storage_path from public.profile_photos pp where pp.user_id = o.id order by pp.position limit 1),
    lm.body, lm.created_at, lm.sender_id,
    (select count(*)::int from public.messages x
      where x.match_id = m.id and x.sender_id = o.id
        and x.created_at > coalesce(mp.last_read_at, '-infinity')
        and x.created_at > coalesce(mp.hidden_at, '-infinity')),
    mp.seen_at is null
  from public.match_participants mp
  join public.matches m on m.id = mp.match_id
  join public.profiles o on o.id = case when m.user_a = mp.user_id then m.user_b else m.user_a end
  left join lateral (
    select x.body, x.created_at, x.sender_id from public.messages x
    where x.match_id = m.id and x.created_at > coalesce(mp.hidden_at, '-infinity')
    order by x.created_at desc limit 1
  ) lm on true
  where mp.user_id = (select auth.uid())
    and o.account_status = 'active'
    and o.first_name is not null
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = mp.user_id and b.blocked_id = o.id)
         or (b.blocker_id = o.id and b.blocked_id = mp.user_id)
    )
    and (mp.hidden_at is null or lm.created_at is not null)
  order by coalesce(lm.created_at, m.created_at) desc
  limit 200;
$$;
revoke execute on function public.my_matches() from public, anon;
grant execute on function public.my_matches() to authenticated;

create function public.chat_meta(p_match_id uuid)
returns table (
  other_id uuid,
  first_name text,
  age int,
  photo_path text,
  other_last_read_at timestamptz,
  can_message boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    o.id, o.first_name, public.age_years(o.date_of_birth),
    (select pp.storage_path from public.profile_photos pp where pp.user_id = o.id order by pp.position limit 1),
    op.last_read_at,
    (o.account_status = 'active' and me.account_status = 'active'
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = me.id and b.blocked_id = o.id)
           or (b.blocker_id = o.id and b.blocked_id = me.id)))
  from public.match_participants mp
  join public.matches m on m.id = mp.match_id
  join public.profiles me on me.id = mp.user_id
  join public.profiles o on o.id = case when m.user_a = mp.user_id then m.user_b else m.user_a end
  join public.match_participants op on op.match_id = m.id and op.user_id = o.id
  where mp.match_id = p_match_id and mp.user_id = (select auth.uid());
$$;
revoke execute on function public.chat_meta(uuid) from public, anon;
grant execute on function public.chat_meta(uuid) to authenticated;

create function public.unread_summary()
returns table (unread_messages int, new_matches int)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(sum((select count(*) from public.messages x
      where x.match_id = mp.match_id and x.sender_id <> mp.user_id
        and x.created_at > coalesce(mp.last_read_at, '-infinity')
        and x.created_at > coalesce(mp.hidden_at, '-infinity'))), 0)::int,
    (count(*) filter (where mp.seen_at is null))::int
  from public.match_participants mp
  join public.matches m on m.id = mp.match_id
  join public.profiles o on o.id = case when m.user_a = mp.user_id then m.user_b else m.user_a end
  where mp.user_id = (select auth.uid())
    and o.account_status = 'active'
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = mp.user_id and b.blocked_id = o.id)
         or (b.blocker_id = o.id and b.blocked_id = mp.user_id));
$$;
revoke execute on function public.unread_summary() from public, anon;
grant execute on function public.unread_summary() to authenticated;

-- ---------------------------------------------------------------------------
-- Writing: send, read marks, delete-from-my-view
-- ---------------------------------------------------------------------------
create function public.send_message(p_match_id uuid, p_body text)
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

  insert into public.messages (match_id, sender_id, body) values (p_match_id, me, body)
  returning id into mid;

  update public.match_participants
     set last_read_at = now(), seen_at = coalesce(seen_at, now())
   where match_id = p_match_id and user_id = me;
  return mid;
end;
$$;
revoke execute on function public.send_message(uuid, text) from public, anon;
grant execute on function public.send_message(uuid, text) to authenticated;

create function public.mark_conversation_read(p_match_id uuid)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.match_participants
     set last_read_at = now(), seen_at = coalesce(seen_at, now())
   where match_id = p_match_id and user_id = (select auth.uid());
$$;
revoke execute on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

create function public.mark_match_seen(p_match_id uuid)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.match_participants
     set seen_at = coalesce(seen_at, now())
   where match_id = p_match_id and user_id = (select auth.uid());
$$;
revoke execute on function public.mark_match_seen(uuid) from public, anon;
grant execute on function public.mark_match_seen(uuid) to authenticated;

create function public.hide_conversation(p_match_id uuid)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.match_participants
     set hidden_at = now(), last_read_at = now(), seen_at = coalesce(seen_at, now())
   where match_id = p_match_id and user_id = (select auth.uid());
$$;
revoke execute on function public.hide_conversation(uuid) from public, anon;
grant execute on function public.hide_conversation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: new messages and new matches reach only people RLS allows.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
    alter publication supabase_realtime add table public.match_participants;
  end if;
end $$;
