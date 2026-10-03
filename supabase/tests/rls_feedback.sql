-- HeartBridge feedback: behavioural tests. Run in the Supabase SQL Editor (as postgres).
-- Rolls back by raising an exception whose message is the JSON result. Every value must be `true`.

do $$
declare
  s uuid := gen_random_uuid(); fin uuid := gen_random_uuid(); u uuid := gen_random_uuid(); v uuid := gen_random_uuid();
  fid uuid; res jsonb := '{}'::jsonb; n int; ok boolean; stt public.feedback_status; c int; i int;
begin
  insert into auth.users (id, aud, role, email, raw_user_meta_data) values
    (s, 'authenticated', 'authenticated', 's@test.invalid', '{"first_name":"Sup","date_of_birth":"1985-01-01"}'),
    (fin, 'authenticated', 'authenticated', 'fin@test.invalid', '{"first_name":"Fin","date_of_birth":"1985-01-01"}'),
    (u, 'authenticated', 'authenticated', 'u@test.invalid', '{"first_name":"Una","date_of_birth":"1995-05-20"}'),
    (v, 'authenticated', 'authenticated', 'v@test.invalid', '{"first_name":"Val","date_of_birth":"1993-03-03"}');
  insert into public.admin_roles (user_id, role) values (s, 'support'), (fin, 'finance');

  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  set local role authenticated;
  fid := public.submit_feedback('idea', 'Please add a way to filter by language spoken.', 5, '/app/discover');
  res := res || jsonb_build_object('01 member can send feedback', fid is not null);
  ok := false; begin perform public.submit_feedback('bug', 'short', 3, null); exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('02 too-short feedback refused', ok);
  ok := false; begin perform public.submit_feedback('bug', 'A long enough message here.', 9, null); exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('03 bad rating refused', ok);
  for i in 1..4 loop perform public.submit_feedback('praise', 'Love the app, thank you very much ' || i, 4, null); end loop;
  ok := false; begin perform public.submit_feedback('praise', 'This is the sixth one in a day', 4, null); exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('04 limited to 5 a day', ok);
  begin perform 1 from public.feedback; res := res || jsonb_build_object('05 table not readable by members', false);
  exception when insufficient_privilege then res := res || jsonb_build_object('05 table not readable by members', true); end;
  ok := false; begin perform public.admin_feedback_queue(); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('06 member cannot read the inbox', ok);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', fin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false; begin perform public.admin_feedback_queue(); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('07 finance cannot read feedback', ok);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', s, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.admin_feedback_queue('new');
  res := res || jsonb_build_object('08 support reads the inbox', n >= 5);
  perform public.admin_set_feedback_status(fid, 'reviewed');
  select count(*) into n from public.admin_feedback_queue('reviewed') where id = fid;
  res := res || jsonb_build_object('09 status can change', n = 1);
  ok := false; begin perform public.admin_set_feedback_status(gen_random_uuid(), 'done'); exception when no_data_found then ok := true; end;
  res := res || jsonb_build_object('10 unknown feedback id refused', ok);
  reset role;
  select count(*) into c from public.audit_logs where action = 'set_feedback_status' and actor_id = s;
  res := res || jsonb_build_object('11 status change audited', c = 1);

  perform set_config('request.jwt.claims', json_build_object('sub', v, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.submit_feedback('other', 'A different member sending feedback.', null, null);
  reset role;
  select count(*) into c from public.feedback where user_id = v;
  res := res || jsonb_build_object('12 rating is optional', c = 1);

  raise exception 'RESULTS %', res::text;
end $$;
