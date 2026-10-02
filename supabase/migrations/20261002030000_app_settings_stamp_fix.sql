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
