-- HeartBridge Phase 5: behavioural tests for matches and messaging.
-- Run in the Supabase SQL Editor (as postgres). Creates temporary users, exercises the
-- rules and ALWAYS rolls back by raising an exception whose message is the JSON result.
-- Every value must be `true`. Leaves no data behind.

do $$
declare
  a uuid := gen_random_uuid();  -- woman
  b uuid := gen_random_uuid();  -- man, mutual with A
  c uuid := gen_random_uuid();  -- man, A likes C but C never likes back
  d uuid := gen_random_uuid();  -- outsider man
  lib uuid; mont uuid;
  mid uuid; mid2 uuid; msg uuid;
  res jsonb := '{}'::jsonb;
  n int; ok boolean; t timestamptz;
begin
  insert into auth.users (id, aud, role, email, raw_user_meta_data) values
    (a, 'authenticated', 'authenticated', 'a@test.invalid', '{"first_name":"Ama","date_of_birth":"1995-05-20"}'),
    (b, 'authenticated', 'authenticated', 'b@test.invalid', '{"first_name":"Bo","date_of_birth":"1993-03-03"}'),
    (c, 'authenticated', 'authenticated', 'c@test.invalid', '{"first_name":"Cee","date_of_birth":"1990-01-01"}'),
    (d, 'authenticated', 'authenticated', 'd@test.invalid', '{"first_name":"Dee","date_of_birth":"1991-02-02"}');
  select id into lib from public.locations where kind = 'country' and iso_code = 'LR';
  select id into mont from public.locations where kind = 'region' and slug = 'montserrado' and parent_id = lib;
  update public.profiles set gender='woman', country_id=lib, region_id=mont, onboarding_completed_at=now() where id = a;
  update public.profiles set gender='man', country_id=lib, region_id=mont, onboarding_completed_at=now() where id in (b, c, d);
  update public.preferences set seeking_genders='{man}', age_min=25, age_max=45 where user_id = a;
  update public.preferences set seeking_genders='{woman}', age_min=25, age_max=45 where user_id in (b, c, d);

  -- ===== A likes B and C =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.likes (liker_id, liked_id) values (a, b), (a, c);
  reset role;
  select count(*) into n from public.matches;
  res := res || jsonb_build_object('01 a one-sided like creates no match', n = 0);

  -- ===== B likes A back =====
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.likes (liker_id, liked_id) values (b, a);
  mid := public.match_id_with(a);
  reset role;
  select count(*) into n from public.matches;
  res := res || jsonb_build_object('02 mutual like creates exactly one match', n = 1 and mid is not null);
  select count(*) into n from public.match_participants where match_id = mid;
  res := res || jsonb_build_object('03 both people get a participant row', n = 2);

  -- ===== A =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.my_matches();
  res := res || jsonb_build_object('04 A sees the match (and only that one)', n = 1);
  res := res || jsonb_build_object('05 A sees it as new', (select is_new from public.my_matches() limit 1));
  res := res || jsonb_build_object('06 match_id_with(C) is null (no match)', public.match_id_with(c) is null);
  msg := public.send_message(mid, '  Hello Bo  ');
  select count(*) into n from public.messages where body = 'Hello Bo';
  res := res || jsonb_build_object('07 message is trimmed and stored', n = 1);
  ok := false;
  begin perform public.send_message(mid, '   '); exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('08 empty message rejected', ok);
  ok := false;
  begin perform public.send_message(mid, repeat('x', 2001)); exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('09 over-long message rejected', ok);
  ok := false;
  begin insert into public.messages (match_id, sender_id, body) values (mid, a, 'direct'); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('10 direct insert into messages is impossible', ok);
  ok := false;
  begin insert into public.matches (user_a, user_b) values (least(a, d), greatest(a, d)); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('11 cannot create a match by hand', ok);
  reset role;

  -- ===== B reads, unread counters =====
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select unread into n from public.my_matches() limit 1;
  res := res || jsonb_build_object('12 B has 1 unread message', n = 1);
  select count(*) into n from public.messages where match_id = mid;
  res := res || jsonb_build_object('13 B can read the conversation', n = 1);
  perform public.mark_conversation_read(mid);
  select unread into n from public.my_matches() limit 1;
  res := res || jsonb_build_object('14 reading clears unread', n = 0);
  res := res || jsonb_build_object('16 chat_meta works for B', (select first_name from public.chat_meta(mid)) = 'Ama');
  reset role;

  -- ===== outsiders (C, D) =====
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.messages;
  res := res || jsonb_build_object('17 C (liked but not matched) reads no messages', n = 0);
  select count(*) into n from public.matches;
  res := res || jsonb_build_object('18 C sees no matches', n = 0);
  select count(*) into n from public.match_participants;
  res := res || jsonb_build_object('19 C sees no participant rows', n = 0);
  ok := false;
  begin perform public.send_message(mid, 'let me in'); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('20 C cannot message in someone else''s match', ok);
  res := res || jsonb_build_object('21 C gets no chat_meta for it', (select count(*) from public.chat_meta(mid)) = 0);
  perform public.hide_conversation(mid);  -- C is not a participant: must change nothing
  reset role;
  select hidden_at is null into ok from public.match_participants where match_id = mid and user_id = a;
  res := res || jsonb_build_object('23 ...and A''s state was untouched', ok);

  set local role anon;
  ok := false;
  begin perform * from public.messages; exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('24 anon cannot read messages', ok);
  ok := false;
  begin perform public.send_message(mid, 'x'); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('25 anon cannot send', ok);
  reset role;

  -- ===== hiding a conversation affects A's view only =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.hide_conversation(mid);
  select count(*) into n from public.messages where match_id = mid;
  res := res || jsonb_build_object('26 A no longer sees old messages', n = 0);
  select count(*) into n from public.my_matches();
  res := res || jsonb_build_object('27 hidden empty conversation leaves A''s list', n = 0);
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.messages where match_id = mid;
  res := res || jsonb_build_object('28 B still sees the history', n = 1);
  perform public.send_message(mid, 'Are you there?');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.messages where match_id = mid;
  res := res || jsonb_build_object('29 a new message brings it back, without old history', n = 1);
  select count(*) into n from public.my_matches();
  res := res || jsonb_build_object('30 conversation is listed again', n = 1);
  reset role;

  -- ===== rate limit =====
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false;
  begin
    for i in 1..25 loop perform public.send_message(mid, 'spam ' || i); end loop;
  exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('31 bursts of messages are rate limited', ok);
  reset role;

  -- ===== blocks =====
  insert into public.blocks (blocker_id, blocked_id) values (a, b);
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false;
  begin perform public.send_message(mid, 'after block'); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('32 blocked person cannot message', ok);
  select count(*) into n from public.my_matches();
  res := res || jsonb_build_object('33 block removes the match from both lists', n = 0);
  res := res || jsonb_build_object('34 can_message is false after a block', (select not can_message from public.chat_meta(mid)));
  reset role;

  raise exception 'RESULTS %', res::text;
end $$;
