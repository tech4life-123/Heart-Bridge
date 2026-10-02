-- Photo ordering must be atomic: the (user_id, position) uniqueness is deferred
-- to the end of a transaction, so reordering happens inside these functions.
-- Both are SECURITY INVOKER: RLS and column grants still apply to the caller.

create function public.set_main_photo(p_photo_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  cur smallint;
begin
  select position into cur
    from public.profile_photos
   where id = p_photo_id and user_id = uid;
  if not found then
    raise exception 'photo_not_found' using errcode = 'no_data_found';
  end if;

  update public.profile_photos
     set position = case when id = p_photo_id then 0 else position + 1 end
   where user_id = uid
     and (id = p_photo_id or position < cur);
end;
$$;

-- Deletes the row, closes the gap in positions, and returns the storage path
-- so the caller can remove the file.
create function public.delete_profile_photo(p_photo_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  cur smallint;
  path text;
begin
  select position, storage_path into cur, path
    from public.profile_photos
   where id = p_photo_id and user_id = uid;
  if not found then
    raise exception 'photo_not_found' using errcode = 'no_data_found';
  end if;

  delete from public.profile_photos where id = p_photo_id and user_id = uid;

  update public.profile_photos
     set position = position - 1
   where user_id = uid and position > cur;

  return path;
end;
$$;

revoke execute on function public.set_main_photo(uuid) from public, anon;
revoke execute on function public.delete_profile_photo(uuid) from public, anon;
grant execute on function public.set_main_photo(uuid) to authenticated;
grant execute on function public.delete_profile_photo(uuid) to authenticated;
