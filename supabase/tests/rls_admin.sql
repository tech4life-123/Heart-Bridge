-- HeartBridge Phase 8: behavioural tests for staff roles, moderation and audit.
-- Run in the Supabase SQL Editor (as postgres). Rolls back by raising an exception whose
-- message is the JSON result. Every value must be `true`. Leaves no data behind.

do $$
declare
  adm uuid := gen_random_uuid(); m uuid := gen_random_uuid(); s uuid := gen_random_uuid();
  u uuid := gen_random_uuid(); t uuid := gen_random_uuid(); v uuid := gen_random_uuid();
  lib uuid; mont uuid; mid uuid; rid uuid;
  res jsonb := '{}'::jsonb; n int; ok boolean; st public.account_status; c int;
begin
  insert into auth.users (id, aud, role, email, raw_user_meta_data) values
    (adm, 'authenticated', 'authenticated', 'adm@test.invalid', '{"first_name":"Admin","date_of_birth":"1985-01-01"}'),
    (m, 'authenticated', 'authenticated', 'm@test.invalid', '{"first_name":"Mod","date_of_birth":"1985-01-01"}'),
    (s, 'authenticated', 'authenticated', 's@test.invalid', '{"first_name":"Supp","date_of_birth":"1985-01-01"}'),
    (u, 'authenticated', 'authenticated', 'u@test.invalid', '{"first_name":"Una","date_of_birth":"1995-05-20"}'),
    (t, 'authenticated', 'authenticated', 't@test.invalid', '{"first_name":"Tom","date_of_birth":"1993-03-03"}'),
    (v, 'authenticated', 'authenticated', 'v@test.invalid', '{"first_name":"Vic","date_of_birth":"1993-03-03"}');
  insert into public.admin_roles (user_id, role) values (adm, 'admin'), (m, 'moderator'), (s, 'support');
  select id into lib from public.locations where kind = 'country' and iso_code = 'LR';
  select id into mont from public.locations where kind = 'region' and slug = 'montserrado' and parent_id = lib;
  update public.profiles set gender='woman', country_id=lib, region_id=mont, onboarding_completed_at=now() where id = u;
  update public.profiles set gender='man', country_id=lib, region_id=mont, onboarding_completed_at=now() where id in (t, v);
  update public.preferences set seeking_genders='{man}', age_min=25, age_max=45 where user_id = u;
  update public.preferences set seeking_genders='{woman}', age_min=25, age_max=45 where user_id in (t, v);

  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.likes (liker_id, liked_id) values (u, t);
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', t, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.likes (liker_id, liked_id) values (t, u);
  mid := public.match_id_with(u);
  perform public.send_message(mid, 'hello');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.report_user(t, 'harassment', 'rude');
  ok := false; begin perform * from public.admin_stats(); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('01 normal user cannot read admin stats', ok);
  ok := false; begin perform * from public.admin_report_queue(); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('02 normal user cannot open report queue', ok);
  ok := false; begin perform public.admin_set_account_status(t, 'suspended', 'because I said so'); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('03 normal user cannot suspend', ok);
  ok := false; begin perform public.admin_set_staff_role(u, 'admin'); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('04 normal user cannot grant admin', ok);
  res := res || jsonb_build_object('05 staff_role is null for normal user', public.staff_role() is null);
  ok := false; begin perform 1 from public.admin_roles; exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('06 admin_roles table unreadable', ok);
  reset role;
  set local role anon;
  ok := false; begin perform * from public.admin_stats(); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('07 anon cannot call admin functions', ok);
  reset role;

  select id into rid from public.reports where reporter_id = u and reported_id = t;

  perform set_config('request.jwt.claims', json_build_object('sub', s, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.admin_find_user('u@test.invalid');
  res := res || jsonb_build_object('08 support finds a user by exact email', n = 1);
  select count(*) into n from public.admin_user_overview(u) where bio is null and photo_paths = '{}';
  res := res || jsonb_build_object('09 support overview hides bio and photos', n = 1);
  ok := false; begin perform * from public.admin_report_queue(); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('10 support cannot see reports', ok);
  ok := false; begin perform public.admin_warn_user(t, 'please be respectful'); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('11 support cannot warn', ok);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.admin_report_queue();
  res := res || jsonb_build_object('12 moderator sees the open report', n = 1);
  select count(*) into n from public.admin_find_user('u@test.invalid');
  res := res || jsonb_build_object('13 moderator cannot search by email', n = 0);
  select count(*) into n from public.admin_report_messages(rid);
  res := res || jsonb_build_object('14 moderator reads only the reported conversation', n = 1);
  perform public.admin_warn_user(t, 'please be respectful');
  perform public.admin_set_account_status(t, 'suspended', 'harassment report confirmed');
  reset role;
  select account_status into st from public.profiles where id = t;
  res := res || jsonb_build_object('15 moderator can suspend', st = 'suspended');
  perform set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false; begin perform public.admin_set_account_status(v, 'banned', 'abusive behaviour'); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('16 moderator cannot ban', ok);
  ok := false; begin perform public.admin_set_account_status(adm, 'suspended', 'trying to suspend admin'); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('17 staff cannot be moderated by a moderator', ok);
  ok := false; begin perform public.admin_set_account_status(v, 'suspended', 'no'); exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('18 a reason is required', ok);
  ok := false; begin perform * from public.admin_audit_log(); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('19 moderator cannot read the audit log', ok);
  perform public.admin_set_report_status(rid, 'resolved', 'suspended');
  reset role;
  select count(*) into n from public.reports where id = rid and status = 'resolved' and resolved_by = m;
  res := res || jsonb_build_object('20 report resolved by the moderator', n = 1);

  perform set_config('request.jwt.claims', json_build_object('sub', t, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false; begin perform public.send_message(mid, 'still here'); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('21 suspended person cannot message', ok);
  select count(*) into n from public.user_warnings where user_id = t;
  res := res || jsonb_build_object('22 target can read their own warning', n = 1);
  select count(*) into n from public.user_warnings w where w.user_id <> t;
  res := res || jsonb_build_object('23 target cannot read others warnings', n = 0);
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.my_matches();
  res := res || jsonb_build_object('24 suspended person disappears from matches', n = 0);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.admin_set_account_status(v, 'banned', 'confirmed scammer');
  perform public.admin_set_account_status(t, 'active', 'appeal accepted');
  select count(*) into n from public.admin_audit_log() where action in ('ban_user', 'restore_user', 'suspend_user', 'warn_user', 'view_reported_messages', 'report_resolved');
  res := res || jsonb_build_object('25 every action is in the audit log', n = 6);
  ok := false; begin perform public.admin_set_staff_role(adm, null); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('26 admin cannot change their own role', ok);
  perform public.admin_set_staff_role(u, 'support');
  select count(*) into n from public.admin_list_staff();
  res := res || jsonb_build_object('27 admin can grant a role', n = 4);
  perform public.admin_set_staff_role(u, null);
  select count(*) into n from public.admin_list_staff();
  res := res || jsonb_build_object('28 admin can remove a role', n = 3);
  select open_reports into c from public.admin_stats();
  res := res || jsonb_build_object('29 stats work', c = 0);
  ok := false; begin update public.audit_logs set action = 'x'; exception when others then ok := true; end;
  res := res || jsonb_build_object('30 audit log cannot be edited', ok);
  reset role;

  raise exception 'RESULTS %', res::text;
end $$;
