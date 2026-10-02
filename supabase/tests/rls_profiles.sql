-- HeartBridge Phase 3: behavioural RLS / trigger tests for profiles, locations,
-- interests, preferences, contacts, photos and storage.
-- Run in the Supabase SQL Editor (as postgres). Creates temporary users, exercises
-- the rules and ALWAYS rolls back by raising an exception whose message is the JSON
-- result. Every value must be `true`. Leaves no data behind.

do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  adm uuid := gen_random_uuid();
  lib uuid; mont uuid; pay uuid; bong uuid; usa uuid;
  i1 uuid; i2 uuid;
  res jsonb := '{}'::jsonb;
  n int; ok boolean; v boolean; msg text;
  p0 text; p1 text; pb text; pid uuid;
  k int;
  has_fn boolean := to_regprocedure('public.set_main_photo(uuid)') is not null;
begin
  insert into auth.users (id, aud, role, email, raw_user_meta_data) values
    (a,   'authenticated', 'authenticated', 'a@test.invalid',   '{"first_name":"Ama","date_of_birth":"1995-05-20"}'),
    (b,   'authenticated', 'authenticated', 'b@test.invalid',   '{"first_name":"Bo","date_of_birth":"1990-01-01"}'),
    (adm, 'authenticated', 'authenticated', 'adm@test.invalid', '{"first_name":"Admin","date_of_birth":"1985-01-01"}');
  insert into public.admin_roles (user_id, role) values (adm, 'admin');

  select id into lib  from public.locations where kind = 'country' and iso_code = 'LR';
  select id into usa  from public.locations where kind = 'country' and iso_code = 'US';
  select id into mont from public.locations where kind = 'region' and slug = 'montserrado' and parent_id = lib;
  select id into bong from public.locations where kind = 'region' and slug = 'bong' and parent_id = lib;
  select id into pay  from public.locations where kind = 'city' and slug = 'paynesville' and parent_id = mont;
  select id into i1 from public.interests where slug = 'music';
  select id into i2 from public.interests where slug = 'football';

  -- Seed data
  select count(*) into n from public.locations where kind = 'region' and parent_id = lib;
  res := res || jsonb_build_object('01 all 15 Liberian counties seeded', n = 15);
  select count(*) into n from public.preferences where user_id in (a, b, adm);
  res := res || jsonb_build_object('02 signup creates preferences rows', n = 3);

  -- ===== as user A =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.locations;
  res := res || jsonb_build_object('03 signed-in user can read locations', n > 60);
  select count(*) into n from public.interests;
  res := res || jsonb_build_object('04 signed-in user can read interests', n = 26);

  ok := false;
  begin insert into public.locations (kind, name, slug, parent_id) values ('region', 'Hack', 'hack', lib);
  exception when others then ok := true; end;
  res := res || jsonb_build_object('05 non-admin cannot add locations', ok);

  ok := false;
  begin update public.interests set label = 'x' where slug = 'music'; get diagnostics n = row_count; if n = 0 then ok := true; end if;
  exception when others then ok := true; end;
  res := res || jsonb_build_object('06 non-admin cannot edit interests', ok);

  update public.profiles set gender = 'woman', bio = 'Hello there, I like music.', occupation = 'Nurse' where id = a;
  get diagnostics n = row_count;
  res := res || jsonb_build_object('07 user can edit own profile fields', n = 1);

  update public.profiles set bio = 'hacked' where id = b;
  get diagnostics n = row_count;
  res := res || jsonb_build_object('08 user cannot edit another profile', n = 0);

  ok := false;
  begin update public.profiles set onboarding_completed_at = now() where id = a;
  exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('09 user cannot set onboarding_completed_at directly', ok);

  ok := false;
  begin update public.profiles set date_of_birth = '2000-01-01' where id = a;
  exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('10 DOB still protected', ok);

  ok := false;
  begin update public.profiles set bio = repeat('x', 501) where id = a;
  exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('11 bio longer than 500 rejected', ok);

  -- Location chain
  ok := false;
  begin update public.profiles set country_id = lib, region_id = mont, city_id = pay where id = a;
    get diagnostics n = row_count; ok := n = 1;
  exception when others then ok := false; end;
  res := res || jsonb_build_object('12 valid country>county>city accepted', ok);

  ok := false;
  begin update public.profiles set region_id = bong, city_id = pay where id = a;
  exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('13 city under wrong county rejected', ok);

  ok := false;
  begin update public.profiles set country_id = usa, region_id = mont, city_id = null where id = a;
  exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('14 county under wrong country rejected', ok);

  ok := false;
  begin update public.profiles set city_other = 'Paynesville' where id = a;
  exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('15 free-text city blocked when a listed city is set', ok);

  -- Onboarding completion is enforced by the database
  ok := false;
  begin perform public.complete_onboarding();
  exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('16 complete_onboarding refuses an incomplete profile', ok);

  update public.profiles set intention_primary = 'serious_relationship' where id = a;
  perform public.complete_onboarding();
  select (onboarding_completed_at is not null) into v from public.profiles where id = a;
  res := res || jsonb_build_object('17 complete_onboarding succeeds when minimum met', v);

  reset role;
  set local role anon;
  ok := false;
  begin perform 1 from public.locations; exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('18 anon cannot read locations', ok);
  ok := false;
  begin perform 1 from public.profile_photos; exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('19 anon cannot read photos', ok);
  ok := false;
  begin perform public.complete_onboarding(); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('20 anon cannot call complete_onboarding', ok);
  reset role;

  -- ===== back to user A: interests =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  insert into public.user_interests (user_id, interest_id) values (a, i1);
  select count(*) into n from public.user_interests;
  res := res || jsonb_build_object('21 user can add own interest', n = 1);

  ok := false;
  begin insert into public.user_interests (user_id, interest_id) values (b, i2);
  exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('22 user cannot add interest for someone else', ok);

  -- 10-interest limit: add 9 more distinct interests, then the 11th must fail
  insert into public.user_interests (user_id, interest_id)
    select a, id from public.interests where id <> i1 order by sort_order limit 9;
  ok := false;
  begin insert into public.user_interests (user_id, interest_id)
    select a, id from public.interests where id not in (select interest_id from public.user_interests where user_id = a) limit 1;
  exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('23 more than 10 interests rejected', ok);

  -- Preferences
  update public.preferences set age_min = 25, age_max = 40, seeking_genders = '{man}' where user_id = a;
  get diagnostics n = row_count;
  res := res || jsonb_build_object('24 user can edit own preferences', n = 1);
  ok := false;
  begin update public.preferences set age_min = 17 where user_id = a; exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('25 minimum age below 18 rejected', ok);
  ok := false;
  begin update public.preferences set age_min = 50, age_max = 30 where user_id = a; exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('26 inverted age range rejected', ok);
  select count(*) into n from public.preferences;
  res := res || jsonb_build_object('27 user sees only own preferences', n = 1);

  -- Private contact
  insert into public.user_contacts (user_id, phone_e164) values (a, '+231771234567');
  ok := false;
  begin insert into public.user_contacts (user_id, phone_e164) values (b, '+231770000000'); exception when others then ok := true; end;
  res := res || jsonb_build_object('28 user cannot create contact for someone else', ok);
  ok := false;
  begin update public.user_contacts set phone_e164 = 'call-me' where user_id = a; exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('29 malformed phone rejected', ok);
  ok := false;
  begin update public.user_contacts set phone_verified = true where user_id = a; exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('30 user cannot self-verify phone', ok);

  -- Photos
  p0 := a::text || '/' || gen_random_uuid()::text || '.webp';
  p1 := a::text || '/' || gen_random_uuid()::text || '.jpg';
  pb := b::text || '/' || gen_random_uuid()::text || '.webp';
  insert into public.profile_photos (user_id, storage_path, position) values (a, p0, 0), (a, p1, 1);
  select count(*) into n from public.profile_photos;
  res := res || jsonb_build_object('31 user can add own photos', n = 2);

  ok := false;
  begin insert into public.profile_photos (user_id, storage_path, position) values (a, pb, 2);
  exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('32 photo path inside someone else''s folder rejected', ok);

  ok := false;
  begin insert into public.profile_photos (user_id, storage_path, position) values (b, b::text || '/' || gen_random_uuid()::text || '.webp', 0);
  exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('33 user cannot add photo rows for someone else', ok);

  ok := false;
  begin insert into public.profile_photos (user_id, storage_path, position) values (a, a::text || '/evil.exe', 2);
  exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('34 unexpected file name/extension rejected', ok);

  set constraints profile_photos_position_uniq immediate;
  ok := false;
  begin insert into public.profile_photos (user_id, storage_path, position) values (a, a::text || '/' || gen_random_uuid()::text || '.webp', 0);
  exception when unique_violation then ok := true; end;
  set constraints profile_photos_position_uniq deferred;
  res := res || jsonb_build_object('35 duplicate photo position rejected', ok);

  -- fill to 6 then the 7th must fail
  for k in 2..5 loop
    insert into public.profile_photos (user_id, storage_path, position)
      values (a, a::text || '/' || gen_random_uuid()::text || '.webp', k);
  end loop;
  ok := false;
  begin insert into public.profile_photos (user_id, storage_path, position)
    values (a, a::text || '/' || gen_random_uuid()::text || '.webp', 5);
  exception when others then ok := true; end;
  res := res || jsonb_build_object('36 more than 6 photos rejected', ok);

  if has_fn then
    select id into pid from public.profile_photos where user_id = a and position = 3;
    perform public.set_main_photo(pid);
    select position into k from public.profile_photos where id = pid;
    res := res || jsonb_build_object('37 set_main_photo moves it to position 0', k = 0);
    select count(distinct position) into n from public.profile_photos where user_id = a;
    res := res || jsonb_build_object('38 positions stay unique after reorder', n = 6);
    select public.delete_profile_photo(pid) into msg;
    select count(*) into n from public.profile_photos where user_id = a;
    res := res || jsonb_build_object('39 delete_profile_photo removes the row', n = 5);
    select max(position) into k from public.profile_photos where user_id = a;
    res := res || jsonb_build_object('40 delete closes the gap in positions', k = 4);
  else
    res := res || jsonb_build_object('37-40 photo functions not applied yet (apply 20261002020000)', false);
  end if;

  -- Storage policies
  ok := false;
  begin
    insert into storage.objects (bucket_id, name, owner_id) values ('profile-photos', a::text || '/t1.webp', a::text);
    ok := true;
  exception when others then ok := false; end;
  res := res || jsonb_build_object('41 user can upload into own storage folder', ok);
  ok := false;
  begin insert into storage.objects (bucket_id, name, owner_id) values ('profile-photos', b::text || '/t2.webp', a::text);
  exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('42 user cannot upload into someone else''s folder', ok);
  ok := false;
  begin insert into storage.objects (bucket_id, name, owner_id) values ('some-other-bucket', a::text || '/t3.webp', a::text);
  exception when others then ok := true; end;
  res := res || jsonb_build_object('43 user cannot write to other buckets', ok);

  reset role;
  -- Plant a file in B's folder as owner, then check A cannot see it
  insert into storage.objects (bucket_id, name, owner_id) values ('profile-photos', b::text || '/secret.webp', b::text);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from storage.objects where bucket_id = 'profile-photos' and name like b::text || '/%';
  res := res || jsonb_build_object('44 user cannot read someone else''s photos', n = 0);
  select count(*) into n from storage.objects where bucket_id = 'profile-photos' and name like a::text || '/%';
  res := res || jsonb_build_object('45 user can read own photos', n = 1);
  reset role;

  -- ===== user B cannot see A's data =====
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.user_interests;
  res := res || jsonb_build_object('46 B sees none of A''s interests', n = 0);
  select count(*) into n from public.user_contacts;
  res := res || jsonb_build_object('47 B sees none of A''s phone number', n = 0);
  select count(*) into n from public.profile_photos;
  res := res || jsonb_build_object('48 B sees none of A''s photo rows', n = 0);
  select count(*) into n from public.preferences where user_id = a;
  res := res || jsonb_build_object('49 B cannot read A''s preferences', n = 0);
  reset role;

  -- ===== admin can manage reference data =====
  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false;
  begin
    insert into public.locations (kind, name, slug, parent_id) values ('city', 'Test Town', 'test-town', bong);
    ok := true;
  exception when others then ok := false; end;
  res := res || jsonb_build_object('50 admin can add a location', ok);
  ok := false;
  begin insert into public.locations (kind, name, slug, parent_id) values ('community', 'Bad', 'bad', lib);
  exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('51 admin cannot break the location hierarchy', ok);
  reset role;

  raise exception 'RESULTS %', res::text;
end $$;
