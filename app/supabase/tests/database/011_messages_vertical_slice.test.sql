begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(21);

select extensions.has_function(
  'api', 'list_conversation_summaries',
  array['text', 'text', 'smallint', 'timestamp with time zone', 'uuid', 'integer'],
  'Messages uses one filter, search, and complete priority-keyset projection'
);
select extensions.has_function(
  'api', 'list_messages_waiting', array[]::text[],
  'Messages Waiting uses one fixed, capped projection'
);
select extensions.has_function(
  'api', 'get_messages_counts', array[]::text[],
  'Messages badges and filters use one canonical count projection'
);
select extensions.ok(
  coalesce(
    pg_get_function_result(to_regprocedure('api.get_conversation_detail(uuid)'))
      like '%read_only_reason%connection_state%ask_question%',
    false
  ),
  'conversation detail exposes fixed read-only, Connection, and Ask context'
);

select extensions.ok(
  coalesce(
    pg_get_function_result(
      to_regprocedure('api.send_connection_request(uuid,uuid,text,uuid)')
    ) like 'TABLE(result_code text, request_id uuid)',
    false
  ),
  'Connection request creation returns a stable result row'
);
select extensions.ok(
  coalesce(
    pg_get_function_result(
      to_regprocedure('api.respond_to_connection_request(uuid,text)')
    ) like 'TABLE(result_code text, connection_id uuid, conversation_id uuid)',
    false
  ),
  'Connection decisions return stable IDs for safe navigation and retries'
);
select extensions.ok(
  coalesce(
    pg_get_function_result(to_regprocedure('api.disconnect(uuid)'))
      like 'TABLE(result_code text)',
    false
  ),
  'disconnect returns a stable result row'
);
select extensions.ok(
  coalesce(
    pg_get_function_result(to_regprocedure('api.block_member(uuid)'))
      like 'TABLE(result_code text)',
    false
  ),
  'blocking returns a stable result row'
);

select extensions.ok(
  coalesce(
    lower(pg_get_functiondef(to_regprocedure('private.respond_to_connection_request(uuid,text)')))
      like '%intro_message%insert into public.messages%',
    false
  ),
  'accepting a Connection preserves its intro as one durable user message'
);

select extensions.ok(
  coalesce(
    lower(pg_get_functiondef(to_regprocedure('private.broadcast_user_control_event(uuid,text,jsonb)')))
      like '%eventid%gen_random_uuid%',
    false
  ),
  'every owner control event receives one generated event ID'
);
select extensions.ok(
  coalesce(
    lower(pg_get_functiondef(to_regprocedure('private.broadcast_user_control_event(uuid,text,jsonb)')))
      like '%messages.changed%',
    false
  ),
  'the owner topic accepts Messages invalidations'
);
select extensions.ok(
  coalesce(
    lower(pg_get_functiondef(to_regprocedure('private.broadcast_user_control_event(uuid,text,jsonb)')))
      like '%connections.changed%',
    false
  ),
  'the owner topic accepts Connection invalidations'
);

select extensions.ok(
  coalesce(
    has_function_privilege(
      'authenticated',
      to_regprocedure(
        'api.list_conversation_summaries(text,text,smallint,timestamp with time zone,uuid,integer)'
      ),
      'execute'
    ),
    false
  ),
  'authenticated members can execute the Messages conversation projection'
);
select extensions.ok(
  coalesce(
    has_function_privilege(
      'authenticated', to_regprocedure('api.list_messages_waiting()'), 'execute'
    ),
    false
  ),
  'authenticated members can execute the Messages Waiting projection'
);
select extensions.ok(
  coalesce(
    has_function_privilege(
      'authenticated', to_regprocedure('api.get_messages_counts()'), 'execute'
    ),
    false
  ),
  'authenticated members can execute the canonical Messages counts'
);

select extensions.ok(
  coalesce(
    pg_get_function_result(to_regprocedure('api.get_my_member_context(uuid)'))
      like '%messages_attention_count%',
    false
  ),
  'member shell context exposes the canonical Messages attention count'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.connection_requests', 'select'),
  'authenticated members cannot select raw Connection requests'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.connections', 'select'),
  'authenticated members cannot select raw Connections'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.conversations', 'select'),
  'authenticated members cannot select raw conversations'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.messages', 'select'),
  'authenticated members cannot select raw messages'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.conversation_reads', 'select'),
  'authenticated members cannot select raw conversation reads'
);

select * from extensions.finish();
rollback;
