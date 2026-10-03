-- HeartBridge admin extras: behavioural tests for appeals, locations editor and analytics.
-- Run in the Supabase SQL Editor (as postgres). Rolls back by raising an exception whose
-- message is the JSON result. Every value must be `true`. Leaves no data behind.

do $$
declare
  adm uuid := gen_random_uuid(); m uuid := gen_random_uuid(); f uuid := gen_random_uuid();
  u uuid := gen_random_uuid(); v uuid := gen_random_uuid(); b uuid := gen_random_uuid();
  aid uuid; bid uuid; lid uuid; lib uuid;
  res jsonb := '{}'::jsonb; n int; ok boolean; st public.account_status; c int;
begin
  insert into auth.users (id, aud, role, email, raw_user_meta_data) values
    (adm, 'authenticated', 'authenticated', 'adm@test.invalid', '{"first_name":"Adm","date_of_birth":"1985-01-01"}'),
    (m, 'authenticated', 'authenticated', 'm@test.invalid', '{"first_name":"Mod","date_of_birth":"1985-01-01"}'),
    (f, 'authenticated', 'authenticated', 'f@test.invalid', '{"first_name":"Fin","date_of_birth":"1985-01-01"}'),
    (u, 'authenticated', 'authenticated', 'u@test.invalid', '{"first_name":"Una","date_of_birth":"1995-05-20"}'),
    (v, 'authenticated', 'authenticated', 'v@test.invalid', '{"first_name":"Val","date_of_birth":"1993-03-03"}'),
    (b, 'authenticated', 'authenticated', 'b@test.invalid', '{"first_name":"Bo","date_of_birth":"1993-03-03"}');
  insert into public.admin_roles (user_id, role) values (adm, 'admin'), (m, 'moderator'), (f, 'finance');
  update public.profiles set account_status = 'suspended' where id = u;
  update public.profiles set account_status = 'banned' where id = b;

  -- member side
  perform set_config('request.jwt.claims', json_build_object('sub', v, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false; begin perform public.submit_appeal('I am an active member and should not be able to appeal anything.'); exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('01 active member cannot appeal', ok);
  ok := false; begin perform public.admin_appeals_queue(); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('02 member cannot read appeals queue', ok);
  ok := false; begin perform public.admin_analytics(30); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('03 member cannot read analytics', ok);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false; begin perform public.submit_appeal('too short'); exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('04 short appeal refused', ok);
  aid := public.submit_appeal('I believe this suspension was a mistake; I never sent those messages.');
  res := res || jsonb_build_object('05 suspended member can appeal', aid is not null);
  ok := false; begin perform public.submit_appeal('Second appeal while the first is still open, please look.'); exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('06 only one open appeal', ok);
  select count(*) into n from public.my_appeal() where status = 'open';
  res := res || jsonb_build_object('07 member sees own appeal status', n = 1);
  begin perform 1 from public.account_appeals; res := res || jsonb_build_object('08 appeals table not readable directly', false);
  exception when insufficient_privilege then res := res || jsonb_build_object('08 appeals table not readable directly', true); end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  bid := public.submit_appeal('Please review my ban again; I can explain what happened clearly.');
  reset role;

  -- staff side
  perform set_config('request.jwt.claims', json_build_object('sub', f, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false; begin perform public.admin_appeals_queue(); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('09 finance cannot read appeals', ok);
  select count(*) into n from public.admin_revenue();
  res := res || jsonb_build_object('10 finance can read revenue', n >= 0);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false; begin perform public.admin_revenue(); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('11 moderator cannot read revenue', ok);
  select count(*) into n from public.admin_analytics(30);
  res := res || jsonb_build_object('12 moderator reads 30 days of analytics', n = 30);
  select count(*) into n from public.admin_appeals_queue('open') where id in (aid, bid);
  res := res || jsonb_build_object('13 moderator sees both open appeals', n = 2);
  ok := false; begin perform public.admin_review_appeal(aid, 'granted', 'ok'); exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('14 decision needs a real note', ok);
  ok := false; begin perform public.admin_review_appeal(bid, 'granted', 'Reviewed and agreed to restore.'); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('15 moderator cannot lift a ban', ok);
  perform public.admin_review_appeal(aid, 'granted', 'Evidence shows a mistake; restored.');
  reset role;
  select account_status into st from public.profiles where id = u;
  res := res || jsonb_build_object('16 granted appeal restores the account', st = 'active');
  select count(*) into c from public.audit_logs where action = 'review_appeal' and actor_id = m;
  res := res || jsonb_build_object('17 decision audited', c = 1);

  perform set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false; begin perform public.admin_save_location(null, null, 'country', 'Testland', 'testland', 0, true); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('18 moderator cannot edit locations', ok);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.admin_review_appeal(bid, 'denied', 'Ban stands after review.');
  select id into lib from public.locations where kind = 'country' and iso_code = 'LR';
  lid := public.admin_save_location(null, lib, 'region', 'Test County', 'test-county', 99, true);
  res := res || jsonb_build_object('19 admin adds a location', lid is not null);
  perform public.admin_save_location(lid, lib, 'region', 'Test County', 'test-county', 99, false);
  ok := false; begin perform public.admin_save_location(null, lib, 'region', 'Dup', 'test-county', 1, true); exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('20 duplicate slug refused', ok);
  ok := false; begin perform public.admin_save_location(null, lib, 'region', 'Bad', 'Bad Slug!', 1, true); exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('21 invalid slug refused', ok);
  select count(*) into n from public.admin_list_locations() where id = lid and is_active = false;
  res := res || jsonb_build_object('22 location can be switched off', n = 1);
  select count(*) into n from public.admin_report_breakdown();
  res := res || jsonb_build_object('23 report breakdown works', n >= 0);
  reset role;
  select count(*) into c from public.audit_logs where action in ('create_location', 'update_location') and actor_id = adm;
  res := res || jsonb_build_object('24 location edits audited', c = 2);
  select account_status into st from public.profiles where id = b;
  res := res || jsonb_build_object('25 denied appeal leaves ban in place', st = 'banned');

  raise exception 'RESULTS %', res::text;
end $$;
