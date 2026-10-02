-- HeartBridge Phase 6: behavioural tests for reports, safety flags and blocked list.
-- Run in the Supabase SQL Editor (as postgres). Rolls back by raising an exception whose
-- message is the JSON result. Every value must be `true`. Leaves no data behind.

do $$
declare
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid();
  d uuid := gen_random_uuid(); e uuid := gen_random_uuid();
  lib uuid; mont uuid; mid uuid; msg uuid;
  res jsonb := '{}'::jsonb; n int; ok boolean;
begin
  insert into auth.users (id, aud, role, email, raw_user_meta_data) values
    (a, 'authenticated', 'authenticated', 'a@test.invalid', '{"first_name":"Ama","date_of_birth":"1995-05-20"}'),
    (b, 'authenticated', 'authenticated', 'b@test.invalid', '{"first_name":"Bo","date_of_birth":"1993-03-03"}'),
    (c, 'authenticated', 'authenticated', 'c@test.invalid', '{"first_name":"Cee","date_of_birth":"1990-01-01"}'),
    (d, 'authenticated', 'authenticated', 'd@test.invalid', '{"first_name":"Dee","date_of_birth":"1991-02-02"}'),
    (e, 'authenticated', 'authenticated', 'e@test.invalid', '{"first_name":"Eve","date_of_birth":"1992-02-02"}');
  select id into lib from public.locations where kind = 'country' and iso_code = 'LR';
  select id into mont from public.locations where kind = 'region' and slug = 'montserrado' and parent_id = lib;
  update public.profiles set gender='woman', country_id=lib, region_id=mont, onboarding_completed_at=now() where id in (a, e);
  update public.profiles set gender='man', country_id=lib, region_id=mont, onboarding_completed_at=now() where id in (b, c, d);
  update public.preferences set seeking_genders='{man}', age_min=25, age_max=45 where user_id in (a, e);
  update public.preferences set seeking_genders='{woman}', age_min=25, age_max=45 where user_id in (b, c, d);

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.likes (liker_id, liked_id) values (a, b);
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.likes (liker_id, liked_id) values (b, a);
  mid := public.match_id_with(a);
  msg := public.send_message(mid, 'please send money');
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.report_user(b, 'scam', 'asked me for money');
  perform public.report_user(b, 'scam', 'again');
  reset role;
  select count(*) into n from public.reports where reporter_id = a and reported_id = b;
  res := res || jsonb_build_object('01 report stored, duplicate open report collapsed', n = 1);
  select match_id = mid into ok from public.reports where reporter_id = a and reported_id = b;
  res := res || jsonb_build_object('02 report links the match', ok);

  set local role authenticated;
  ok := false;
  begin perform 1 from public.reports; exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('03 clients cannot read reports', ok);
  ok := false;
  begin perform 1 from public.safety_flags; exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('04 clients cannot read safety flags', ok);
  ok := false;
  begin insert into public.reports (reporter_id, reported_id, category) values (a, b, 'spam'); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('05 clients cannot insert reports directly', ok);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.blocks (blocker_id, blocked_id) values (a, b);
  perform public.report_user(b, 'harassment');
  res := res || jsonb_build_object('06 matched person can be reported after a block', true);
  select count(*) into n from public.my_blocked();
  res := res || jsonb_build_object('07 my_blocked lists the block', n = 1);
  ok := false;
  begin perform public.report_user(a, 'spam'); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('08 cannot report yourself', ok);
  ok := false;
  begin perform public.report_user(d, 'spam'); ok := true; exception when insufficient_privilege then ok := false; end;
  res := res || jsonb_build_object('09 can report a visible stranger', ok);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false;
  begin perform public.report_user(a, 'spam'); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('10 someone who cannot see a person cannot report them', ok);
  reset role;

  set local role anon;
  ok := false;
  begin perform public.report_user(b, 'spam'); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('11 anon cannot report', ok);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.report_user(d, 'underage_user');
  reset role;
  select count(*) into n from public.safety_flags where user_id = d and kind = 'underage_report';
  res := res || jsonb_build_object('12 underage report raises a flag', n = 1);

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.record_message_flag(msg, 'money_request');
  perform public.record_message_flag(msg, 'money_request');
  reset role;
  select count(*) into n from public.safety_flags where user_id = b and kind = 'scam_pattern';
  res := res || jsonb_build_object('13 scam-pattern flag recorded once per day', n = 1);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false;
  begin perform public.record_message_flag(msg, 'money_request'); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('14 cannot flag someone else''s message', ok);
  ok := false;
  begin perform public.record_message_flag(msg, 'because'); exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('15 unknown reasons rejected', ok);
  reset role;

  raise exception 'RESULTS %', res::text;
end $$;
