-- Profile-import commands are an authenticated RPC surface. PostgreSQL grants
-- EXECUTE to PUBLIC for newly created functions unless it is revoked, so the
-- original migration's authenticated grants also left these callable by anon.
revoke execute on function api.apply_profile_import(uuid, uuid, jsonb, boolean)
  from public, anon;
revoke execute on function api.begin_profile_import(uuid, uuid, text, text)
  from public, anon;
revoke execute on function api.decline_profile_import(uuid, uuid)
  from public, anon;
revoke execute on function api.fail_profile_import(uuid, text, jsonb)
  from public, anon;
revoke execute on function api.finish_profile_import(uuid, jsonb, jsonb, text, jsonb, jsonb, numeric)
  from public, anon;
revoke execute on function api.get_my_profile_import(uuid, uuid)
  from public, anon;

grant execute on function api.apply_profile_import(uuid, uuid, jsonb, boolean)
  to authenticated;
grant execute on function api.begin_profile_import(uuid, uuid, text, text)
  to authenticated;
grant execute on function api.decline_profile_import(uuid, uuid)
  to authenticated;
grant execute on function api.fail_profile_import(uuid, text, jsonb)
  to authenticated;
grant execute on function api.finish_profile_import(uuid, jsonb, jsonb, text, jsonb, jsonb, numeric)
  to authenticated;
grant execute on function api.get_my_profile_import(uuid, uuid)
  to authenticated;

-- The avatars bucket remains public, so known object URLs remain readable
-- without an anonymous SELECT policy. Removing this broad policy prevents
-- clients from enumerating every object in the bucket through the Data API.
drop policy if exists avatars_public_read on storage.objects;

create policy avatars_owner_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
