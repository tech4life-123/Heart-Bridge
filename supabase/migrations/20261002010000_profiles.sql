-- HeartBridge Phase 3: profiles, locations, interests, preferences, photos.
-- Same security model as the foundation: RLS on every table, minimum grants,
-- column-level update grants, sensitive transitions only via triggers/functions.
-- Viewing OTHER users' profiles/photos is NOT enabled here; it arrives with
-- discovery (Phase 4) together with block, age and visibility rules.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.gender as enum ('man', 'woman', 'non_binary');
create type public.relationship_intention as enum (
  'serious_relationship', 'marriage', 'dating', 'friendship', 'getting_to_know'
);
create type public.location_kind as enum ('country', 'region', 'city', 'community');
create type public.children_preference as enum (
  'have_children', 'want_children', 'open_to_children', 'no_children', 'prefer_not_to_say'
);
create type public.habit_frequency as enum ('never', 'sometimes', 'often', 'prefer_not_to_say');

-- ---------------------------------------------------------------------------
-- locations: Country > Region/County > City/Town > Community.
-- Stored in the database so admins can extend it without a deploy.
-- Reference data: readable by signed-in users; only admins can change it.
-- ---------------------------------------------------------------------------
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.locations (id) on delete restrict,
  kind public.location_kind not null,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  iso_code text check (iso_code is null or iso_code ~ '^[A-Z]{2}$'),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_country_has_no_parent check ((kind = 'country') = (parent_id is null))
);

create unique index locations_slug_root_uidx on public.locations (slug) where parent_id is null;
create unique index locations_slug_child_uidx on public.locations (parent_id, slug) where parent_id is not null;
create index locations_parent_idx on public.locations (parent_id, sort_order, name);

create function public.locations_validate()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_kind public.location_kind;
begin
  if new.parent_id is not null then
    select kind into parent_kind from public.locations where id = new.parent_id;
    if (new.kind = 'region' and parent_kind is distinct from 'country')
       or (new.kind = 'city' and parent_kind is distinct from 'region')
       or (new.kind = 'community' and parent_kind is distinct from 'city') then
      raise exception 'invalid_location_hierarchy' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger locations_validate_trg
  before insert or update of parent_id, kind on public.locations
  for each row execute function public.locations_validate();

create trigger locations_set_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

alter table public.locations enable row level security;
revoke all on public.locations from anon, authenticated;
grant select on public.locations to authenticated;
grant insert, update, delete on public.locations to authenticated; -- gated by admin-only policies

create policy locations_select_active on public.locations
  for select to authenticated
  using (is_active or (select public.is_admin()));
create policy locations_insert_admin on public.locations
  for insert to authenticated
  with check ((select public.is_admin()));
create policy locations_update_admin on public.locations
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy locations_delete_admin on public.locations
  for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- interests (reference data) and user_interests
-- ---------------------------------------------------------------------------
create table public.interests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label text not null check (char_length(btrim(label)) between 1 and 40),
  category text not null check (char_length(btrim(category)) between 1 and 40),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.interests enable row level security;
revoke all on public.interests from anon, authenticated;
grant select on public.interests to authenticated;
grant insert, update, delete on public.interests to authenticated; -- admin-only policies

create policy interests_select_active on public.interests
  for select to authenticated
  using (is_active or (select public.is_admin()));
create policy interests_insert_admin on public.interests
  for insert to authenticated with check ((select public.is_admin()));
create policy interests_update_admin on public.interests
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy interests_delete_admin on public.interests
  for delete to authenticated using ((select public.is_admin()));

create table public.user_interests (
  user_id uuid not null references public.profiles (id) on delete cascade,
  interest_id uuid not null references public.interests (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, interest_id)
);
create index user_interests_interest_idx on public.user_interests (interest_id);

create function public.user_interests_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.user_interests where user_id = new.user_id) >= 10 then
    raise exception 'too_many_interests' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger user_interests_limit_trg
  before insert on public.user_interests
  for each row execute function public.user_interests_limit();

alter table public.user_interests enable row level security;
revoke all on public.user_interests from anon, authenticated;
grant select, insert, delete on public.user_interests to authenticated;

create policy user_interests_select_own on public.user_interests
  for select to authenticated using (user_id = (select auth.uid()));
