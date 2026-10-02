-- HeartBridge Phase 4: discovery.
-- Who can see whom is decided in ONE place (can_view_profile): both accounts
-- active and onboarded, mutual gender/age preferences, the target's "where I
-- appear" settings, and no block in either direction. Photos, likes and saves
-- all go through it. Other people's raw data is never readable; the client only
-- receives a safe "profile card" (age, not date of birth; approximate place).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function public.age_years(d date)
returns int
language sql
stable
set search_path = ''
as $$ select date_part('year', age(current_date, d))::int $$;

revoke execute on function public.age_years(date) from public, anon;
grant execute on function public.age_years(date) to authenticated;

-- ---------------------------------------------------------------------------
-- blocks (UI arrives in Phase 6; discovery already respects it)
-- ---------------------------------------------------------------------------
create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on public.blocks (blocked_id);

alter table public.blocks enable row level security;
revoke all on public.blocks from anon, authenticated;
grant select, insert, delete on public.blocks to authenticated;

create policy blocks_select_own on public.blocks
  for select to authenticated using (blocker_id = (select auth.uid()));
create policy blocks_insert_own on public.blocks
  for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy blocks_delete_own on public.blocks
  for delete to authenticated using (blocker_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Visibility gate
-- ---------------------------------------------------------------------------
create function public.can_view_profile(p_target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles v
    join public.preferences vp on vp.user_id = v.id
    join public.profiles t on t.id = p_target
    join public.preferences tp on tp.user_id = t.id
    left join public.locations vc on vc.id = v.country_id
    where v.id = (select auth.uid())
      and t.id <> v.id
      and v.account_status = 'active' and t.account_status = 'active'
      and v.onboarding_completed_at is not null and t.onboarding_completed_at is not null
      and v.gender is not null and t.gender is not null
      and t.gender = any (vp.seeking_genders)
      and v.gender = any (tp.seeking_genders)
      and public.age_years(t.date_of_birth) between vp.age_min and vp.age_max
      and public.age_years(v.date_of_birth) between tp.age_min and tp.age_max
      and v.country_id is not null and t.country_id is not null
      and case
            when v.country_id <> t.country_id then tp.appear_diaspora
            when vc.iso_code = 'LR' then
              case when v.region_id is not null and v.region_id = t.region_id
                   then (tp.appear_local or tp.appear_liberia)
                   else tp.appear_liberia end
            else tp.appear_local
          end
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = v.id and b.blocked_id = t.id)
           or (b.blocker_id = t.id and b.blocked_id = v.id)
      )
  );
$$;

revoke execute on function public.can_view_profile(uuid) from public, anon;
grant execute on function public.can_view_profile(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- likes / passes / saved_profiles
-- ---------------------------------------------------------------------------
create table public.likes (
  liker_id uuid not null references public.profiles (id) on delete cascade,
  liked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (liker_id, liked_id),
  constraint likes_not_self check (liker_id <> liked_id)
);
create index likes_liked_idx on public.likes (liked_id);
create index likes_liker_created_idx on public.likes (liker_id, created_at desc);

alter table public.likes enable row level security;
revoke all on public.likes from anon, authenticated;
grant select, insert on public.likes to authenticated;

-- A user only ever reads the likes they SENT. Received likes and matches are
-- exposed through functions in Phase 5.
create policy likes_select_sent on public.likes
  for select to authenticated using (liker_id = (select auth.uid()));
create policy likes_insert_own on public.likes
  for insert to authenticated
  with check (liker_id = (select auth.uid()) and (select public.can_view_profile(liked_id)));

insert into public.app_settings (key, value, is_public, description)
values ('daily_like_limit', '50', false, 'Likes one user can send per rolling 24 hours (anti-spam)')
on conflict (key) do nothing;

create function public.likes_enforce_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  lim int;
  n int;
begin
  select (value #>> '{}')::int into lim from public.app_settings where key = 'daily_like_limit';
  lim := coalesce(lim, 50);
  select count(*) into n from public.likes
   where liker_id = new.liker_id and created_at > now() - interval '24 hours';
  if n >= lim then
    raise exception 'daily_like_limit' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
revoke execute on function public.likes_enforce_limit() from public, anon, authenticated;

create trigger likes_limit
  before insert on public.likes
  for each row execute function public.likes_enforce_limit();

create table public.passes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, target_id),
  constraint passes_not_self check (user_id <> target_id)
);

