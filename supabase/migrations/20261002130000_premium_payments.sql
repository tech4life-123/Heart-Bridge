-- HeartBridge Phase 7: premium plan and mobile-money payments (Orange Money, Lonestar MTN MoMo).
-- There is no automatic provider API yet, so a payment is NEVER trusted from the browser:
-- the member sends the money to HeartBridge's merchant wallet and submits the transaction
-- reference; a Finance/Super Admin staff member checks it against the real wallet statement
-- and only then marks it successful. Premium starts only from that staff decision.

create type public.payment_provider as enum ('orange_money', 'lonestar_momo', 'card');
create type public.payment_status as enum ('pending', 'successful', 'failed', 'cancelled', 'refunded');

create table public.plans (
  id text primary key,
  name text not null,
  price_usd_cents int not null check (price_usd_cents > 0),
  period_days int not null check (period_days > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
insert into public.plans (id, name, price_usd_cents, period_days)
values ('premium_monthly', 'HeartBridge Premium', 200, 30);

alter table public.plans enable row level security;
revoke all on public.plans from anon, authenticated;
grant select on public.plans to authenticated;
create policy plans_select_active on public.plans for select to authenticated using (is_active);

-- Merchant wallet details live in app_settings (private) and are shown through payment_options().
insert into public.app_settings (key, value, is_public, description) values
  ('payment_orange_number', '""', false, 'HeartBridge Orange Money merchant number (members send payment here)'),
  ('payment_lonestar_number', '""', false, 'HeartBridge Lonestar MTN MoMo merchant number (members send payment here)'),
  ('payment_account_name', '""', false, 'Name shown on the merchant wallets'),
  ('premium_daily_like_limit', '500', false, 'Likes a Premium member can send per rolling 24 hours')
on conflict (key) do nothing;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id text not null references public.plans (id),
  provider public.payment_provider not null,
  status public.payment_status not null default 'pending',
  amount_minor int not null check (amount_minor > 0),
  currency text not null check (currency in ('USD', 'LRD')),
  provider_reference text not null check (provider_reference ~ '^[A-Z0-9._-]{6,40}$'),
  payer_phone text not null check (payer_phone ~ '^\+?[0-9 ]{7,20}$'),
  review_note text constraint payments_note_len check (review_note is null or char_length(review_note) <= 500),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_user_idx on public.payments (user_id, created_at desc);
create index payments_status_idx on public.payments (status, created_at);
create index payments_reviewed_by_idx on public.payments (reviewed_by);
create index payments_plan_idx on public.payments (plan_id);
-- One wallet transaction can pay for one membership only.
create unique index payments_reference_uniq
  on public.payments (provider, provider_reference) where status in ('pending', 'successful');

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;
revoke all on public.payments from anon, authenticated;
grant select (id, user_id, plan_id, provider, status, amount_minor, currency, provider_reference, review_note, created_at, updated_at)
  on public.payments to authenticated;
create policy payments_select_own on public.payments for select to authenticated using (user_id = (select auth.uid()));

create table public.subscriptions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  plan_id text not null references public.plans (id),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  last_payment_id uuid references public.payments (id) on delete set null,
  updated_at timestamptz not null default now()
);
create index subscriptions_plan_idx on public.subscriptions (plan_id);
create index subscriptions_payment_idx on public.subscriptions (last_payment_id);
alter table public.subscriptions enable row level security;
revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;
create policy subscriptions_select_own on public.subscriptions for select to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Entitlements
-- ---------------------------------------------------------------------------
create function public.user_is_premium(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.subscriptions s where s.user_id = p_user and s.ends_at > now());
$$;
revoke execute on function public.user_is_premium(uuid) from public, anon, authenticated;

create function public.my_entitlements()
returns table (is_premium boolean, premium_until timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(s.ends_at > now(), false), s.ends_at
  from (select 1) x
  left join public.subscriptions s on s.user_id = (select auth.uid());
$$;
revoke execute on function public.my_entitlements() from public, anon;
grant execute on function public.my_entitlements() to authenticated;

create function public.payment_options()
returns table (provider public.payment_provider, wallet_number text, account_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select 'orange_money'::public.payment_provider, v.n, a.n
  from (select btrim(value #>> '{}') n from public.app_settings where key = 'payment_orange_number') v,
       (select btrim(value #>> '{}') n from public.app_settings where key = 'payment_account_name') a
  where (select auth.uid()) is not null and v.n <> ''
  union all
  select 'lonestar_momo'::public.payment_provider, v.n, a.n
  from (select btrim(value #>> '{}') n from public.app_settings where key = 'payment_lonestar_number') v,
       (select btrim(value #>> '{}') n from public.app_settings where key = 'payment_account_name') a
  where (select auth.uid()) is not null and v.n <> '';
$$;
revoke execute on function public.payment_options() from public, anon;
grant execute on function public.payment_options() to authenticated;

-- ---------------------------------------------------------------------------
-- Member submits proof of payment (never marks anything successful)
-- ---------------------------------------------------------------------------
create function public.submit_payment(
  p_provider public.payment_provider,
  p_reference text,
  p_phone text,
  p_amount_minor int,
  p_currency text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  ref text := upper(regexp_replace(btrim(coalesce(p_reference, '')), '\s', '', 'g'));
  phone text := btrim(coalesce(p_phone, ''));
  pid uuid;
begin
  if me is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_provider not in ('orange_money', 'lonestar_momo')
     or not exists (select 1 from public.payment_options() o where o.provider = p_provider) then
    raise exception 'provider_unavailable' using errcode = 'check_violation';
  end if;
  if ref !~ '^[A-Z0-9._-]{6,40}$' or phone !~ '^\+?[0-9 ]{7,20}$'
     or p_currency not in ('USD', 'LRD') or p_amount_minor is null or p_amount_minor <= 0 or p_amount_minor > 100000000 then
    raise exception 'invalid_payment' using errcode = 'check_violation';
  end if;
  if exists (select 1 from public.payments where user_id = me and status = 'pending') then
    raise exception 'payment_pending' using errcode = 'check_violation';
  end if;
  if (select count(*) from public.payments where user_id = me and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'rate_limited' using errcode = 'check_violation';
  end if;
  begin
    insert into public.payments (user_id, plan_id, provider, amount_minor, currency, provider_reference, payer_phone)
    values (me, 'premium_monthly', p_provider, p_amount_minor, p_currency, ref, phone)
    returning id into pid;
  exception when unique_violation then
    raise exception 'reference_used' using errcode = 'check_violation';
  end;
  return pid;
end;
$$;
revoke execute on function public.submit_payment(public.payment_provider, text, text, int, text) from public, anon;
grant execute on function public.submit_payment(public.payment_provider, text, text, int, text) to authenticated;

-- Member cancels their own still-pending submission (mistake in the reference, say).
create function public.cancel_my_payment(p_id uuid)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.payments set status = 'cancelled'
  where id = p_id and user_id = (select auth.uid()) and status = 'pending';
$$;
revoke execute on function public.cancel_my_payment(uuid) from public, anon;
grant execute on function public.cancel_my_payment(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Finance / Super Admin: verify against the real wallet statement
-- ---------------------------------------------------------------------------
create function public.admin_payments_queue(p_status public.payment_status default 'pending', p_limit int default 50)
returns table (
  id uuid, user_id uuid, first_name text, provider public.payment_provider, provider_reference text,
  payer_phone text, amount_minor int, currency text, status public.payment_status, created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_staff(array['finance', 'admin']::public.admin_role[]);
  return query
    select p.id, p.user_id, pr.first_name, p.provider, p.provider_reference, p.payer_phone,
           p.amount_minor, p.currency, p.status, p.created_at
    from public.payments p join public.profiles pr on pr.id = p.user_id
    where p.status = p_status
    order by p.created_at asc
    limit least(greatest(p_limit, 1), 100);
end;
$$;
revoke execute on function public.admin_payments_queue(public.payment_status, int) from public, anon;
grant execute on function public.admin_payments_queue(public.payment_status, int) to authenticated;

create function public.admin_review_payment(p_id uuid, p_decision public.payment_status, p_note text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  pay public.payments%rowtype;
  days int;
begin
  perform public.require_staff(array['finance', 'admin']::public.admin_role[]);
  if p_decision not in ('successful', 'failed') then
    raise exception 'invalid_status' using errcode = 'check_violation';
  end if;
  select * into pay from public.payments where id = p_id for update;
  if not found or pay.status <> 'pending' then
    raise exception 'not_found' using errcode = 'no_data_found';
  end if;
  update public.payments
     set status = p_decision, reviewed_by = (select auth.uid()), reviewed_at = now(), review_note = left(p_note, 500)
   where id = p_id;
  if p_decision = 'successful' then
    select period_days into days from public.plans where id = pay.plan_id;
    insert into public.subscriptions (user_id, plan_id, starts_at, ends_at, last_payment_id)
    values (pay.user_id, pay.plan_id, now(), now() + make_interval(days => days), p_id)
    on conflict (user_id) do update
      set ends_at = greatest(now(), public.subscriptions.ends_at) + make_interval(days => days),
          plan_id = excluded.plan_id,
          last_payment_id = excluded.last_payment_id,
          updated_at = now();
  end if;
  perform public.write_audit('payment_' || p_decision::text, 'payment', p_id::text,
    jsonb_build_object('provider', pay.provider, 'reference', pay.provider_reference, 'note', left(p_note, 500)));
end;
$$;
revoke execute on function public.admin_review_payment(uuid, public.payment_status, text) from public, anon;
grant execute on function public.admin_review_payment(uuid, public.payment_status, text) to authenticated;

create function public.admin_refund_payment(p_id uuid, p_note text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  pay public.payments%rowtype;
  days int;
begin
  perform public.require_staff(array['finance', 'admin']::public.admin_role[]);
  if char_length(btrim(coalesce(p_note, ''))) < 5 then
    raise exception 'reason_required' using errcode = 'check_violation';
  end if;
  select * into pay from public.payments where id = p_id for update;
  if not found or pay.status <> 'successful' then
    raise exception 'not_found' using errcode = 'no_data_found';
  end if;
  select period_days into days from public.plans where id = pay.plan_id;
  update public.payments set status = 'refunded', review_note = left(p_note, 500), reviewed_by = (select auth.uid()), reviewed_at = now()
   where id = p_id;
  update public.subscriptions set ends_at = greatest(now(), ends_at - make_interval(days => days)), updated_at = now()
   where user_id = pay.user_id;
  perform public.write_audit('payment_refunded', 'payment', p_id::text, jsonb_build_object('note', left(p_note, 500)));
end;
$$;
revoke execute on function public.admin_refund_payment(uuid, text) from public, anon;
grant execute on function public.admin_refund_payment(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Premium gate 1: higher daily like limit (free members keep 50; the core app stays usable)
-- ---------------------------------------------------------------------------
create or replace function public.likes_enforce_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  lim int;
  n int;
begin
  if public.user_is_premium(new.liker_id) then
    select (value #>> '{}')::int into lim from public.app_settings where key = 'premium_daily_like_limit';
    lim := coalesce(lim, 500);
  else
    select (value #>> '{}')::int into lim from public.app_settings where key = 'daily_like_limit';
    lim := coalesce(lim, 50);
  end if;
  select count(*) into n from public.likes
   where liker_id = new.liker_id and created_at > now() - interval '24 hours';
  if n >= lim then
    raise exception 'daily_like_limit' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Premium gate 2: see who liked you
-- ---------------------------------------------------------------------------
create function public.likes_received_ids(p_limit int)
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(x.liker_id), '{}') from (
    select l.liker_id
    from public.likes l
    where l.liked_id = (select auth.uid())
      and not exists (select 1 from public.likes m where m.liker_id = l.liked_id and m.liked_id = l.liker_id)
      and not exists (select 1 from public.passes p where p.user_id = l.liked_id and p.target_id = l.liker_id)
      and public.can_view_profile(l.liker_id)
    order by l.created_at desc
    limit least(greatest(p_limit, 1), 100)
  ) x;
$$;
revoke execute on function public.likes_received_ids(int) from public, anon, authenticated;

create function public.likes_received_count()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_length(public.likes_received_ids(100), 1), 0);
$$;
revoke execute on function public.likes_received_count() from public, anon;
grant execute on function public.likes_received_count() to authenticated;

create function public.likes_received(p_limit int default 30)
returns setof public.profile_card
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.user_is_premium((select auth.uid())) then
    raise exception 'premium_required' using errcode = '42501';
  end if;
  return query select * from public.profile_cards(public.likes_received_ids(p_limit));
end;
$$;
revoke execute on function public.likes_received(int) from public, anon;
grant execute on function public.likes_received(int) to authenticated;

-- ---------------------------------------------------------------------------
-- AI usage metering (Phase 9): a daily allowance per member, higher for Premium.
-- ---------------------------------------------------------------------------
create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  feature text not null check (feature in ('explain', 'starters', 'profile', 'safety')),
  created_at timestamptz not null default now()
);
create index ai_usage_user_idx on public.ai_usage (user_id, created_at desc);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

create function public.ai_consume(p_feature text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  lim int;
  n int;
begin
  if me is null or p_feature not in ('explain', 'starters', 'profile', 'safety') then
    return false;
  end if;
  if p_feature = 'safety' then
    perform public.require_staff(array['moderator', 'admin']::public.admin_role[]);
    lim := 200;
  else
    lim := case when public.user_is_premium(me) then 50 else 10 end;
  end if;
  select count(*) into n from public.ai_usage where user_id = me and created_at > now() - interval '24 hours';
  if n >= lim then
    return false;
  end if;
  insert into public.ai_usage (user_id, feature) values (me, p_feature);
  return true;
end;
$$;
revoke execute on function public.ai_consume(text) from public, anon;
grant execute on function public.ai_consume(text) to authenticated;