create policy user_interests_insert_own on public.user_interests
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy user_interests_delete_own on public.user_interests
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- profiles: extend with the Phase 3 fields. Everything is nullable so the
-- signup trigger keeps working; completeness is enforced by complete_onboarding().
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column gender public.gender,
  add column bio text
    constraint profiles_bio_length check (bio is null or char_length(bio) <= 500),
  add column occupation text
    constraint profiles_occupation_length check (occupation is null or char_length(occupation) <= 80),
  add column education text
    constraint profiles_education_length check (education is null or char_length(education) <= 80),
  add column languages text[] not null default '{}'
    constraint profiles_languages_limit check (cardinality(languages) <= 10),
  add column smoking public.habit_frequency,
  add column drinking public.habit_frequency,
  add column children_preference public.children_preference,
  add column intention_primary public.relationship_intention,
  add column intentions_extra public.relationship_intention[] not null default '{}'
    constraint profiles_intentions_extra_limit check (cardinality(intentions_extra) <= 4),
  add column country_id uuid references public.locations (id),
  add column region_id uuid references public.locations (id),
  add column city_id uuid references public.locations (id),
  add column community_id uuid references public.locations (id),
  add column city_other text
    constraint profiles_city_other_length check (city_other is null or char_length(btrim(city_other)) between 1 and 60),
  add column onboarding_step smallint not null default 0
    constraint profiles_onboarding_step_range check (onboarding_step between 0 and 10),
  add column onboarding_completed_at timestamptz,
  add constraint profiles_city_other_exclusive check (city_id is null or city_other is null);

create index profiles_country_idx on public.profiles (country_id);
create index profiles_region_idx on public.profiles (region_id);
create index profiles_city_idx on public.profiles (city_id);

-- Location chain must be consistent: community in city in region in country.
create function public.profiles_validate_location()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.country_id is not null and not exists (
    select 1 from public.locations
    where id = new.country_id and kind = 'country' and is_active
  ) then
    raise exception 'invalid_location' using errcode = 'check_violation';
  end if;

  if new.region_id is not null and not exists (
    select 1 from public.locations
    where id = new.region_id and kind = 'region' and is_active
      and parent_id is not distinct from new.country_id
  ) then
    raise exception 'invalid_location' using errcode = 'check_violation';
  end if;

  if new.city_id is not null and not exists (
    select 1 from public.locations
    where id = new.city_id and kind = 'city' and is_active
      and parent_id is not distinct from new.region_id
  ) then
    raise exception 'invalid_location' using errcode = 'check_violation';
  end if;

  if new.community_id is not null and not exists (
    select 1 from public.locations
    where id = new.community_id and kind = 'community' and is_active
      and parent_id is not distinct from new.city_id
  ) then
    raise exception 'invalid_location' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger profiles_validate_location_trg
  before insert or update of country_id, region_id, city_id, community_id on public.profiles
  for each row execute function public.profiles_validate_location();

-- Users may edit these columns only. date_of_birth, account_status,
-- onboarding_completed_at and id stay protected.
grant update (
  gender, bio, occupation, education, languages, smoking, drinking,
  children_preference, intention_primary, intentions_extra,
  country_id, region_id, city_id, community_id, city_other, onboarding_step
) on public.profiles to authenticated;

-- Finishing onboarding is a function, not a column write, so the minimum
-- requirements cannot be skipped by calling the API directly.
create function public.complete_onboarding()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.profiles%rowtype;
begin
  select * into p from public.profiles where id = (select auth.uid());
  if not found then
    raise exception 'no_profile' using errcode = 'no_data_found';
  end if;
  if p.gender is null or p.intention_primary is null or p.country_id is null then
    raise exception 'incomplete_profile' using errcode = 'check_violation';
  end if;
  update public.profiles
     set onboarding_completed_at = coalesce(onboarding_completed_at, now())
   where id = p.id;
end;
$$;

revoke execute on function public.complete_onboarding() from public, anon;
grant execute on function public.complete_onboarding() to authenticated;

-- ---------------------------------------------------------------------------
-- preferences: what the user is looking for + where they appear.
-- ---------------------------------------------------------------------------
create table public.preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  seeking_genders public.gender[] not null default '{}'
    constraint preferences_seeking_limit check (cardinality(seeking_genders) <= 3),
  age_min smallint not null default 18 check (age_min between 18 and 99),
  age_max smallint not null default 60 check (age_max between 18 and 99),
  appear_local boolean not null default true,
  appear_liberia boolean not null default true,
  appear_diaspora boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint preferences_age_order check (age_min <= age_max)
);

create trigger preferences_set_updated_at
  before update on public.preferences
  for each row execute function public.set_updated_at();

alter table public.preferences enable row level security;
revoke all on public.preferences from anon, authenticated;
grant select on public.preferences to authenticated;
grant update (seeking_genders, age_min, age_max, appear_local, appear_liberia, appear_diaspora)
  on public.preferences to authenticated;

