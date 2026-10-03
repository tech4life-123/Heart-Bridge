-- HeartBridge notifications: behavioural tests. Run in the Supabase SQL Editor (as postgres).
-- Needs app_settings.notify_secret to exist. Rolls back by raising an exception whose message is the JSON result.
-- Every value must be `true`.

do $$
declare
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid();
  lib uuid; mont uuid; mid uuid; sec text;
  res jsonb := '{}'::jsonb; n int; ok boolean; r record; oid bigint; s record;
begin
  select (value #>> '{}') into sec from public.app_settings where key = 'notify_secret';
  insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data) values
    (a, 'authenticated', 'authenticated', 'na@test.invalid', now(), '{"first_name":"Ama","date_of_birth":"1995-05-20"}'),
    (b, 'authenticated', 'authenticated', 'nb@test.invalid', now(), '{"first_name":"Bo","date_of_birth":"1993-03-03"}');
  select id into lib from public.locations where kind = 'country' and iso_code = 'LR';
  select id into mont from public.locations where kind = 'region' and slug = 'montserrado' and parent_id = lib;
  update public.profiles set gender='woman', country_id=lib, region_id=mont, onboarding_completed_at=now() where id = a;
  update public.profiles set gender='man', country_id=lib, region_id=mont, onboarding_completed_at=now() where id = b;
  update public.preferences set seeking_genders='{man}', age_min=25, age_max=45 where user_id = a;
  update public.preferences set seeking_genders='{woman}', age_min=25, age_max=45 where user_id = b;

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.likes (liker_id, liked_id) values (a, b);
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.likes (liker_id, liked_id) values (b, a);
  mid := public.match_id_with(a);
  reset role;

  select count(*) into n from public.notification_outbox where kind = 'new_match' and user_id in (a, b);
  res := res || jsonb_build_object('01 a match queues one email per person', n = 2);

  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  set local role anon;
  ok := false; begin perform * from public.outbox_claim('wrong-secret', 5); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('02 wrong secret refused', ok);
  begin perform 1 from public.notification_outbox; res := res || jsonb_build_object('03 outbox not readable by the public', false);
  exception when insufficient_privilege then res := res || jsonb_build_object('03 outbox not readable by the public', true); end;
  select count(*) into n from public.outbox_claim(sec, 10);
  res := res || jsonb_build_object('04 nothing is sent before its delay', n = 0);
  reset role;

  update public.notification_outbox set send_after = now() - interval '1 minute' where user_id in (a, b);
  set local role anon;
  select count(*) into n from public.outbox_claim(sec, 10);
  reset role;
  res := res || jsonb_build_object('05 due match emails are claimed', n = 2);

  update public.notification_outbox set claimed_at = null where user_id in (a, b);
  update public.match_participants set seen_at = now() where match_id = mid and user_id = a;
  set local role anon;
  select count(*) into n from public.outbox_claim(sec, 10) where to_email = 'na@test.invalid';
  reset role;
  res := res || jsonb_build_object('06 a match already seen is skipped', n = 0);

  insert into public.messages (match_id, sender_id, body) values (mid, b, 'secret words'), (mid, b, 'second one');
  select count(*) into n from public.notification_outbox where kind = 'new_message' and user_id = a;
  res := res || jsonb_build_object('07 many messages queue only one email', n = 1);
  update public.notification_outbox set send_after = now() - interval '1 minute' where kind = 'new_message';

  set local role anon;
  select * into r from public.outbox_claim(sec, 10) where kind = 'new_message';
  reset role;
  res := res || jsonb_build_object('08 message email is claimed with names only',
    r.to_email = 'na@test.invalid' and r.other_name = 'Bo' and not (r.payload::text like '%secret%'));
  oid := r.id;
  set local role anon;
  perform public.outbox_finish(sec, oid, true, null);
  reset role;
  select * into s from public.notification_outbox where id = oid;
  res := res || jsonb_build_object('09 finishing marks it sent', s.sent_at is not null);

  insert into public.messages (match_id, sender_id, body) values (mid, b, 'third');
  update public.notification_outbox set send_after = now() - interval '1 minute' where kind = 'new_message' and sent_at is null;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.set_notification_settings(true, false);
  select * into s from public.my_notification_settings();
  res := res || jsonb_build_object('10 member can turn message emails off', s.email_messages = false and s.email_matches = true);
  reset role;
  set local role anon;
  select count(*) into n from public.outbox_claim(sec, 10) where kind = 'new_message';
  reset role;
  res := res || jsonb_build_object('11 opted-out member gets no message email', n = 0);

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select * into s from public.my_notification_settings();
  res := res || jsonb_build_object('12 defaults are on', s.email_matches and s.email_messages);
  reset role;

  raise exception 'RESULTS %', res::text;
end $$;
