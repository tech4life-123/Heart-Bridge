-- Only stamp updated_by/updated_at when the setting's value actually changes.
-- Previously the trigger also fired on the ON DELETE SET NULL cascade that runs
-- when a user is deleted, and re-stamped updated_by with that same (now deleted)
-- user, violating the foreign key.
create or replace function public.app_settings_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.value is distinct from old.value then
    new.updated_at = now();
    new.updated_by = (select auth.uid());
  end if;
  return new;
end;
$$;

-- Same cause: the audit trigger also fired on that cascade and tried to log the
-- deleted user as actor. Audit only real value changes.
create or replace function public.app_settings_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.value is distinct from old.value then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    values (
      (select auth.uid()),
      'app_setting.updated',
      'app_setting',
      new.key,
      jsonb_build_object('old', old.value, 'new', new.value)
    );
  end if;
  return new;
end;
$$;

revoke execute on function public.app_settings_audit() from public, anon, authenticated;