create policy preferences_select_own on public.preferences
  for select to authenticated using (user_id = (select auth.uid()));
create policy preferences_update_own on public.preferences
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- user_contacts: PRIVATE details. Never shown to other users.
-- phone_verified can only become true through a future server-side
-- verification flow; users have no grant on it.
-- ---------------------------------------------------------------------------
create table public.user_contacts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  phone_e164 text check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  phone_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.user_contacts_reset_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.phone_e164 is distinct from old.phone_e164 then
    new.phone_verified = false;
  end if;
  return new;
end;
$$;

create trigger user_contacts_reset_verification_trg
  before update on public.user_contacts
  for each row execute function public.user_contacts_reset_verification();

create trigger user_contacts_set_updated_at
  before update on public.user_contacts
  for each row execute function public.set_updated_at();

alter table public.user_contacts enable row level security;
revoke all on public.user_contacts from anon, authenticated;
grant select on public.user_contacts to authenticated;
grant insert (user_id, phone_e164) on public.user_contacts to authenticated;
grant update (phone_e164) on public.user_contacts to authenticated;
grant delete on public.user_contacts to authenticated;

create policy user_contacts_select_own on public.user_contacts
  for select to authenticated using (user_id = (select auth.uid()));
create policy user_contacts_insert_own on public.user_contacts
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy user_contacts_update_own on public.user_contacts
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy user_contacts_delete_own on public.user_contacts
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- profile_photos: metadata rows. Files live in the private storage bucket.
-- position 0 is the main photo.
-- ---------------------------------------------------------------------------
create table public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null unique
    constraint profile_photos_path_shape check (storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg)$'),
  position smallint not null check (position between 0 and 5),
  width integer check (width between 1 and 4096),
  height integer check (height between 1 and 4096),
  size_bytes integer check (size_bytes between 1 and 2097152),
  created_at timestamptz not null default now(),
  constraint profile_photos_path_owner check (split_part(storage_path, '/', 1) = user_id::text),
  constraint profile_photos_position_uniq unique (user_id, position) deferrable initially deferred
);
create index profile_photos_user_idx on public.profile_photos (user_id);

create function public.profile_photos_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.profile_photos where user_id = new.user_id) >= 6 then
    raise exception 'too_many_photos' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger profile_photos_limit_trg
  before insert on public.profile_photos
  for each row execute function public.profile_photos_limit();

alter table public.profile_photos enable row level security;
revoke all on public.profile_photos from anon, authenticated;
grant select, delete on public.profile_photos to authenticated;
grant insert (user_id, storage_path, position, width, height, size_bytes) on public.profile_photos to authenticated;
grant update (position) on public.profile_photos to authenticated;

create policy profile_photos_select_own on public.profile_photos
  for select to authenticated using (user_id = (select auth.uid()));
create policy profile_photos_insert_own on public.profile_photos
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy profile_photos_update_own on public.profile_photos
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy profile_photos_delete_own on public.profile_photos
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage: private bucket, 2 MB, WebP/JPEG only, each user confined to their
-- own folder (<user_id>/<file>). Other users' access arrives in Phase 3+ via
-- signed URLs gated by discovery rules.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', false, 2097152, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = false,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/webp', 'image/jpeg'];

create policy "profile photos: owner can read" on storage.objects
  for select to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "profile photos: owner can upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "profile photos: owner can delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------------------
-- Signup trigger now also creates the preferences row.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
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
  insert into public.preferences (user_id) values (new.id);

  return new;
end;
$$;

