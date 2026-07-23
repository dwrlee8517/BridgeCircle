begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(30);

select extensions.has_schema('api', 'api schema exists');
select extensions.has_schema('private', 'private schema exists');

select extensions.has_table('public', 'users', 'users table exists');
select extensions.has_table('public', 'organization_memberships', 'memberships table exists');
select extensions.has_table('public', 'profiles', 'profiles table exists');
select extensions.has_table('public', 'asks', 'unified asks table exists');
select extensions.has_table('public', 'ask_offers', 'ask offers table exists');
select extensions.has_table('public', 'conversations', 'unified conversations table exists');
select extensions.has_table('public', 'messages', 'messages table exists');
select extensions.has_table('public', 'conversation_reads', 'conversation reads table exists');
select extensions.has_table('public', 'member_blocks', 'member blocks table exists');
select extensions.has_table('public', 'events', 'events table exists');
select extensions.has_table('public', 'notifications', 'notifications table exists');
select extensions.has_table('public', 'notification_preferences', 'notification preferences table exists');

select extensions.has_table('private', 'ask_matches', 'private Ask matches exist');
select extensions.has_table('private', 'conversation_typing_limits', 'private typing throttle storage exists');
select extensions.has_table('private', 'outbox_jobs', 'private outbox exists');
select extensions.has_table('private', 'reports', 'private reports exist');
select extensions.has_table('private', 'profile_embedding_chunks', 'private embeddings exist');

select extensions.ok(
  to_regclass('public.friendships') is null
    and to_regclass('public.friend_requests') is null
    and to_regclass('public.open_asks') is null
    and to_regclass('public.ask_threads') is null
    and to_regclass('public.direct_message_threads') is null,
  'legacy split persistence tables are absent'
);

select extensions.ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'asks'
      and column_name = 'accepted_offer_id'
  ),
  'asks has no circular accepted_offer_id foreign key'
);

select extensions.is(
  (
    select count(*)::bigint
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'private')
      and c.relkind = 'r'
      and c.relname in (
        'users', 'organizations', 'organization_memberships', 'invites',
        'admin_role_assignments', 'profiles', 'organization_profiles',
        'profile_experiences', 'profile_education', 'profile_skills',
        'profile_field_visibility', 'helper_preferences', 'helper_topics',
        'asks', 'ask_offers', 'connection_requests', 'connections',
        'member_blocks', 'conversations', 'messages', 'conversation_reads',
        'events', 'event_rsvps', 'announcements', 'notifications',
        'notification_preferences', 'ask_matches', 'ask_events', 'reports',
        'moderation_actions', 'outbox_jobs', 'audit_log',
        'conversation_typing_limits',
        'profile_embedding_chunks', 'profile_embedding_status',
        'profile_enrichment_settings', 'profile_enrichment_runs',
        'profile_change_proposals', 'profile_enrichment_jobs'
      )
      and c.relrowsecurity
  ),
  39::bigint,
  'all 39 application tables have RLS enabled'
);

select extensions.ok(
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.prosecdef
      and (
        n.nspname = 'public'
        or (
          n.nspname = 'api'
          and not coalesce(p.proconfig @> array['search_path=""']::text[], false)
        )
      )
  ),
  'exposed security-definer functions are API-only with an empty search path'
);

select extensions.ok(
  exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'conversations_pair_key'
      and indexdef not like '% WHERE %'
  ),
  'conversation uniqueness is global for every unordered user pair'
);

select extensions.ok(
  exists (select 1 from pg_extension where extname = 'vector'),
  'pgvector extension is installed'
);

select extensions.ok(
  exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth' and c.relname = 'users'
      and t.tgname = 'on_auth_user_created' and not t.tgisinternal
  ),
  'auth user creation trigger is installed'
);

select extensions.ok(
  not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ),
  'messages are absent from the Postgres Changes publication'
);

select extensions.ok(
  exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ),
  'notifications is in the Realtime publication'
);

select extensions.is(
  (select count(*)::bigint from storage.buckets where id in ('avatars', 'resumes')),
  2::bigint,
  'avatar and resume buckets are present'
);

select extensions.ok(
  not exists (
    select 1
    from pg_constraint fk
    join pg_class table_class on table_class.oid = fk.conrelid
    join pg_namespace table_namespace on table_namespace.oid = table_class.relnamespace
    where fk.contype = 'f'
      and table_namespace.nspname in ('public', 'private')
      and not exists (
        select 1
        from pg_index index_definition
        where index_definition.indrelid = fk.conrelid
          and index_definition.indisvalid
          and index_definition.indisready
          and (
            index_definition.indpred is null
            or (
              pg_get_expr(index_definition.indpred, index_definition.indrelid) like '%IS NOT NULL%'
              and pg_get_expr(index_definition.indpred, index_definition.indrelid) not like '%=%'
            )
          )
          and (
            select array_agg(index_column.attnum order by index_column.ordinality)
            from unnest(index_definition.indkey)
              with ordinality as index_column(attnum, ordinality)
            where index_column.ordinality <= cardinality(fk.conkey)
          ) = fk.conkey
      )
  ),
  'every public and private foreign key has a leading-column index'
);

select * from extensions.finish();
rollback;
