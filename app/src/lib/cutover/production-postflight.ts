export const PRODUCTION_V2_ASSERTIONS: Array<[string, string]> = [
  [
    'core_relations',
    `select (
      to_regclass('public.users') is not null and
      to_regclass('public.organizations') is not null and
      to_regclass('public.asks') is not null and
      to_regclass('public.messages') is not null and
      to_regclass('private.outbox_jobs') is not null
    )::text;`,
  ],
  [
    'auth_user_trigger',
    `select (exists (
      select 1 from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'auth' and c.relname = 'users' and not t.tgisinternal
    ))::text;`,
  ],
  [
    'storage_buckets',
    `select (count(*) filter (where id in ('avatars', 'resumes')) = 2)::text
       from storage.buckets;`,
  ],
  [
    'realtime_publication',
    `select (exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public'
    ))::text;`,
  ],
  [
    'public_rls',
    `select (not exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
    ))::text;`,
  ],
  [
    'anonymous_import_denied',
    `select (not exists (
      select 1 from information_schema.routine_privileges
      where grantee in ('anon', 'PUBLIC') and routine_schema = 'api'
        and routine_name in ('create_profile_import_proposal', 'apply_profile_import_proposal')
        and privilege_type = 'EXECUTE'
    ))::text;`,
  ],
  [
    'anonymous_storage_listing_denied',
    `select (not exists (
      select 1 from pg_policies
      where schemaname = 'storage' and tablename = 'objects'
        and ('anon' = any (roles) or 'public' = any (roles)) and cmd = 'SELECT'
    ))::text;`,
  ],
  [
    'legacy_probe_absent',
    `select (to_regclass('private.production_migration_ownership_probe') is null)::text;`,
  ],
]
