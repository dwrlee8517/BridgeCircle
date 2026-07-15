begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(105);

select extensions.ok(
  coalesce(
    (select p.prosecdef from pg_proc p where p.oid = 'private.validate_reopened_ask()'::regprocedure),
    false
  ),
  'deferred reopened-Ask validation retains internal table access at commit'
);
select extensions.ok(
  coalesce(
    (select p.prosecdef from pg_proc p where p.oid = 'private.validate_ask_consistency()'::regprocedure),
    false
  ),
  'deferred Ask aggregate validation retains internal table access at commit'
);

select extensions.has_column(
  'public', 'messages', 'system_event_type',
  'messages expose a structured system event type'
);
select extensions.has_column(
  'public', 'messages', 'system_event_key',
  'messages expose an idempotent system event key'
);
select extensions.has_column(
  'public', 'messages', 'system_actor_user_id',
  'messages can retain the actor for a system event'
);

select extensions.ok(
  exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.messages'::regclass
      and c.conname = 'messages_kind_shape_check'
  ),
  'message kind shape is enforced by one explicit constraint'
);
select extensions.ok(
  exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.messages'::regclass
      and c.conname = 'messages_system_event_type_check'
  ),
  'initial system event types are constrained explicitly'
);
select extensions.ok(
  exists (
    select 1
    from pg_indexes i
    where i.schemaname = 'public'
      and i.indexname = 'messages_system_event_key_key'
      and i.indexdef like '%UNIQUE%'
      and i.indexdef like '%conversation_id%system_event_key%'
  ),
  'system event keys are unique within a conversation'
);

select extensions.has_table(
  'private', 'conversation_typing_limits',
  'private typing throttles have a dedicated table'
);
select extensions.ok(
  coalesce(
    (
      select c.relrowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'private'
        and c.relname = 'conversation_typing_limits'
    ),
    false
  ),
  'typing throttle storage has RLS enabled'
);

select extensions.ok(
  exists (
    select 1
    from pg_constraint c
    join pg_attribute a
      on a.attrelid = c.conrelid
     and a.attname = 'last_read_message_id'
    where c.conrelid = 'public.conversation_reads'::regclass
      and c.conname = 'conversation_reads_message_fk'
      and c.confdeltype = 'n'
      and c.confdelsetcols = array[a.attnum]::smallint[]
  ),
  'message deletion nulls only the nullable read cursor column'
);

select extensions.has_function(
  'private', 'lock_user_pair', array['uuid', 'uuid'],
  'one private helper owns canonical pair locking'
);
select extensions.has_function(
  'private', 'can_view_conversation', array['uuid'],
  'conversation visibility has an explicit helper'
);
select extensions.has_function(
  'private', 'can_send_to_conversation', array['uuid'],
  'conversation sendability has an explicit helper'
);
select extensions.has_function(
  'private', 'can_access_conversation_topic', array['text'],
  'Realtime topic authorization has a safe parser helper'
);
select extensions.has_function(
  'private', 'can_access_user_topic', array['text'],
  'Realtime user-control authorization has a safe parser helper'
);

select extensions.has_function(
  'api', 'get_conversation_detail', array['uuid'],
  'conversation detail is exposed through a fixed projection'
);
select extensions.has_function(
  'api', 'list_conversation_messages_before', array['uuid', 'bigint', 'integer'],
  'older message history uses a bounded API function'
);
select extensions.has_function(
  'api', 'list_conversation_messages_after', array['uuid', 'bigint', 'integer'],
  'gap recovery uses a bounded API function'
);
select extensions.has_function(
  'api', 'publish_conversation_typing', array['uuid', 'boolean'],
  'typing is published through a server-checked API function'
);

select extensions.ok(
  coalesce(
    pg_get_function_result(to_regprocedure('api.send_message(uuid,text,uuid)'))
      like 'TABLE(result_code text,%',
    false
  ),
  'send returns a stable result code instead of expected-state exceptions'
);
select extensions.ok(
  coalesce(
    pg_get_function_result(to_regprocedure('api.get_or_create_direct_conversation(uuid)'))
      like 'TABLE(result_code text,%',
    false
  ),
  'direct conversation creation returns a stable result code'
);
select extensions.ok(
  coalesce(
    pg_get_function_result(to_regprocedure('api.mark_conversation_read(uuid,bigint)'))
      like 'TABLE(result_code text,%',
    false
  ),
  'read advancement returns a stable result code'
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
  'authenticated members cannot select raw read cursors'
);

