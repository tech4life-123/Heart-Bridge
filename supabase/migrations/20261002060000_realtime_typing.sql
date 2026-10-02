-- HeartBridge Phase 5: typing indicator over private Realtime broadcast.
-- Topic shape: "typing:<match uuid>". Only the two matched people may join or send.
-- Nothing is stored; broadcast messages are ephemeral.

create function public.can_use_typing_topic(p_topic text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_topic ~ '^typing:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and exists (
      select 1 from public.match_participants mp
      where mp.match_id = substr(p_topic, 8)::uuid
        and mp.user_id = (select auth.uid()));
$$;
revoke execute on function public.can_use_typing_topic(text) from public, anon;
grant execute on function public.can_use_typing_topic(text) to authenticated;

create policy typing_receive on realtime.messages
  for select to authenticated
  using (extension = 'broadcast' and (select public.can_use_typing_topic((select realtime.topic()))));

create policy typing_send on realtime.messages
  for insert to authenticated
  with check (extension = 'broadcast' and (select public.can_use_typing_topic((select realtime.topic()))));