alter table public.passes enable row level security;
revoke all on public.passes from anon, authenticated;
grant select, insert, delete on public.passes to authenticated;

create policy passes_select_own on public.passes
  for select to authenticated using (user_id = (select auth.uid()));
create policy passes_insert_own on public.passes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy passes_delete_own on public.passes
  for delete to authenticated using (user_id = (select auth.uid()));

create table public.saved_profiles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  saved_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, saved_id),
  constraint saved_not_self check (user_id <> saved_id)
);

alter table public.saved_profiles enable row level security;
revoke all on public.saved_profiles from anon, authenticated;
grant select, insert, delete on public.saved_profiles to authenticated;

create policy saved_select_own on public.saved_profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy saved_insert_own on public.saved_profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.can_view_profile(saved_id)));
create policy saved_delete_own on public.saved_profiles
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Compatibility questionnaire (short, optional, expandable by admins)
-- ---------------------------------------------------------------------------
create table public.compatibility_questions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9_]{2,40}$'),
  category text not null check (char_length(category) between 2 and 40),
  prompt text not null check (char_length(prompt) between 5 and 200),
  kind text not null check (kind in ('ordinal', 'categorical')),
  -- [{"value": 1, "label": "..."}, ...]; ordinal options are in increasing order
  options jsonb not null
    check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 8),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.compatibility_questions enable row level security;
revoke all on public.compatibility_questions from anon, authenticated;
grant select, insert, update, delete on public.compatibility_questions to authenticated;

create policy cq_select_active on public.compatibility_questions
  for select to authenticated using (is_active or (select public.is_admin()));
create policy cq_admin_insert on public.compatibility_questions
  for insert to authenticated with check ((select public.is_admin()));
create policy cq_admin_update on public.compatibility_questions
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy cq_admin_delete on public.compatibility_questions
  for delete to authenticated using ((select public.is_admin()));

create table public.compatibility_answers (
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.compatibility_questions (id) on delete cascade,
  value smallint not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create function public.compatibility_answers_validate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.compatibility_questions q, jsonb_array_elements(q.options) o
    where q.id = new.question_id and (o ->> 'value')::int = new.value
  ) then
    raise exception 'invalid_answer' using errcode = 'check_violation';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger compatibility_answers_validate_trg
  before insert or update on public.compatibility_answers
  for each row execute function public.compatibility_answers_validate();

alter table public.compatibility_answers enable row level security;
revoke all on public.compatibility_answers from anon, authenticated;
grant select, insert, delete on public.compatibility_answers to authenticated;
grant update (value) on public.compatibility_answers to authenticated;

-- Answers are private: only the owner can read them. Other people only ever
-- receive an aggregate similarity number (see profile_cards).
create policy ca_select_own on public.compatibility_answers
  for select to authenticated using (user_id = (select auth.uid()));
create policy ca_insert_own on public.compatibility_answers
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy ca_update_own on public.compatibility_answers
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy ca_delete_own on public.compatibility_answers
  for delete to authenticated using (user_id = (select auth.uid()));