select extensions.ok(
  not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ),
  'messages are absent from the Postgres Changes publication'
);
select extensions.is(
  (select c.relreplident from pg_class c where c.oid = 'public.messages'::regclass),
  'd'::"char",
  'messages retain default replica identity after leaving Postgres Changes'
);
select extensions.ok(
  exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ),
  'notification Postgres Changes behavior remains unchanged'
);

select extensions.ok(
  exists (
    select 1
    from pg_policies p
    where p.schemaname = 'realtime'
      and p.tablename = 'messages'
      and p.policyname = 'conversation_topics_receive'
      and p.cmd = 'SELECT'
  ),
  'private conversation topics have a receive-only Realtime policy'
);
select extensions.ok(
  exists (
    select 1
    from pg_policies p
    where p.schemaname = 'realtime'
      and p.tablename = 'messages'
      and p.policyname = 'conversation_topics_receive'
      and p.qual like '%can_access_user_topic%'
  ),
  'the receive policy includes owner-only user-control topics'
);
select extensions.ok(
  not exists (
    select 1
    from pg_policies p
    where p.schemaname = 'realtime'
      and p.tablename = 'messages'
      and p.cmd in ('INSERT', 'ALL')
      and 'authenticated' = any(p.roles)
  ),
  'authenticated clients have no Realtime INSERT policy'
);
select extensions.ok(
  exists (
    select 1
    from pg_trigger t
    where t.tgrelid = 'public.messages'::regclass
      and t.tgname = 'messages_broadcast_created'
      and not t.tgisinternal
  ),
  'committed messages emit a database Broadcast invalidation'
);
select extensions.ok(
  exists (
    select 1
    from pg_trigger t
    where t.tgrelid = 'public.conversation_reads'::regclass
      and t.tgname = 'conversation_reads_broadcast_advanced'
      and not t.tgisinternal
  ),
  'advanced read cursors emit a database Broadcast invalidation'
);

select extensions.ok(
  exists (
    select 1
    from public.messages m
    where m.conversation_id = '50000000-0000-4000-8000-000000000001'
      and to_jsonb(m)->>'system_event_type' = 'connection_accepted'
      and to_jsonb(m)->>'system_event_key' is not null
  ),
  'an accepted Connection conversation carries one structured origin line'
);

select extensions.ok(
  not has_function_privilege(
    'authenticated',
    'private.can_access_conversation(uuid)',
    'execute'
  ),
  'members cannot execute the legacy all-purpose access helper directly'
);

