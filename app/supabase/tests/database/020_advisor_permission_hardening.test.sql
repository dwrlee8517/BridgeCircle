begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(4);

select extensions.is(
  (
    select count(*)::bigint
    from unnest(array[
      'api.apply_profile_import(uuid,uuid,jsonb,boolean)',
      'api.begin_profile_import(uuid,uuid,text,text)',
      'api.decline_profile_import(uuid,uuid)',
      'api.fail_profile_import(uuid,text,jsonb)',
      'api.finish_profile_import(uuid,jsonb,jsonb,text,jsonb,jsonb,numeric)',
      'api.get_my_profile_import(uuid,uuid)'
    ]::text[]) as signature
    where has_function_privilege('anon', to_regprocedure(signature), 'execute')
  ),
  0::bigint,
  'anonymous users cannot execute profile-import RPCs'
);

select extensions.is(
  (
    select count(*)::bigint
    from unnest(array[
      'api.apply_profile_import(uuid,uuid,jsonb,boolean)',
      'api.begin_profile_import(uuid,uuid,text,text)',
      'api.decline_profile_import(uuid,uuid)',
      'api.fail_profile_import(uuid,text,jsonb)',
      'api.finish_profile_import(uuid,jsonb,jsonb,text,jsonb,jsonb,numeric)',
      'api.get_my_profile_import(uuid,uuid)'
    ]::text[]) as signature
    where has_function_privilege('authenticated', to_regprocedure(signature), 'execute')
  ),
  6::bigint,
  'signed-in users retain the reviewed profile-import RPC surface'
);

select extensions.ok(
  (
    select public
    from storage.buckets
    where id = 'avatars'
  )
  and not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and cmd in ('SELECT', 'ALL')
      and (roles @> array['public'::name] or roles @> array['anon'::name])
  ),
  'avatar URLs stay public without an anonymous object-listing policy'
);

select extensions.ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatars_owner_select'
      and cmd = 'SELECT'
      and roles @> array['authenticated'::name]
  ),
  'signed-in owners retain avatar metadata access for replacement uploads'
);

select * from extensions.finish();
rollback;
