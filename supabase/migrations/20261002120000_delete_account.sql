-- HeartBridge Phase 10: self-service account deletion (run in the SQL Editor; Supabase asks for approval because it deletes).

-- A person can permanently delete their own account. Everything that belongs to them
-- (profile, photos rows, likes, matches, messages, settings) is removed by foreign-key cascades.
-- Refused while the account is under review, so deleting cannot be used to escape a report,
-- and never for staff accounts.
create function public.delete_my_account()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = me and account_status = 'active') then
    raise exception 'review_open' using errcode = 'check_violation';
  end if;
  if exists (select 1 from public.admin_roles where user_id = me) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if exists (select 1 from public.reports where reported_id = me and status in ('open', 'reviewing'))
     or exists (select 1 from public.safety_flags where user_id = me and status = 'open') then
    raise exception 'review_open' using errcode = 'check_violation';
  end if;
  perform public.write_audit('delete_own_account', 'user', me::text);
  delete from auth.users where id = me;
end;
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
