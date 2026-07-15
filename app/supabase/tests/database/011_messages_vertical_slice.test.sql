begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(59);

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
    lower(pg_get_functiondef(to_regprocedure('private.lock_user_pair(uuid,uuid)')))
      like '%pg_advisory_xact_lock%',
    false
  ),
  'pair mutations serialize on one canonical transaction advisory lock'
);

select extensions.ok(
  (
    select bool_and(function_row.prosecdef)
    from pg_proc function_row
    join pg_namespace function_schema on function_schema.oid = function_row.pronamespace
    where function_schema.nspname = 'api'
      and function_row.proname in (
        'list_conversation_summaries', 'list_messages_waiting',
        'get_messages_counts', 'send_connection_request',
        'respond_to_connection_request', 'disconnect', 'block_member',
        'get_conversation_detail', 'get_my_member_context'
      )
  ),
  'Messages fixed APIs cross the revoked private boundary as security definers'
);

select extensions.ok(
  coalesce(
    lower(pg_get_functiondef(to_regprocedure('private.broadcast_user_control_event(uuid,text,jsonb)')))
      like '%''id''%gen_random_uuid%',
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
  not exists (
    select 1
    from pg_proc function_row
    join pg_namespace function_schema on function_schema.oid = function_row.pronamespace
    where function_schema.nspname = 'api'
      and function_row.proname in (
        'list_conversation_summaries', 'list_messages_waiting',
        'get_messages_counts', 'send_connection_request',
        'respond_to_connection_request', 'disconnect', 'block_member'
      )
      and has_function_privilege('anon', function_row.oid, 'execute')
  ),
  'anonymous clients cannot execute Messages or Connection APIs'
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

select set_config(
  'request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true
);
set local role authenticated;
select extensions.is(
  (
    select count(*)::integer
    from api.list_conversation_summaries(p_query => 'Mei Park')
  ),
  1,
  'a participant can isolate their seeded direct conversation'
);
select extensions.is(
  (
    select counterpart_display_name
    from api.list_conversation_summaries()
    where conversation_id = '50000000-0000-4000-8000-000000000001'
  ),
  'Mei Park',
  'the summary resolves the other participant identity'
);
select extensions.is(
  (
    select unread_count
    from api.list_conversation_summaries()
    where conversation_id = '50000000-0000-4000-8000-000000000001'
  ),
  0,
  'the deterministic acceptance seed preserves the direct read cursor'
);
select extensions.is(
  (
    select needs_reply
    from api.list_conversation_summaries()
    where conversation_id = '50000000-0000-4000-8000-000000000001'
  ),
  false,
  'a fully read direct conversation does not need a reply'
);
select extensions.is(
  (
    select count(*)::integer
    from api.list_conversation_summaries(p_query => 'Mei')
  ),
  1,
  'bounded Messages search matches the displayed counterpart name'
);
select extensions.is(
  (
    select count(*)::integer
    from api.list_conversation_summaries(p_query => 'Seoul')
  ),
  0,
  'Messages search does not inspect message bodies'
);
select extensions.is(
  (
    select count(*)::integer
    from api.list_conversation_summaries(p_filter => 'unread')
  ),
  1,
  'the Unread filter finds the one unread accepted Ask'
);
select extensions.is(
  (
    select count(*)::integer
    from api.list_conversation_summaries(p_filter => 'my_circle')
  ),
  1,
  'the My circle filter follows the current Connection'
);
select extensions.is(
  (
    select count(*)::integer
    from api.list_conversation_summaries(p_filter => 'open_asks')
  ),
  1,
  'only the accepted Ask is classified as open'
);
select extensions.is(
  (select all_count from api.get_messages_counts()),
  32,
  'canonical counts include both bounded Messages seed pages'
);
select extensions.is(
  (select unread_count from api.get_messages_counts()),
  1,
  'canonical counts report one unread conversation rather than one message total'
);
select extensions.is(
  (select my_circle_count from api.get_messages_counts()),
  1,
  'canonical counts report one current-circle conversation'
);
select extensions.is(
  (select waiting_count from api.get_messages_counts()),
  3,
  'canonical counts include the direct Ask and two Connection requests'
);
reset role;

select set_config(
  'request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true
);
set local role authenticated;
select extensions.is(
  (select count(*)::integer from api.list_conversation_summaries()),
  1,
  'a member sees their own retained direct history but no other pair conversations'
);
select extensions.is(
  (select count(*)::integer from api.list_messages_waiting()),
  1,
  'a direct Ask recipient sees one Waiting item'
);
select extensions.is(
  (select item_id from api.list_messages_waiting()),
  '30000000-0000-4000-8000-000000000001'::uuid,
  'the Waiting projection returns the authorized direct Ask ID'
);
select extensions.is(
  (select waiting_count from api.get_messages_counts()),
  1,
  'the canonical Waiting count reuses the Waiting projection semantics'
);
reset role;

select set_config(
  'messages.latest_unread_id',
  (
    select max(message.id)::text
    from public.messages message
    where message.conversation_id = '50000000-0000-4000-8000-000000000002'
  ),
  true
);
select set_config(
  'request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true
);
set local role authenticated;
select extensions.is(
  (
    select result_code
    from api.mark_conversation_read(
      '50000000-0000-4000-8000-000000000002',
      current_setting('messages.latest_unread_id')::bigint
    )
  ),
  'advanced',
  'marking the unread Ask at its latest message advances the read cursor'
);
select extensions.is(
  (select coalesce(sum(unread_count), 0)::integer from api.list_conversation_summaries()),
  0,
  'advancing the read cursor clears all summary unread count'
);
select extensions.is(
  (select unread_count from api.get_messages_counts()),
  0,
  'advancing the read cursor clears the canonical unread badge'
);
select extensions.is(
  (
    select result_code
    from api.block_member('10000000-0000-4000-8000-000000000004')
  ),
  'blocked',
  'blocking a connected counterpart returns a stable result row'
);
select extensions.is(
  (
    select count(*)::integer
    from api.list_conversation_summaries(p_query => 'Mei Park')
  ),
  0,
  'a blocked pair disappears from the Messages projection'
);
reset role;

select set_config(
  'request.jwt.claim.sub', '10000000-0000-4000-8000-000000000006', true
);
set local role authenticated;
select extensions.is(
  (
    select result_code
    from api.send_connection_request(
      '10000000-0000-4000-8000-000000000005',
      '11111111-1111-4111-8111-111111111111',
      'A deterministic intro.',
      'b1000000-0000-4000-8000-000000000001'
    )
  ),
  'created',
  'the first valid Connection request returns created'
);
reset role;

select set_config(
  'messages.test_request_id',
  (
    select request.id::text
    from public.connection_requests request
    where request.client_request_id = 'b1000000-0000-4000-8000-000000000001'
  ),
  true
);
select extensions.is(
  (
    select count(*)::integer
    from public.connection_requests request
    where request.client_request_id = 'b1000000-0000-4000-8000-000000000001'
      and request.status = 'pending'
  ),
  1,
  'Connection request creation persists one pending row'
);

set local role authenticated;
select extensions.is(
  (
    select result_code
    from api.send_connection_request(
      '10000000-0000-4000-8000-000000000005',
      '11111111-1111-4111-8111-111111111111',
      'A deterministic intro.',
      'b1000000-0000-4000-8000-000000000001'
    )
  ),
  'existing',
  'an identical Connection retry returns the existing durable result'
);
select extensions.is(
  (
    select result_code
    from api.send_connection_request(
      '10000000-0000-4000-8000-000000000005',
      '11111111-1111-4111-8111-111111111111',
      'A different intro.',
      'b1000000-0000-4000-8000-000000000001'
    )
  ),
  'idempotency_conflict',
  'a same-key different-payload Connection retry fails closed'
);
reset role;

select set_config(
  'request.jwt.claim.sub', '10000000-0000-4000-8000-000000000005', true
);
set local role authenticated;
select extensions.is(
  (
    select result_code
    from api.respond_to_connection_request(
      current_setting('messages.test_request_id')::uuid,
      'accept'
    )
  ),
  'accepted',
  'the recipient can accept the pending Connection with a stable result'
);
select extensions.is(
  (
    select result_code
    from api.respond_to_connection_request(
      current_setting('messages.test_request_id')::uuid,
      'accept'
    )
  ),
  'already_decided',
  'an accepted Connection replay returns its stable terminal result'
);
reset role;

select extensions.is(
  (
    select request.status
    from public.connection_requests request
    where request.id = current_setting('messages.test_request_id')::uuid
  ),
  'accepted',
  'Connection acceptance persists one terminal request state'
);
select extensions.is(
  (
    select count(*)::integer
    from public.connections connection
    where connection.connection_request_id = current_setting('messages.test_request_id')::uuid
  ),
  1,
  'Connection acceptance persists one canonical Connection'
);
select extensions.is(
  (
    select count(*)::integer
    from public.conversations conversation
    where conversation.kind = 'direct'
      and conversation.user_a_id = '10000000-0000-4000-8000-000000000005'
      and conversation.user_b_id = '10000000-0000-4000-8000-000000000006'
  ),
  1,
  'Connection acceptance persists one canonical direct conversation'
);
select extensions.is(
  (
    select count(*)::integer
    from public.messages message
    where message.client_nonce = 'b1000000-0000-4000-8000-000000000001'
      and message.kind = 'user'
  ),
  1,
  'Connection acceptance preserves the intro as one user message'
);
select extensions.is(
  (
    select message.sender_user_id
    from public.messages message
    where message.client_nonce = 'b1000000-0000-4000-8000-000000000001'
  ),
  '10000000-0000-4000-8000-000000000006'::uuid,
  'the preserved intro is authored by the requester'
);
select extensions.is(
  (
    select count(*)::integer
    from public.messages message
    where message.system_event_key =
      'connection_accepted:' || current_setting('messages.test_request_id')
  ),
  1,
  'Connection acceptance persists one idempotent origin system line'
);
select extensions.is(
  (
    select count(*)::integer
    from private.outbox_jobs job
    where job.dedupe_key =
      'connection_accepted:' || current_setting('messages.test_request_id')
  ),
  1,
  'Connection acceptance enqueues one deduplicated notification effect'
);

select * from extensions.finish();
rollback;
