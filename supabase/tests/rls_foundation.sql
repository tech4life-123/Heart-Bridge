-- HeartBridge Phase 1: behavioural RLS / trigger tests.
-- Run in the Supabase SQL Editor (as postgres). It creates temporary test users,
-- exercises the rules, and ALWAYS rolls back by raising an exception whose message
-- is the JSON result. Expect every value to be `true`. Leaves no data behind.

do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  c uuid := gen_random_uuid();
  d uuid := gen_random_uuid();
  res jsonb := '{}'::jsonb;
  n int;
  ok boolean;
begin
  -- Signup trigger
  insert into auth.users (id, aud, role, email, raw_user_meta_data) values
    (a, 'authenticated', 'authenticated', 'a@test.invalid', '{"first_name":"Ama","date_of_birth":"1995-05-20"}'),
    (b, 'authenticated', 'authenticated', 'b@test.invalid', '{"first_name":"Bo","date_of_birth":"1990-01-01"}');
  select count(*) into n from public.profiles where id in (a, b);
  res := res || jsonb_build_object('01 adult signup creates profiles', n = 2);
  select count(*) into n from public.user_settings where user_id in (a, b);
  res := res || jsonb_build_object('02 settings rows created', n = 2);

  -- 18+ rule
  ok := false;
  begin
    insert into auth.users (id, aud, role, email, raw_user_meta_data) values
      (c, 'authenticated', 'authenticated', 'c@test.invalid',
       jsonb_build_object('first_name', 'Kid', 'date_of_birth', (current_date - interval '17 years 364 days')::date::text));
  exception when others then ok := true; end;
  res := res || jsonb_build_object('03 under-18 signup rejected', ok);
  select count(*) into n from auth.users where id = c;
  res := res || jsonb_build_object('04 rejected signup leaves no user', n = 0);

  ok := false;
  begin
    insert into auth.users (id, aud, role, email, raw_user_meta_data) values
      (c, 'authenticated', 'authenticated', 'c@test.invalid', '{"first_name":"NoDob"}');
  exception when others then ok := true; end;
  res := res || jsonb_build_object('05 missing DOB rejected', ok);

  ok := false;
  begin
    insert into auth.users (id, aud, role, email, raw_user_meta_data) values
      (c, 'authenticated', 'authenticated', 'c@test.invalid', '{"first_name":"Bad","date_of_birth":"not-a-date"}');
  exception when others then ok := true; end;
  res := res || jsonb_build_object('06 malformed DOB rejected', ok);

  ok := false;
  begin
    insert into auth.users (id, aud, role, email, raw_user_meta_data) values
      (c, 'authenticated', 'authenticated', 'c@test.invalid',
       jsonb_build_object('first_name', '', 'date_of_birth', '1995-05-20'));
  exception when others then ok := true; end;
  res := res || jsonb_build_object('07 empty first name rejected', ok);

  insert into auth.users (id, aud, role, email, raw_user_meta_data) values
    (d, 'authenticated', 'authenticated', 'd@test.invalid',
     jsonb_build_object('first_name', 'Eighteen', 'date_of_birth', (current_date - interval '18 years')::date::text));
  select count(*) into n from public.profiles where id = d;
  res := res || jsonb_build_object('08 exactly-18 allowed', n = 1);

  -- As signed-in user A
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.profiles;
  res := res || jsonb_build_object('09 user sees only own profile', n = 1);
  select count(*) into n from public.user_settings;
  res := res || jsonb_build_object('10 user sees only own settings', n = 1);

  update public.profiles set first_name = 'Ama2' where id = a;
  get diagnostics n = row_count;
  res := res || jsonb_build_object('11 user can edit own first name', n = 1);

  update public.profiles set first_name = 'Hacked' where id = b;
  get diagnostics n = row_count;
  res := res || jsonb_build_object('12 user cannot edit another profile', n = 0);

  ok := false;
  begin update public.profiles set date_of_birth = '2000-01-01' where id = a;
  exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('13 user cannot change own DOB', ok);

  ok := false;
  begin update public.profiles set account_status = 'active' where id = a;
  exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('14 user cannot change account_status', ok);

  ok := false;
  begin insert into public.profiles (id, first_name, date_of_birth) values (gen_random_uuid(), 'Fake', '1990-01-01');
  exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('15 user cannot insert profiles directly', ok);

  ok := false;
  begin delete from public.profiles where id = a;
  exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('16 user cannot delete profile', ok);

  ok := false;
  begin perform 1 from public.admin_roles;
  exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('17 user cannot read admin_roles', ok);

  ok := false;
  begin insert into public.admin_roles (user_id, role) values (a, 'admin');
  exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('18 user cannot self-grant admin', ok);

  ok := false;
  begin insert into public.audit_logs (action, entity_type) values ('x', 'y');
  exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('19 user cannot write audit_logs', ok);

  select count(*) into n from public.audit_logs;
  res := res || jsonb_build_object('20 non-admin sees no audit logs', n = 0);

  update public.app_settings set value = '"PAID"' where key = 'launch_mode';
  get diagnostics n = row_count;
  res := res || jsonb_build_object('21 non-admin cannot change settings', n = 0);

  select public.is_admin() into ok;
  res := res || jsonb_build_object('22 non-admin is_admin false', ok = false);

  reset role;

  -- Anonymous visitor
  set local role anon;
  select count(*) into n from public.app_settings;
  res := res || jsonb_build_object('23 anon reads public launch settings (3 rows)', n = 3);
  ok := false;
  begin perform 1 from public.profiles;
  exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('24 anon cannot read profiles', ok);
  ok := false;
  begin perform public.is_admin();
  exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('25 anon cannot call is_admin', ok);
  reset role;

  -- Admin path
  insert into public.admin_roles (user_id, role) values (a, 'admin');
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select public.is_admin() into ok;
  res := res || jsonb_build_object('26 admin recognised', ok);
  select count(*) into n from public.profiles;
  res := res || jsonb_build_object('27 admin can see all profiles', n = 3);
  update public.app_settings set value = '"PAID"' where key = 'launch_mode';
  get diagnostics n = row_count;
  res := res || jsonb_build_object('28 admin can change settings', n = 1);
  select count(*) into n from public.audit_logs where action = 'app_setting.updated';
  res := res || jsonb_build_object('29 admin sees the audit entry', n = 1);
  ok := false;
  begin update public.app_settings set is_public = false where key = 'launch_mode';
  exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('30 admin limited to editing value only', ok);
  reset role;

  -- Audit log integrity (as table owner)
  ok := false;
  begin update public.audit_logs set action = 'tampered';
  exception when others then ok := true; end;
  res := res || jsonb_build_object('31 audit update blocked', ok);
  ok := false;
  begin delete from public.audit_logs;
  exception when others then ok := true; end;
  res := res || jsonb_build_object('32 audit delete blocked', ok);

  -- Deleting a user who appears in the audit log must still work
  delete from auth.users where id = a;
  select count(*) into n from public.audit_logs where action = 'app_setting.updated' and actor_id is null;
  res := res || jsonb_build_object('33 deleting an audited user anonymises log, not blocked', n = 1);
  select count(*) into n from public.profiles where id = a;
  res := res || jsonb_build_object('34 profile cascades on user delete', n = 0);

  raise exception 'RESULTS %', res::text;
end $$;
