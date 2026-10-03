-- HeartBridge Phase 7 + 9: behavioural tests for payments, premium gates, who-liked-you and AI metering.
-- Run in the Supabase SQL Editor (as postgres). Rolls back by raising an exception whose
-- message is the JSON result. Every value must be `true`. Leaves no data behind.

do $$
declare
  fin uuid := gen_random_uuid(); mod uuid := gen_random_uuid();
  u uuid := gen_random_uuid(); w uuid := gen_random_uuid(); x uuid := gen_random_uuid();
  lib uuid; mont uuid; pid uuid; pid2 uuid;
  res jsonb := '{}'::jsonb; n int; ok boolean; prem boolean; until timestamptz; until2 timestamptz;
begin
  insert into auth.users (id, aud, role, email, raw_user_meta_data) values
    (fin, 'authenticated', 'authenticated', 'fin@test.invalid', '{"first_name":"Fin","date_of_birth":"1985-01-01"}'),
    (mod, 'authenticated', 'authenticated', 'mod@test.invalid', '{"first_name":"Mod","date_of_birth":"1985-01-01"}'),
    (u, 'authenticated', 'authenticated', 'u@test.invalid', '{"first_name":"Una","date_of_birth":"1995-05-20"}'),
    (w, 'authenticated', 'authenticated', 'w@test.invalid', '{"first_name":"Wes","date_of_birth":"1993-03-03"}'),
    (x, 'authenticated', 'authenticated', 'x@test.invalid', '{"first_name":"Xan","date_of_birth":"1993-03-03"}');
  insert into public.admin_roles (user_id, role) values (fin, 'finance'), (mod, 'moderator');
  select id into lib from public.locations where kind = 'country' and iso_code = 'LR';
  select id into mont from public.locations where kind = 'region' and slug = 'montserrado' and parent_id = lib;
  update public.profiles set gender='woman', country_id=lib, region_id=mont, onboarding_completed_at=now() where id = u;
  update public.profiles set gender='man', country_id=lib, region_id=mont, onboarding_completed_at=now() where id in (w, x);
  update public.preferences set seeking_genders='{man}', age_min=25, age_max=45 where user_id = u;
  update public.preferences set seeking_genders='{woman}', age_min=25, age_max=45 where user_id in (w, x);

  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.payment_options();
  res := res || jsonb_build_object('01 no payment option until the owner sets a wallet', n = 0);
  ok := false; begin perform public.submit_payment('orange_money', 'ABC123456', '0770000000', 200, 'USD'); exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('02 cannot submit while provider unconfigured', ok);
  reset role;
  update public.app_settings set value = '"0770000001"' where key = 'payment_orange_number';
  update public.app_settings set value = '"0880000002"' where key = 'payment_lonestar_number';
  update public.app_settings set value = '"HeartBridge"' where key = 'payment_account_name';

  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.payment_options();
  res := res || jsonb_build_object('03 both wallets shown once configured', n = 2);
  select is_premium into prem from public.my_entitlements();
  res := res || jsonb_build_object('04 not premium at first', prem = false);
  ok := false; begin perform public.submit_payment('card', 'ABC123456', '0770000000', 200, 'USD'); exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('05 card is unavailable (not configured)', ok);
  ok := false; begin perform public.submit_payment('orange_money', 'x', '0770000000', 200, 'USD'); exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('06 malformed reference rejected', ok);
  pid := public.submit_payment('orange_money', ' ab c123456 ', '0770000000', 200, 'USD');
  select count(*) into n from public.payments where provider_reference = 'ABC123456' and status = 'pending';
  res := res || jsonb_build_object('07 submission stored pending with a normalised reference', n = 1);
  select is_premium into prem from public.my_entitlements();
  res := res || jsonb_build_object('08 still NOT premium after submitting', prem = false);
  ok := false; begin perform public.submit_payment('lonestar_momo', 'ZZZ987654', '0770000000', 200, 'USD'); exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('09 only one pending payment at a time', ok);
  ok := false; begin update public.payments set status = 'successful' where id = pid; exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('10 member cannot mark own payment successful', ok);
  ok := false; begin perform public.admin_review_payment(pid, 'successful'); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('11 member cannot call finance review', ok);
  ok := false; begin perform payer_phone, reviewed_by from public.payments; exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('12 reviewer identity column is hidden from members', ok);
  ok := false; begin perform * from public.likes_received(); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('13 who-liked-you is locked for free members', ok);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', w, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false; begin perform public.submit_payment('orange_money', 'ABC123456', '0771111111', 200, 'USD'); exception when check_violation then ok := true; end;
  res := res || jsonb_build_object('14 same wallet transaction cannot pay twice', ok);
  select count(*) into n from public.payments;
  res := res || jsonb_build_object('15 members see only their own payments', n = 0);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', mod, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false; begin perform * from public.admin_payments_queue(); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('16 moderator cannot see payments', ok);
  ok := false; begin perform * from public.admin_audit_log(); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('16b finance-less staff cannot read audit', ok);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', fin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.admin_payments_queue();
  res := res || jsonb_build_object('17 finance sees the pending payment', n = 1);
  perform public.admin_review_payment(pid, 'successful', 'seen in wallet statement');
  ok := false; begin perform public.admin_review_payment(pid, 'successful'); exception when no_data_found then ok := true; end;
  res := res || jsonb_build_object('18 a payment cannot be approved twice', ok);
  ok := false; begin perform * from public.admin_stats(); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('18b finance cannot use moderation stats', ok);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select is_premium, premium_until into prem, until from public.my_entitlements();
  res := res || jsonb_build_object('19 premium after finance approval', prem and until > now() + interval '29 days');
  pid2 := public.submit_payment('lonestar_momo', 'LSC555666', '0770000000', 200, 'USD');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', fin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.admin_review_payment(pid2, 'successful');
  reset role;
  select ends_at into until2 from public.subscriptions where user_id = u;
  res := res || jsonb_build_object('20 renewal adds another 30 days', until2 > until + interval '29 days');

  perform set_config('request.jwt.claims', json_build_object('sub', w, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.likes (liker_id, liked_id) values (w, u);
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.likes_received();
  res := res || jsonb_build_object('21 premium member sees who liked them', n = 1);
  res := res || jsonb_build_object('22 free teaser count works', public.likes_received_count() = 1);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', fin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.admin_refund_payment(pid2, 'customer asked for refund');
  reset role;
  select ends_at into until2 from public.subscriptions where user_id = u;
  res := res || jsonb_build_object('23 refund removes the paid period', until2 < until + interval '1 day');
  select count(*) into n from public.audit_logs where action in ('payment_successful', 'payment_refunded');
  res := res || jsonb_build_object('24 approvals and refunds are audited', n = 3);

  perform set_config('request.jwt.claims', json_build_object('sub', w, 'role', 'authenticated')::text, true);
  set local role authenticated;
  for i in 1..10 loop perform public.ai_consume('explain'); end loop;
  res := res || jsonb_build_object('25 free members get 10 AI uses a day', not public.ai_consume('explain'));
  ok := false; begin perform public.ai_consume('safety'); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('26 safety AI is staff only', ok);
  reset role;
  set local role anon;
  ok := false; begin perform public.submit_payment('orange_money', 'ABC999999', '0770000000', 200, 'USD'); exception when insufficient_privilege then ok := true; end;
  res := res || jsonb_build_object('27 anon cannot submit payments', ok);
  reset role;

  raise exception 'RESULTS %', res::text;
end $$;