select extensions.ok(
  not has_function_privilege(
    'authenticated',
    'private.lock_user_pair(uuid,uuid)',
    'execute'
  ),
  'members cannot execute the internal pair-lock helper'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select extensions.ok(
  private.can_access_conversation_topic(
    'conversation:50000000-0000-4000-8000-000000000001'
  ),
  'a participant can authorize the canonical private topic'
);
select extensions.is(
  private.can_access_conversation_topic('conversation:not-a-uuid'),
  false,
  'a malformed private topic returns false without raising'
);
select extensions.ok(
  private.can_view_conversation('50000000-0000-4000-8000-000000000001'),
  'connected direct participant can view history'
);
select extensions.ok(
  private.can_send_to_conversation('50000000-0000-4000-8000-000000000001'),
  'connected direct participant can send'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000005', true);
select extensions.is(
  private.can_view_conversation('50000000-0000-4000-8000-000000000001'),
  false,
  'non-participant cannot view a conversation'
);
select extensions.is(
  private.can_send_to_conversation('50000000-0000-4000-8000-000000000001'),
  false,
  'non-participant cannot send to a conversation'
);

delete from public.connections
where user_a_id = '10000000-0000-4000-8000-000000000002'
  and user_b_id = '10000000-0000-4000-8000-000000000004';
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select extensions.ok(
  private.can_view_conversation('50000000-0000-4000-8000-000000000001'),
  'disconnected direct participant retains history'
);
select extensions.is(
  private.can_send_to_conversation('50000000-0000-4000-8000-000000000001'),
  false,
  'disconnected direct participant cannot send'
);
insert into public.connections (
  user_a_id, user_b_id, origin_organization_id
) values (
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000004',
  '11111111-1111-1111-1111-111111111111'
);

insert into public.member_blocks (blocker_user_id, blocked_user_id)
values (
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000004'
);
select extensions.is(
  private.can_view_conversation('50000000-0000-4000-8000-000000000001'),
  false,
  'block hides retained conversation history'
);
select extensions.is(
  private.can_send_to_conversation('50000000-0000-4000-8000-000000000001'),
  false,
  'block prevents conversation sends'
);
delete from public.member_blocks
where blocker_user_id = '10000000-0000-4000-8000-000000000002'
  and blocked_user_id = '10000000-0000-4000-8000-000000000004';

update public.users
set account_state = 'deletion_scheduled', delete_scheduled_for = now() + interval '1 day'
where id = '10000000-0000-4000-8000-000000000004';
select extensions.ok(
  private.can_view_conversation('50000000-0000-4000-8000-000000000001'),
  'active participant retains history when the counterpart is inactive'
);
select extensions.is(
  private.can_send_to_conversation('50000000-0000-4000-8000-000000000001'),
  false,
  'active participant cannot send to an inactive counterpart'
);
update public.users
set account_state = 'active', delete_scheduled_for = null
where id = '10000000-0000-4000-8000-000000000004';

update public.users
set account_state = 'deletion_scheduled', delete_scheduled_for = now() + interval '1 day'
where id = '10000000-0000-4000-8000-000000000002';
select extensions.is(
  private.can_view_conversation('50000000-0000-4000-8000-000000000001'),
  false,
  'inactive caller cannot view a conversation'
);
select extensions.is(
  private.can_send_to_conversation('50000000-0000-4000-8000-000000000001'),
  false,
  'inactive caller cannot send to a conversation'
);
update public.users
set account_state = 'active', delete_scheduled_for = null
where id = '10000000-0000-4000-8000-000000000002';

update public.asks
set status = 'accepted', accepted_at = now(), responded_at = now()
where id = '30000000-0000-4000-8000-000000000001';
update public.asks
set status = 'resolved', ended_at = now()
where id = '30000000-0000-4000-8000-000000000001';
insert into public.conversations (
  id, kind, user_a_id, user_b_id, organization_id, ask_id
) values (
  '93000000-0000-4000-8000-000000000001',
  'ask',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000005',
  '11111111-1111-1111-1111-111111111111',
  '30000000-0000-4000-8000-000000000001'
);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000005', true);
select extensions.ok(
  private.can_view_conversation('93000000-0000-4000-8000-000000000001'),
  'resolved Ask participant retains conversation history'
);
select extensions.ok(
  private.can_send_to_conversation('93000000-0000-4000-8000-000000000001'),
  'resolved Ask participant can continue the conversation'
);

select extensions.throws_ok(
  $$
    insert into public.messages (
      conversation_id, sender_user_id, kind, body, client_nonce,
      system_event_type, system_event_key
    ) values (
      '50000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000002',
      'user', 'Malformed user message',
      '94000000-0000-4000-8000-000000000001',
      'connection_accepted', 'malformed:user'
    )
  $$,
  '23514',
  null,
  'user messages forbid system-event fields'
);
select extensions.throws_ok(
  $$
    insert into public.messages (conversation_id, kind, body)
    values (
      '50000000-0000-4000-8000-000000000001',
      'system', 'Malformed system message'
    )
  $$,
  '23514',
  null,
  'system messages require type and idempotency key'
);
select extensions.throws_ok(
  $$
    insert into public.messages (
      conversation_id, kind, body, system_event_type, system_event_key
    ) values (
      '50000000-0000-4000-8000-000000000001',
      'system', 'Unknown system message', 'unknown_event', 'malformed:unknown'
    )
  $$,
  '23514',
  null,
  'unknown system event types are rejected'
);

insert into public.messages (
  conversation_id, kind, body, system_event_type, system_event_key
) values (
  '50000000-0000-4000-8000-000000000001',
  'system', 'First idempotent origin', 'connection_accepted', 'test:duplicate-origin'
);
select extensions.throws_ok(
  $$
    insert into public.messages (
      conversation_id, kind, body, system_event_type, system_event_key
    ) values (
      '50000000-0000-4000-8000-000000000001',
      'system', 'Duplicate idempotent origin', 'connection_accepted', 'test:duplicate-origin'
    )
  $$,
  '23505',
  null,
  'duplicate system event keys fail within one conversation'
);

insert into public.users (id)
values ('94000000-0000-4000-8000-000000000002');
insert into public.messages (
  conversation_id, kind, body, system_event_type, system_event_key,
  system_actor_user_id
) values (
  '50000000-0000-4000-8000-000000000001',
  'system', 'Actor deletion fixture', 'connection_accepted', 'test:actor-delete',
  '94000000-0000-4000-8000-000000000002'
);
delete from public.users where id = '94000000-0000-4000-8000-000000000002';
select extensions.is(
  (
    select system_actor_user_id
    from public.messages
    where conversation_id = '50000000-0000-4000-8000-000000000001'
      and system_event_key = 'test:actor-delete'
  ),
  null::uuid,
  'system actor deletion nulls the actor without deleting shared history'
);

insert into public.messages (
  conversation_id, sender_user_id, kind, body, client_nonce
) values (
  '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  'user', 'Read cursor deletion fixture',
  '94000000-0000-4000-8000-000000000003'
);
insert into public.conversation_reads (
  conversation_id, user_id, last_read_message_id
) values (
  '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  (
    select id from public.messages
    where client_nonce = '94000000-0000-4000-8000-000000000003'
  )
);
delete from public.messages
where client_nonce = '94000000-0000-4000-8000-000000000003';
select extensions.ok(
  exists (
    select 1
    from public.conversation_reads
    where conversation_id = '50000000-0000-4000-8000-000000000001'
      and user_id = '10000000-0000-4000-8000-000000000002'
      and last_read_message_id is null
  ),
  'deleting a referenced message preserves the read row and nulls only its cursor'
);

select extensions.is(
  (
    select array_agg(c.column_name::text order by c.ordinal_position)
    from information_schema.columns c
    where c.table_schema = 'private'
      and c.table_name = 'conversation_typing_limits'
  ),
  array['conversation_id', 'user_id', 'is_typing', 'last_sent_at']::text[],
  'typing throttle storage contains no content or presence-history columns'
);

select extensions.is(
  private.insert_system_message(
    '50000000-0000-4000-8000-000000000001',
    'connection_accepted', 'test:system-idempotency',
    'System idempotency fixture.', null
  ),
  private.insert_system_message(
    '50000000-0000-4000-8000-000000000001',
    'connection_accepted', 'test:system-idempotency',
    'Ignored retry body.', null
  ),
  'system-message insertion returns one durable row on retry'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
create temporary table test_first_send on commit drop as
select * from api.send_message(
  '50000000-0000-4000-8000-000000000001',
  'Atomic send fixture',
  '95000000-0000-4000-8000-000000000001'
);
create temporary table test_duplicate_send on commit drop as
select * from api.send_message(
  '50000000-0000-4000-8000-000000000001',
  'Ignored duplicate fixture',
  '95000000-0000-4000-8000-000000000001'
);
select extensions.is(
  (select result_code from test_first_send),
  'sent'::text,
  'first valid send returns sent'
);
select extensions.is(
  (select result_code from test_duplicate_send),
  'duplicate'::text,
  'same nonce retry returns duplicate'
);
select extensions.is(
  (select message_id from test_duplicate_send),
  (select message_id from test_first_send),
  'same nonce retry returns the original message ID'
);
select extensions.is(
  (
    select count(*)::bigint
    from public.messages
    where client_nonce = '95000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'same nonce persists one message'
);
select extensions.is(
  (
    select count(*)::bigint
    from private.outbox_jobs
    where dedupe_key = 'message_received:' || (select message_id from test_first_send)::text
  ),
  1::bigint,
  'same nonce persists one notification outbox job'
);
select extensions.ok(
  (
    select not (payload ? 'body')
      and not (payload ? 'clientNonce')
      and payload->>'messageId' = (select message_id from test_first_send)::text
    from private.outbox_jobs
    where dedupe_key = 'message_received:' || (select message_id from test_first_send)::text
  ),
  'message outbox payload contains IDs and no message content'
);
select extensions.is(
  (
    select result_code from api.send_message(
      '50000000-0000-4000-8000-000000000001',
      '   ', '95000000-0000-4000-8000-000000000002'
    )
  ),
  'invalid_message'::text,
  'blank message returns invalid_message without writing'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000005', true);
select extensions.is(
  (
    select result_code from api.send_message(
      '50000000-0000-4000-8000-000000000001',
      'Outsider send', '95000000-0000-4000-8000-000000000003'
    )
  ),
  'not_available'::text,
  'outsider send collapses to not_available'
);

delete from public.connections
where user_a_id = '10000000-0000-4000-8000-000000000002'
  and user_b_id = '10000000-0000-4000-8000-000000000004';
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select extensions.is(
  (
    select result_code from api.send_message(
      '50000000-0000-4000-8000-000000000001',
      'Disconnected send', '95000000-0000-4000-8000-000000000004'
    )
  ),
  'connection_required'::text,
  'disconnected direct participant receives connection_required'
);
insert into public.connections (
  user_a_id, user_b_id, origin_organization_id
) values (
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000004',
  '11111111-1111-1111-1111-111111111111'
);

insert into public.member_blocks (blocker_user_id, blocked_user_id)
values (
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000004'
);
select extensions.is(
  (
    select result_code from api.send_message(
      '50000000-0000-4000-8000-000000000001',
      'Blocked send', '95000000-0000-4000-8000-000000000005'
    )
  ),
  'not_available'::text,
  'blocked participant send collapses to not_available'
);
delete from public.member_blocks
where blocker_user_id = '10000000-0000-4000-8000-000000000002'
  and blocked_user_id = '10000000-0000-4000-8000-000000000004';

select extensions.is(
  (
    select result_code from api.get_or_create_direct_conversation(
      '10000000-0000-4000-8000-000000000003'
    )
  ),
  'connection_required'::text,
  'direct creation requires a current Connection'
);
select extensions.is(
  (
    select result_code from api.get_or_create_direct_conversation(
      '95000000-0000-4000-8000-000000000099'
    )
  ),
  'not_available'::text,
  'missing direct counterpart collapses to not_available'
);

insert into public.connection_requests (
  id, requester_user_id, recipient_user_id, origin_organization_id,
  client_request_id
) values (
  '95000000-0000-4000-8000-000000000010',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '11111111-1111-1111-1111-111111111111',
  '95000000-0000-4000-8000-000000000011'
);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select extensions.lives_ok(
  $$select api.respond_to_connection_request('95000000-0000-4000-8000-000000000010', 'accept')$$,
  'Connection acceptance creates its durable aggregate'
);
select extensions.is(
  (
    select count(*)::bigint
    from public.conversations
    where kind = 'direct'
      and user_a_id = '10000000-0000-4000-8000-000000000002'
      and user_b_id = '10000000-0000-4000-8000-000000000003'
  ),
  1::bigint,
  'Connection acceptance creates one direct conversation'
);
select extensions.is(
  (
    select count(*)::bigint
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where c.kind = 'direct'
      and c.user_a_id = '10000000-0000-4000-8000-000000000002'
      and c.user_b_id = '10000000-0000-4000-8000-000000000003'
      and m.system_event_type = 'connection_accepted'
  ),
  1::bigint,
  'Connection acceptance creates one structured origin line'
);
select extensions.lives_ok(
  $$select api.respond_to_connection_request('95000000-0000-4000-8000-000000000010', 'accept')$$,
  'Connection acceptance retry is idempotent'
);
select extensions.is(
  (
    select count(*)::bigint
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where c.kind = 'direct'
      and c.user_a_id = '10000000-0000-4000-8000-000000000002'
      and c.user_b_id = '10000000-0000-4000-8000-000000000003'
      and m.system_event_type = 'connection_accepted'
  ),
  1::bigint,
  'Connection acceptance retry does not duplicate its origin line'
);
select extensions.is(
  (
    select count(*)::bigint
    from private.outbox_jobs
    where dedupe_key = 'connection_accepted:95000000-0000-4000-8000-000000000010'
  ),
  1::bigint,
  'Connection acceptance retry does not duplicate its notification job'
);

insert into public.asks (
  id, organization_id, asker_membership_id, kind, status,
  recipient_membership_id, question, request_message, client_request_id
) values (
  '95000000-0000-4000-8000-000000000020',
  '11111111-1111-1111-1111-111111111111',
  '20000000-0000-4000-8000-000000000004',
  'direct', 'waiting',
  '20000000-0000-4000-8000-000000000003',
  'Can you test the opening-message transaction?',
  'This fixture must roll back on an invalid opening message.',
  '95000000-0000-4000-8000-000000000021'
);
select extensions.is(
  (
    select result_code from api.respond_to_direct_ask(
      '95000000-0000-4000-8000-000000000020',
      'accept', '   ', null, null,
      '95000000-0000-4000-8000-000000000022'
    )
  ),
  'invalid_input'::text,
  'invalid opening message returns a stable result without accepting the Ask'
);
select extensions.is(
  (select status from public.asks where id = '95000000-0000-4000-8000-000000000020'),
  'waiting'::text,
  'failed direct Ask acceptance leaves the Ask waiting'
);
select extensions.is(
  (
    select count(*)::bigint from public.conversations
    where ask_id = '95000000-0000-4000-8000-000000000020'
  ),
  0::bigint,
  'failed direct Ask acceptance leaves no conversation'
);
select extensions.lives_ok(
  $$
    select api.respond_to_direct_ask(
      '95000000-0000-4000-8000-000000000020',
      'accept', 'Happy to test this with you.', null, null,
      '95000000-0000-4000-8000-000000000023'
    )
  $$,
  'valid direct Ask acceptance commits the aggregate'
);
select extensions.is(
  (
    select count(*)::bigint from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where c.ask_id = '95000000-0000-4000-8000-000000000020'
      and m.kind = 'system' and m.system_event_type = 'ask_accepted'
  ),
  1::bigint,
  'direct Ask acceptance creates one origin line'
);
select extensions.is(
  (
    select count(*)::bigint from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where c.ask_id = '95000000-0000-4000-8000-000000000020'
      and m.kind = 'user'
  ),
  1::bigint,
  'direct Ask acceptance creates one opening user message'
);

insert into public.ask_offers (
  id, organization_id, ask_id, helper_membership_id,
  offer_note, client_request_id
) values (
  '95000000-0000-4000-8000-000000000030',
  '11111111-1111-1111-1111-111111111111',
  '30000000-0000-4000-8000-000000000002',
  '20000000-0000-4000-8000-000000000006',
  'I can help exercise the offer acceptance transaction.',
  '95000000-0000-4000-8000-000000000031'
);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select extensions.lives_ok(
  $$
    select api.decide_offer(
      '95000000-0000-4000-8000-000000000030',
      'accept', 'Thank you for offering to help.', null, null,
      '95000000-0000-4000-8000-000000000032'
    )
  $$,
  'circle offer acceptance commits the aggregate'
);
select extensions.is(
  (
    select count(*)::bigint from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where c.ask_id = '30000000-0000-4000-8000-000000000002'
      and m.kind = 'system' and m.system_event_type = 'ask_accepted'
  ),
  1::bigint,
  'circle offer acceptance creates one origin line'
);
select extensions.is(
  (
    select count(*)::bigint from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where c.ask_id = '30000000-0000-4000-8000-000000000002'
      and m.kind = 'user'
  ),
  1::bigint,
  'circle offer acceptance creates one opening user message'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select extensions.is(
  (
    select count(*)::bigint
    from api.get_conversation_detail('50000000-0000-4000-8000-000000000001')
  ),
  1::bigint,
  'participant receives one bounded conversation detail row'
);
select extensions.is(
  (
    select counterpart_display_name
    from api.get_conversation_detail('50000000-0000-4000-8000-000000000001')
  ),
  'Mei Park'::text,
  'conversation detail exposes only the bounded counterpart identity'
);
select extensions.ok(
  (
    select can_send
    from api.get_conversation_detail('50000000-0000-4000-8000-000000000001')
  ),
  'connected detail reports sendability'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000005', true);
select extensions.is(
  (
    select count(*)::bigint
    from api.get_conversation_detail('50000000-0000-4000-8000-000000000001')
  ),
  0::bigint,
  'outsider receives no detail row'
);

delete from public.connections
where user_a_id = '10000000-0000-4000-8000-000000000002'
  and user_b_id = '10000000-0000-4000-8000-000000000004';
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select extensions.ok(
  (
    select count(*) = 1 and not bool_or(can_send)
    from api.get_conversation_detail('50000000-0000-4000-8000-000000000001')
  ),
  'disconnected participant retains one read-only detail row'
);
insert into public.connections (
  user_a_id, user_b_id, origin_organization_id
) values (
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000004',
  '11111111-1111-1111-1111-111111111111'
);

insert into public.member_blocks (blocker_user_id, blocked_user_id)
values (
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000004'
);
select extensions.is(
  (
    select count(*)::bigint
    from api.get_conversation_detail('50000000-0000-4000-8000-000000000001')
  ),
  0::bigint,
  'blocked participant receives no detail row'
);
delete from public.member_blocks
where blocker_user_id = '10000000-0000-4000-8000-000000000002'
  and blocked_user_id = '10000000-0000-4000-8000-000000000004';

insert into public.messages (
  conversation_id, sender_user_id, kind, body, client_nonce
)
select
  '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  'user', 'Pagination fixture ' || g,
  md5('conversation-pagination-' || g)::uuid
from generate_series(1, 105) g;
select extensions.is(
  (
    select count(*)::bigint
    from api.list_conversation_messages_before(
      '50000000-0000-4000-8000-000000000001', null, 500
    )
  ),
  100::bigint,
  'older-history limit clamps to 100'
);
select extensions.is(
  (
    select count(*)::bigint
    from api.list_conversation_messages_before(
      '50000000-0000-4000-8000-000000000001', null, 0
    )
  ),
  1::bigint,
  'older-history limit clamps to at least one'
);
create temporary table test_page_one on commit drop as
select id from api.list_conversation_messages_before(
  '50000000-0000-4000-8000-000000000001', null, 100
);
create temporary table test_page_two on commit drop as
select id from api.list_conversation_messages_before(
  '50000000-0000-4000-8000-000000000001',
  (select min(id) from test_page_one), 100
);
select extensions.is(
  (
    select count(*)::bigint
    from test_page_one first_page
    join test_page_two second_page using (id)
  ),
  0::bigint,
  'adjacent keyset pages do not duplicate message IDs'
);
select extensions.ok(
  pg_get_functiondef(
    'private.list_conversation_messages_before(uuid,bigint,integer)'::regprocedure
  ) not ilike '%offset%',
  'message history contains no OFFSET pagination'
);

create temporary table test_high_read on commit drop as
select * from api.mark_conversation_read(
  '50000000-0000-4000-8000-000000000001',
  (select max(id) from public.messages where conversation_id = '50000000-0000-4000-8000-000000000001')
);
create temporary table test_low_read on commit drop as
select * from api.mark_conversation_read(
  '50000000-0000-4000-8000-000000000001',
  (select min(id) from test_page_one)
);
select extensions.is(
  (select result_code from test_high_read),
  'advanced'::text,
  'higher read cursor returns advanced'
);
select extensions.is(
  (select result_code from test_low_read),
  'unchanged'::text,
  'lower read cursor returns unchanged'
);
select extensions.is(
  (select last_read_at from test_low_read),
  (select last_read_at from test_high_read),
  'lower read cursor does not rewrite last_read_at'
);
select extensions.is(
  (
    select result_code from api.mark_conversation_read(
      '50000000-0000-4000-8000-000000000001', 9223372036854775807
    )
  ),
  'invalid_cursor'::text,
  'foreign or missing cursor returns invalid_cursor'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000005', true);
select extensions.is(
  (
    select result_code from api.mark_conversation_read(
      '50000000-0000-4000-8000-000000000001',
      (select max(id) from public.messages where conversation_id = '50000000-0000-4000-8000-000000000001')
    )
  ),
  'not_available'::text,
  'outsider read advancement collapses to not_available'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
create temporary table test_counterpart_read on commit drop as
select * from api.mark_conversation_read(
  '50000000-0000-4000-8000-000000000001',
  (select max(id) from public.messages where conversation_id = '50000000-0000-4000-8000-000000000001')
);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select extensions.is(
  (
    select counterpart_last_read_message_id
    from api.get_conversation_detail('50000000-0000-4000-8000-000000000001')
  ),
  (select max(id) from public.messages where conversation_id = '50000000-0000-4000-8000-000000000001'),
  'detail exposes the counterpart read cursor without raw cursor access'
);

create temporary table test_realtime_before_rollback on commit drop as
select count(*)::bigint as event_count
from realtime.messages
where event = 'message.created';
savepoint message_broadcast_rollback;
insert into public.messages (
  conversation_id, sender_user_id, kind, body, client_nonce
) values (
  '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  'user', 'This message and its Broadcast are rolled back.',
  '95000000-0000-4000-8000-000000000099'
);
rollback to savepoint message_broadcast_rollback;
select extensions.is(
  (
    select count(*)::bigint
    from realtime.messages
    where event = 'message.created'
  ),
  (select event_count from test_realtime_before_rollback),
  'rolled-back message insert leaves no durable Broadcast row'
);

select * from extensions.finish();
rollback;
