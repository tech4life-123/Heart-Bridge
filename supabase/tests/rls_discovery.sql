-- HeartBridge Phase 4: behavioural tests for discovery, likes/passes/saves,
-- blocks, questionnaire privacy and photo visibility.
-- Run in the Supabase SQL Editor (as postgres). Creates temporary users, exercises
-- the rules and ALWAYS rolls back by raising an exception whose message is the JSON
-- result. Every value must be `true`. Leaves no data behind.

do $$
declare
  a uuid := gen_random_uuid();  -- woman, Paynesville, seeks men 25-40
  b uuid := gen_random_uuid();  -- man, Monrovia (same county as a)
  c uuid := gen_random_uuid();  -- man, Bong county
  d uuid := gen_random_uuid();  -- man, USA (diaspora)
  e uuid := gen_random_uuid();  -- man aged 22 (outside a's age range)
  f uuid := gen_random_uuid();  -- woman seeking women
  lib uuid; usa uuid; mont uuid; bong uuid; pay uuid; mon uuid;
  q1 uuid; q2 uuid;
  res jsonb := '{}'::jsonb;
  n int; ok boolean; v boolean; t text; sim numeric; plc text;
  pb text;
begin
  insert into auth.users (id, aud, role, email, raw_user_meta_data) values
    (a, 'authenticated', 'authenticated', 'a@test.invalid', '{"first_name":"Ama","date_of_birth":"1995-05-20"}'),
    (b, 'authenticated', 'authenticated', 'b@test.invalid', '{"first_name":"Bo","date_of_birth":"1993-03-03"}'),
    (c, 'authenticated', 'authenticated', 'c@test.invalid', '{"first_name":"Cee","date_of_birth":"1990-01-01"}'),
    (d, 'authenticated', 'authenticated', 'd@test.invalid', '{"first_name":"Dee","date_of_birth":"1991-02-02"}'),
    (e, 'authenticated', 'authenticated', 'e@test.invalid',
       jsonb_build_object('first_name', 'Eli', 'date_of_birth', (current_date - interval '22 years')::date::text)),
    (f, 'authenticated', 'authenticated', 'f@test.invalid', '{"first_name":"Fay","date_of_birth":"1994-04-04"}');

  select id into lib  from public.locations where kind = 'country' and iso_code = 'LR';
  select id into usa  from public.locations where kind = 'country' and iso_code = 'US';
  select id into mont from public.locations where kind = 'region' and slug = 'montserrado' and parent_id = lib;
  select id into bong from public.locations where kind = 'region' and slug = 'bong' and parent_id = lib;
  select id into pay  from public.locations where kind = 'city' and slug = 'paynesville' and parent_id = mont;
  select id into mon  from public.locations where kind = 'city' and slug = 'monrovia' and parent_id = mont;

  -- Onboarded profiles (set directly as the table owner)
  update public.profiles set gender='woman', intention_primary='serious_relationship', country_id=lib, region_id=mont, city_id=pay,
         onboarding_completed_at=now(), bio='Hello' where id = a;
  update public.profiles set gender='man', intention_primary='serious_relationship', country_id=lib, region_id=mont, city_id=mon,
         onboarding_completed_at=now() where id = b;
  update public.profiles set gender='man', intention_primary='dating', country_id=lib, region_id=bong,
         onboarding_completed_at=now() where id = c;
  update public.profiles set gender='man', intention_primary='marriage', country_id=usa, city_other='Atlanta',
         onboarding_completed_at=now() where id = d;
  update public.profiles set gender='man', intention_primary='dating', country_id=lib, region_id=mont,
         onboarding_completed_at=now() where id = e;
  update public.profiles set gender='woman', intention_primary='friendship', country_id=lib, region_id=mont,
         onboarding_completed_at=now() where id = f;

  update public.preferences set seeking_genders='{man}',   age_min=25, age_max=40 where user_id = a;
  update public.preferences set seeking_genders='{woman}', age_min=25, age_max=45 where user_id in (b, c, d, e);
  update public.preferences set seeking_genders='{woman}', age_min=25, age_max=45 where user_id = f;

  -- ===== as A =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.discover_profiles();
  res := res || jsonb_build_object('01 A discovers exactly B, C, D', n = 3);
  select count(*) into n from public.discover_profiles() where id in (b, c, d);
  res := res || jsonb_build_object('02 the three are B, C, D', n = 3);
  select count(*) into n from public.discover_profiles() where id in (a, e, f);
  res := res || jsonb_build_object('03 not self, not out-of-age-range, not wrong gender', n = 0);

  select place, proximity into plc, n from public.discover_profiles() where id = b;
  res := res || jsonb_build_object('04 approximate place only (city, county)', plc = 'Monrovia, Montserrado');
  res := res || jsonb_build_object('05 proximity same county = 2', n = 2);
  select place into plc from public.discover_profiles() where id = d;
  res := res || jsonb_build_object('06 diaspora place shows city, country', plc = 'Atlanta, United States');

  select count(*) into n from public.discover_profiles(p_region_id => bong);
  res := res || jsonb_build_object('07 county filter works', n = 1);
  select count(*) into n from public.discover_profiles(p_intentions => '{marriage}');
  res := res || jsonb_build_object('08 intention filter works', n = 1);

  res := res || jsonb_build_object('09 can_view B true / E false / self false',
    public.can_view_profile(b) and not public.can_view_profile(e) and not public.can_view_profile(a));

  -- Cannot read other people's raw rows
  select count(*) into n from public.preferences where user_id <> a;
  res := res || jsonb_build_object('10 raw preferences of others unreadable', n = 0);

  -- Like
  insert into public.likes (liker_id, liked_id) values (a, b);
  select count(*) into n from public.likes;
  res := res || jsonb_build_object('11 A can like a visible profile', n = 1);

  ok := false;
  begin insert into public.likes (liker_id, liked_id) values (a, e);
  exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('12 A cannot like an invisible profile', ok);

  ok := false;
  begin insert into public.likes (liker_id, liked_id) values (b, c);
  exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('13 A cannot like on behalf of someone else', ok);

  ok := false;
  begin insert into public.likes (liker_id, liked_id) values (a, b);
  exception when unique_violation then ok := true; end;
  res := res || jsonb_build_object('14 duplicate like rejected', ok);

  select count(*) into n from public.discover_profiles() where id = b;
  res := res || jsonb_build_object('15 liked profile leaves the feed', n = 0);
  select is_liked into v from public.profile_cards(array[b]);
  res := res || jsonb_build_object('16 profile_cards reports is_liked', v);

  -- Pass + save
  insert into public.passes (user_id, target_id) values (a, d);
  select count(*) into n from public.discover_profiles() where id = d;
  res := res || jsonb_build_object('17 passed profile leaves the feed', n = 0);

  insert into public.saved_profiles (user_id, saved_id) values (a, c);
  select count(*) into n from public.saved_profiles;
  res := res || jsonb_build_object('18 A can save a visible profile', n = 1);
  ok := false;
  begin insert into public.saved_profiles (user_id, saved_id) values (a, e);
  exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('19 A cannot save an invisible profile', ok);
  select count(*) into n from public.discover_profiles() where id = c;
  res := res || jsonb_build_object('20 saved profile stays in the feed until acted on', n = 1);

  -- Questionnaire privacy and validation
  select id into q1 from public.compatibility_questions where slug = 'family';
  select id into q2 from public.compatibility_questions where slug = 'weekend';
  insert into public.compatibility_answers (user_id, question_id, value) values (a, q1, 3), (a, q2, 2);
  ok := false;
  begin insert into public.compatibility_answers (user_id, question_id, value) values (a, q1, 99);
  exception when check_violation or unique_violation then ok := true; end;
  res := res || jsonb_build_object('21 invalid questionnaire value rejected', ok);
  ok := false;
  begin insert into public.compatibility_answers (user_id, question_id, value) values (b, q1, 3);
  exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('22 cannot answer on behalf of someone else', ok);
  reset role;

  -- ===== as B: answers, then check A's view =====
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.compatibility_answers (user_id, question_id, value) values (b, q1, 4), (b, q2, 2);
  select count(*) into n from public.compatibility_answers;
  res := res || jsonb_build_object('23 B sees only their own answers', n = 1 + 1);
  select count(*) into n from public.likes;
  res := res || jsonb_build_object('24 B cannot see likes A sent', n = 0);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  -- family ordinal span 3: |3-4|/3 -> 0.667; weekend categorical equal -> 1; avg 0.833
  select qa_similarity, qa_count into sim, n from public.profile_cards(array[b]);
  res := res || jsonb_build_object('25 questionnaire similarity computed server-side', sim = 0.833 and n = 2);
  select count(*) into n from public.compatibility_answers where user_id = b;
  res := res || jsonb_build_object('26 A cannot read B''s raw answers', n = 0);

  -- Daily like limit (configurable setting)
  reset role;
  update public.app_settings set value = '1' where key = 'daily_like_limit';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false;
  begin insert into public.likes (liker_id, liked_id) values (a, c);
  exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('27 daily like limit enforced', ok);
  reset role;
  update public.app_settings set value = '50' where key = 'daily_like_limit';

  -- Where-I-appear rules
  update public.preferences set appear_liberia = false, appear_local = true where user_id = b;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  res := res || jsonb_build_object('28 same-county viewer still sees "local only" B', public.can_view_profile(b));
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  res := res || jsonb_build_object('29 other-county viewer cannot see "local only" B', not public.can_view_profile(b));
  reset role;
  update public.preferences set appear_liberia = true where user_id = b;

  update public.preferences set appear_diaspora = false where user_id = d;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  res := res || jsonb_build_object('30 diaspora opt-out hides D from Liberia', not public.can_view_profile(d));
  reset role;
  update public.preferences set appear_diaspora = true where user_id = d;

  -- Suspended accounts vanish
  update public.profiles set account_status = 'suspended' where id = b;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  res := res || jsonb_build_object('31 suspended account is invisible', not public.can_view_profile(b));
  reset role;
  update public.profiles set account_status = 'active' where id = b;

  -- Photos: storage visibility follows the same gate
  insert into storage.objects (bucket_id, name, owner_id) values
    ('profile-photos', b::text || '/p1.webp', b::text),
    ('profile-photos', c::text || '/p1.webp', c::text),
    ('profile-photos', e::text || '/p1.webp', e::text);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from storage.objects where bucket_id = 'profile-photos' and name = b::text || '/p1.webp';
  res := res || jsonb_build_object('32 A can read the photo of a visible profile', n = 1);
  select count(*) into n from storage.objects where bucket_id = 'profile-photos' and name = e::text || '/p1.webp';
  res := res || jsonb_build_object('33 A cannot read the photo of an invisible profile', n = 0);
  reset role;

  -- Blocks (both directions)
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.blocks (blocker_id, blocked_id) values (a, c);
  ok := false;
  begin insert into public.blocks (blocker_id, blocked_id) values (b, c);
  exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('34 cannot create a block as someone else', ok);
  select count(*) into n from public.discover_profiles() where id = c;
  res := res || jsonb_build_object('35 blocked user leaves A''s feed', n = 0);
  select count(*) into n from storage.objects where bucket_id = 'profile-photos' and name = c::text || '/p1.webp';
  res := res || jsonb_build_object('36 blocked user''s photo is unreadable', n = 0);
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  res := res || jsonb_build_object('37 block works in the other direction too', not public.can_view_profile(a));
  select count(*) into n from public.blocks;
  res := res || jsonb_build_object('38 the blocked user cannot see they were blocked', n = 0);
  reset role;

  -- Anonymous
  set local role anon;
  ok := false;
  begin perform * from public.discover_profiles(); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('39 anon cannot call discover_profiles', ok);
  ok := false;
  begin perform 1 from public.likes; exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('40 anon cannot read likes', ok);
  reset role;

  raise exception 'RESULTS %', res::text;
end $$;
