begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(42);

select extensions.has_table(
  'private', 'help_ai_usage_windows',
  'member Help AI cost guards use private count-only storage'
);
select extensions.ok(
  coalesce(
    (
      select c.relrowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'private' and c.relname = 'help_ai_usage_windows'
    ),
    false
  ),
  'Help AI usage windows have RLS enabled'
);
select extensions.has_column(
  'private', 'profile_embedding_chunks', 'search_vector',
  'permission-safe profile chunks expose a generated lexical search vector'
);
select extensions.ok(
  exists (
    select 1
    from pg_indexes i
    where i.schemaname = 'private'
      and i.tablename = 'profile_embedding_chunks'
      and i.indexdef like '%USING gin%search_vector%'
  ),
  'profile chunk lexical search has a GIN index'
);

select extensions.has_function(
  'private', 'lock_help_capacity', array['uuid', 'uuid'],
  'one helper owns stable Ask-slot and helper-capacity lock ordering'
);
select extensions.has_function('api', 'get_help_home', 'Help home uses one fixed snapshot');
select extensions.has_function('api', 'search_help_candidates', 'direct search has a private fixed projection');
select extensions.has_function('api', 'get_help_ask_detail', 'Ask detail has one caller-shaped projection');
select extensions.has_function('api', 'list_my_asks', 'owned Ask history has a keyset projection');
select extensions.has_function(
  'api', 'list_give_help',
  array['uuid', 'text', 'text', 'timestamp with time zone', 'uuid', 'integer'],
  'Give Help arms use membership-scoped tuple-keyset pagination'
);
select extensions.has_function('api', 'get_helper_preferences', 'Give mode can load coherent helper settings');
select extensions.has_function('api', 'save_helper_preferences', 'Give mode saves availability and topics atomically');
select extensions.has_function('api', 'consume_help_ai_budget', 'member AI calls have a database cost guard');
select extensions.has_function('api', 'apply_ask_matches', 'circle matches commit through one service-only transaction');
select extensions.has_function('api', 'run_help_maintenance', 'day-5/day-14 lifecycle work has one service-only command');
select extensions.has_function('api', 'materialize_notification_job', 'notification jobs materialize transactionally');
select extensions.has_function('api', 'get_outbox_email_context', 'email workers fetch a minimal current context');

select extensions.ok(
  coalesce(pg_get_function_result(to_regprocedure('api.create_direct_ask(uuid,uuid,text,text,uuid)')) like 'TABLE(result_code text,%', false),
  'direct Ask creation returns a stable result row'
);
select extensions.ok(
  coalesce(pg_get_function_result(to_regprocedure('api.create_circle_ask(uuid,text,text,boolean,uuid)')) like 'TABLE(result_code text,%', false),
  'circle Ask creation returns a stable result row'
);
select extensions.ok(
  coalesce(pg_get_function_result(to_regprocedure('api.respond_to_direct_ask(uuid,text,text,text,text,uuid)')) like 'TABLE(result_code text,%', false),
  'direct responses return a stable result row'
);
select extensions.ok(
  coalesce(pg_get_function_result(to_regprocedure('api.retract_ask(uuid)')) like 'TABLE(result_code text,%', false),
  'Ask retract returns a stable result row'
);
select extensions.ok(
  coalesce(pg_get_function_result(to_regprocedure('api.resolve_ask(uuid,text)')) like 'TABLE(result_code text,%', false),
  'Ask resolve returns a stable result row'
);
select extensions.ok(
  coalesce(pg_get_function_result(to_regprocedure('api.offer_to_help(uuid,uuid,text,uuid)')) like 'TABLE(result_code text,%', false),
  'offer creation returns a stable result row'
);
select extensions.ok(
  coalesce(pg_get_function_result(to_regprocedure('api.decide_offer(uuid,text,text,text,text,uuid)')) like 'TABLE(result_code text,%', false),
  'offer decisions return a stable result row'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.helper_preferences', 'select'),
  'authenticated members cannot select raw helper preferences'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.helper_topics', 'select'),
  'authenticated members cannot select raw helper topics'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.asks', 'select'),
  'authenticated members cannot select raw Asks'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.ask_offers', 'select'),
  'authenticated members cannot select raw Ask offers'
);

select extensions.ok(
  not has_function_privilege('authenticated', 'private.create_ask(text,uuid,uuid,text,text,text,boolean,uuid)', 'execute'),
  'members cannot bypass api Ask creation through the private implementation'
);
select extensions.ok(
  not has_function_privilege('authenticated', 'private.respond_to_direct_ask(uuid,text,text,text,text,uuid)', 'execute'),
  'members cannot bypass api direct-response projection'
);
select extensions.ok(
  not coalesce(
    has_function_privilege(
      'authenticated',
      to_regprocedure('private.list_give_help(timestamp with time zone,integer)'),
      'execute'
    ),
    false
  ),
  'members cannot call the obsolete private Give projection'
);

select extensions.ok(
  coalesce(has_function_privilege('authenticated', to_regprocedure('api.get_help_home(uuid)'), 'execute'), false),
  'authenticated members can execute Help home'
);
select extensions.ok(
  coalesce(has_function_privilege('authenticated', to_regprocedure('api.search_help_candidates(uuid,text,extensions.vector,integer)'), 'execute'), false),
  'authenticated members can execute direct Help search'
);
select extensions.ok(
  coalesce(has_function_privilege('service_role', to_regprocedure('api.run_help_maintenance(timestamp with time zone,integer)'), 'execute'), false),
  'service workers can execute lifecycle maintenance'
);
select extensions.ok(
  not coalesce(has_function_privilege('authenticated', to_regprocedure('api.run_help_maintenance(timestamp with time zone,integer)'), 'execute'), false),
  'members cannot execute lifecycle maintenance'
);
select extensions.ok(
  coalesce(has_function_privilege('service_role', to_regprocedure('api.apply_ask_matches(uuid,text,text,jsonb)'), 'execute'), false),
  'service workers can apply Ask matches'
);
select extensions.ok(
  not coalesce(has_function_privilege('authenticated', to_regprocedure('api.apply_ask_matches(uuid,text,text,jsonb)'), 'execute'), false),
  'members cannot apply Ask matches'
);
select extensions.ok(
  coalesce(has_function_privilege('service_role', to_regprocedure('api.materialize_notification_job(bigint,text)'), 'execute'), false),
  'service workers can materialize notification jobs'
);
select extensions.ok(
  not coalesce(has_function_privilege('authenticated', to_regprocedure('api.materialize_notification_job(bigint,text)'), 'execute'), false),
  'members cannot materialize notification jobs'
);

select extensions.ok(
  not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'asks'
  ),
  'Asks remain absent from Postgres Changes'
);
select extensions.ok(
  not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ask_offers'
  ),
  'Ask offers remain absent from Postgres Changes'
);
select extensions.ok(
  coalesce(
    pg_get_functiondef(to_regprocedure('private.broadcast_user_control_event(uuid,text,jsonb)'))
      like '%help.changed%',
    false
  ),
  'the private user-control Broadcast allowlist includes help.changed'
);

select * from extensions.finish();
rollback;