-- None of these questions touch religion, ethnicity or other protected attributes.
insert into public.compatibility_questions (slug, category, prompt, kind, options, sort_order) values
  ('communication', 'Communication', 'How often do you like to stay in touch?', 'ordinal',
   '[{"value":1,"label":"A few times a week"},{"value":2,"label":"Once a day"},{"value":3,"label":"A few times a day"},{"value":4,"label":"All day, I love chatting"}]', 1),
  ('weekend', 'Lifestyle', 'What does your ideal weekend look like?', 'categorical',
   '[{"value":1,"label":"Quiet time at home"},{"value":2,"label":"Time with family"},{"value":3,"label":"Out with friends"},{"value":4,"label":"Music, sports or events"},{"value":5,"label":"Exploring or travelling"}]', 2),
  ('family', 'Family', 'How important is family involvement in your relationship?', 'ordinal',
   '[{"value":1,"label":"Not very important"},{"value":2,"label":"Somewhat important"},{"value":3,"label":"Very important"},{"value":4,"label":"Essential"}]', 3),
  ('relocation', 'Future', 'Would you consider relocating for the right person?', 'ordinal',
   '[{"value":1,"label":"No"},{"value":2,"label":"Maybe"},{"value":3,"label":"Yes"}]', 4),
  ('social', 'Personality', 'How social are you?', 'ordinal',
   '[{"value":1,"label":"I prefer quiet and small circles"},{"value":2,"label":"A healthy balance"},{"value":3,"label":"Very social and outgoing"}]', 5),
  ('values', 'Values', 'Which quality matters most to you in a partner?', 'categorical',
   '[{"value":1,"label":"Honesty"},{"value":2,"label":"Kindness"},{"value":3,"label":"Ambition"},{"value":4,"label":"Loyalty"},{"value":5,"label":"Sense of humour"},{"value":6,"label":"Family-minded"}]', 6)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Profile card: the ONLY shape in which other people's profiles leave the database.
-- No date of birth, no phone/email, no coordinates, no neighbourhood.
-- ---------------------------------------------------------------------------
create type public.profile_card as (
  id uuid,
  first_name text,
  age int,
  gender public.gender,
  bio text,
  occupation text,
  education text,
  languages text[],
  smoking public.habit_frequency,
  drinking public.habit_frequency,
  children_preference public.children_preference,
  intention_primary public.relationship_intention,
  intentions_extra public.relationship_intention[],
  place text,
  proximity smallint,          -- 3 same city, 2 same county, 1 same country, 0 elsewhere (relative to the viewer)
  interest_ids uuid[],
  photo_paths text[],          -- storage paths, ordered; the caller signs them (policy below)
  qa_similarity numeric,       -- 0..1 over questions both answered, null if none
  qa_count int,
  is_liked boolean,
  is_saved boolean,
  is_passed boolean
);

create function public.profile_cards(p_ids uuid[])
returns setof public.profile_card
language sql
stable
security definer
set search_path = ''
as $$
  select
    t.id,
    t.first_name,
    public.age_years(t.date_of_birth),
    t.gender,
    t.bio,
    t.occupation,
    t.education,
    t.languages,
    t.smoking,
    t.drinking,
    t.children_preference,
    t.intention_primary,
    t.intentions_extra,
    nullif(concat_ws(', ',
      coalesce(ci.name, t.city_other),
      case when co.iso_code = 'LR' then coalesce(re.name, co.name) else co.name end), ''),
    (case
       when v.city_id is not null and v.city_id = t.city_id then 3
       when v.region_id is not null and v.region_id = t.region_id then 2
       when v.country_id = t.country_id then 1
       else 0
     end)::smallint,
    coalesce((select array_agg(ui.interest_id) from public.user_interests ui where ui.user_id = t.id), '{}'),
    coalesce((select array_agg(pp.storage_path order by pp.position)
                from public.profile_photos pp where pp.user_id = t.id), '{}'),
    case when qa.n > 0 then round(qa.sim, 3) end,
    coalesce(qa.n, 0),
    exists (select 1 from public.likes l where l.liker_id = v.id and l.liked_id = t.id),
    exists (select 1 from public.saved_profiles s where s.user_id = v.id and s.saved_id = t.id),
    exists (select 1 from public.passes p where p.user_id = v.id and p.target_id = t.id)
  from unnest(p_ids) with ordinality as u (id, ord)
  join public.profiles t on t.id = u.id
  join public.profiles v on v.id = (select auth.uid())
  left join public.locations ci on ci.id = t.city_id
  left join public.locations re on re.id = t.region_id
  left join public.locations co on co.id = t.country_id
  left join lateral (
    select
      avg(case when q.kind = 'ordinal'
               then 1 - abs(a.value - b.value)::numeric / nullif(r.span, 0)
               else (a.value = b.value)::int::numeric end) as sim,
      count(*)::int as n
    from public.compatibility_answers a
    join public.compatibility_answers b on b.question_id = a.question_id and b.user_id = t.id
    join public.compatibility_questions q on q.id = a.question_id and q.is_active
    cross join lateral (
      select max((o ->> 'value')::int) - min((o ->> 'value')::int) as span
      from jsonb_array_elements(q.options) o
    ) r
    where a.user_id = v.id
  ) qa on true
  where public.can_view_profile(t.id)
  order by u.ord;