insert into public.preferences (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Seed: Liberia (all 15 counties + principal towns), Monrovia and Paynesville
-- communities, and common diaspora countries. This is an INITIAL set that
-- admins can extend from the admin dashboard.
-- ---------------------------------------------------------------------------
do $$
declare
  lib uuid;
  r uuid;
  c uuid;
  town text;
  rec record;
begin
  insert into public.locations (kind, name, slug, iso_code, sort_order)
  values ('country', 'Liberia', 'liberia', 'LR', 0)
  returning id into lib;

  for rec in
    select * from (values
      ('Bomi', array['Tubmanburg', 'Klay']),
      ('Bong', array['Gbarnga', 'Totota', 'Salala', 'Suakoko']),
      ('Gbarpolu', array['Bopolu']),
      ('Grand Bassa', array['Buchanan', 'Edina']),
      ('Grand Cape Mount', array['Robertsport']),
      ('Grand Gedeh', array['Zwedru']),
      ('Grand Kru', array['Barclayville']),
      ('Lofa', array['Voinjama', 'Zorzor', 'Foya', 'Kolahun']),
      ('Margibi', array['Kakata', 'Harbel', 'Marshall']),
      ('Maryland', array['Harper', 'Pleebo']),
      ('Montserrado', array['Monrovia', 'Paynesville', 'Caldwell', 'Gardnersville', 'Bensonville', 'Careysburg', 'New Georgia']),
      ('Nimba', array['Sanniquellie', 'Ganta', 'Saclepea', 'Tappita']),
      ('River Cess', array['Cestos City']),
      ('River Gee', array['Fish Town']),
      ('Sinoe', array['Greenville'])
    ) as t(county, towns)
  loop
    insert into public.locations (parent_id, kind, name, slug)
    values (lib, 'region', rec.county, lower(replace(rec.county, ' ', '-')))
    returning id into r;

    foreach town in array rec.towns loop
      insert into public.locations (parent_id, kind, name, slug)
      values (r, 'city', town, lower(replace(town, ' ', '-')))
      returning id into c;

      if town = 'Monrovia' then
        insert into public.locations (parent_id, kind, name, slug)
        select c, 'community', n, lower(replace(n, ' ', '-'))
        from unnest(array[
          'Sinkor', 'Congo Town', 'Mamba Point', 'Old Road', 'New Kru Town',
          'Clara Town', 'West Point', 'Logan Town', 'Vai Town', 'Duala'
        ]) as n;
      elsif town = 'Paynesville' then
        insert into public.locations (parent_id, kind, name, slug)
        select c, 'community', n, lower(replace(n, ' ', '-'))
        from unnest(array['Red Light', 'Duport Road', 'ELWA']) as n;
      end if;
    end loop;
  end loop;

  insert into public.locations (kind, name, slug, iso_code, sort_order)
  select 'country', n.name, n.slug, n.iso, 10 + n.ord
  from (values
    (1, 'United States', 'united-states', 'US'),
    (2, 'United Kingdom', 'united-kingdom', 'GB'),
    (3, 'Canada', 'canada', 'CA'),
    (4, 'Ghana', 'ghana', 'GH'),
    (5, 'Nigeria', 'nigeria', 'NG'),
    (6, 'Sierra Leone', 'sierra-leone', 'SL'),
    (7, 'Guinea', 'guinea', 'GN'),
    (8, 'Côte d''Ivoire', 'cote-d-ivoire', 'CI'),
    (9, 'Germany', 'germany', 'DE'),
    (10, 'Netherlands', 'netherlands', 'NL'),
    (11, 'Sweden', 'sweden', 'SE'),
    (12, 'Belgium', 'belgium', 'BE'),
    (13, 'Australia', 'australia', 'AU'),
    (14, 'Ireland', 'ireland', 'IE'),
    (15, 'South Africa', 'south-africa', 'ZA'),
    (16, 'United Arab Emirates', 'united-arab-emirates', 'AE')
  ) as n(ord, name, slug, iso);
end;
$$;

insert into public.interests (slug, label, category, sort_order) values
  ('music', 'Music', 'Entertainment', 1),
  ('movies', 'Movies', 'Entertainment', 2),
  ('dancing', 'Dancing', 'Entertainment', 3),
  ('comedy', 'Comedy', 'Entertainment', 4),
  ('gaming', 'Gaming', 'Entertainment', 5),
  ('football', 'Football', 'Sports and fitness', 10),
  ('basketball', 'Basketball', 'Sports and fitness', 11),
  ('fitness', 'Fitness', 'Sports and fitness', 12),
  ('running', 'Running', 'Sports and fitness', 13),
  ('cooking', 'Cooking', 'Food and home', 20),
  ('trying-new-food', 'Trying new food', 'Food and home', 21),
  ('family', 'Family time', 'Food and home', 22),
  ('church', 'Church and faith', 'Values', 30),
  ('volunteering', 'Volunteering', 'Values', 31),
  ('community', 'Community work', 'Values', 32),
  ('reading', 'Reading', 'Learning', 40),
  ('writing', 'Writing', 'Learning', 41),
  ('learning', 'Learning new things', 'Learning', 42),
  ('technology', 'Technology', 'Learning', 43),
  ('business', 'Business and entrepreneurship', 'Learning', 44),
  ('travel', 'Travel', 'Adventure', 50),
  ('beach', 'Beach days', 'Adventure', 51),
  ('nature', 'Nature and outdoors', 'Adventure', 52),
  ('photography', 'Photography', 'Creative', 60),
  ('art', 'Art and design', 'Creative', 61),
  ('fashion', 'Fashion', 'Creative', 62);