$$;

revoke execute on function public.profile_cards(uuid[]) from public, anon;
grant execute on function public.profile_cards(uuid[]) to authenticated;

-- Recommended pool: filtered, deterministic per viewer per day. The application
-- scores and orders this pool (explainable scoring lives in TypeScript).
create function public.discover_profiles(
  p_age_min int default null,
  p_age_max int default null,
  p_genders public.gender[] default null,
  p_country_id uuid default null,
  p_region_id uuid default null,
  p_city_id uuid default null,
  p_community_id uuid default null,
  p_intentions public.relationship_intention[] default null,
  p_interest_ids uuid[] default null,
  p_children public.children_preference[] default null,
  p_smoking public.habit_frequency[] default null,
  p_drinking public.habit_frequency[] default null,
  p_limit int default 60
)
returns setof public.profile_card
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  ids uuid[];
begin
  if uid is null then
    return;
  end if;

  select coalesce(array_agg(x.id order by x.h), '{}') into ids
  from (
    select t.id, md5(uid::text || t.id::text || current_date::text) as h
    from public.profiles t
    join public.preferences vp on vp.user_id = uid
    where t.id <> uid
      and public.can_view_profile(t.id)
      and not exists (select 1 from public.likes l where l.liker_id = uid and l.liked_id = t.id)
      and not exists (select 1 from public.passes p where p.user_id = uid and p.target_id = t.id)
      and public.age_years(t.date_of_birth) between coalesce(p_age_min, vp.age_min) and coalesce(p_age_max, vp.age_max)
      and (p_genders is null or t.gender = any (p_genders))
      and (p_country_id is null or t.country_id = p_country_id)
      and (p_region_id is null or t.region_id = p_region_id)
      and (p_city_id is null or t.city_id = p_city_id)
      and (p_community_id is null or t.community_id = p_community_id)
      and (p_intentions is null or t.intention_primary = any (p_intentions) or t.intentions_extra && p_intentions)
      and (p_interest_ids is null or exists (
            select 1 from public.user_interests ui
            where ui.user_id = t.id and ui.interest_id = any (p_interest_ids)))
      and (p_children is null or t.children_preference = any (p_children))
      and (p_smoking is null or t.smoking = any (p_smoking))
      and (p_drinking is null or t.drinking = any (p_drinking))
    order by h
    limit least(greatest(coalesce(p_limit, 60), 1), 100)
  ) x;

  return query select * from public.profile_cards(ids);
end;
$$;

revoke execute on function public.discover_profiles(int, int, public.gender[], uuid, uuid, uuid, uuid,
  public.relationship_intention[], uuid[], public.children_preference[], public.habit_frequency[],
  public.habit_frequency[], int) from public, anon;
grant execute on function public.discover_profiles(int, int, public.gender[], uuid, uuid, uuid, uuid,
  public.relationship_intention[], uuid[], public.children_preference[], public.habit_frequency[],
  public.habit_frequency[], int) to authenticated;

-- ---------------------------------------------------------------------------
-- Photos of discoverable people can be signed by the viewer's own session.
-- ---------------------------------------------------------------------------
create policy profile_photos_read_discoverable on storage.objects
  for select to authenticated
  using (
    bucket_id = 'profile-photos'
    and case
          when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then (select public.can_view_profile(((storage.foldername(name))[1])::uuid))
          else false
        end
  );
