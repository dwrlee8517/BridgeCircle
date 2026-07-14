begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(21);

select extensions.ok(
  not has_table_privilege('authenticated', 'public.asks', 'select'),
  'authenticated role has no raw Ask SELECT grant'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.ask_offers', 'select'),
  'authenticated role has no raw offer SELECT grant'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.profiles', 'select'),
  'authenticated role has no raw profile SELECT grant'
);
select extensions.ok(
  not has_schema_privilege('anon', 'private', 'usage'),
  'anon role cannot use the private schema'
);
select extensions.ok(
  not has_function_privilege('authenticated', 'private.pseudonymize_user(uuid)', 'execute'),
  'members cannot execute account pseudonymization'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select extensions.is(
  (
    select count(*)::bigint
    from api.list_conversation_messages_before(
      '50000000-0000-4000-8000-000000000001', null, 100
    )
  ),
  2::bigint,
  'conversation participant can read the origin and user message history'
);
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000005', true);
set local role authenticated;
select extensions.is(
  (
    select count(*)::bigint
    from api.list_conversation_messages_before(
      '50000000-0000-4000-8000-000000000001', null, 100
    )
  ),
  0::bigint,
  'non-participant cannot read another conversation messages'
);
reset role;

insert into public.users (id) values
  ('70000000-0000-4000-8000-000000000001'),
  ('70000000-0000-4000-8000-000000000002');

insert into public.organization_memberships (
  id, user_id, organization_id, status, joined_at
) values
  (
    '71000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'active', now()
  ),
  (
    '71000000-0000-4000-8000-000000000002',
    '70000000-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'active', now()
  );

insert into public.profiles (user_id, display_name) values
  ('70000000-0000-4000-8000-000000000001', 'Deletion Test Member'),
  ('70000000-0000-4000-8000-000000000002', 'History Counterpart');

insert into public.asks (
  id, organization_id, asker_membership_id, kind, status,
  recipient_membership_id, question, request_message, client_request_id,
  accepted_at, responded_at
) values (
  '72000000-0000-4000-8000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  '71000000-0000-4000-8000-000000000001',
  'direct', 'accepted',
  '71000000-0000-4000-8000-000000000002',
  'Could you help with this deletion-retention test?',
  'This accepted Ask should remain as shared history.',
  '72000000-0000-4000-8000-000000000101',
  now(), now()
);

insert into public.conversations (
  id, kind, user_a_id, user_b_id, organization_id, ask_id
) values (
  '73000000-0000-4000-8000-000000000001',
  'ask',
  '70000000-0000-4000-8000-000000000001',
  '70000000-0000-4000-8000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  '72000000-0000-4000-8000-000000000001'
);

insert into public.messages (
  conversation_id, sender_user_id, kind, body, client_nonce
) values (
  '73000000-0000-4000-8000-000000000001',
  '70000000-0000-4000-8000-000000000002',
  'user',
  'This message should remain for the counterpart member.',
  '73000000-0000-4000-8000-000000000101'
);

insert into private.reports (
  reporter_user_id, reported_user_id, reason, target_type, target_id,
  profile_user_id, evidence_snapshot
) values (
  '70000000-0000-4000-8000-000000000002',
  '70000000-0000-4000-8000-000000000001',
  'other',
  'profile',
  '70000000-0000-4000-8000-000000000001',
  '70000000-0000-4000-8000-000000000001',
  '{"displayName":"Deletion Test Member","reason":"retention fixture"}'
);

select extensions.lives_ok('set constraints all immediate', 'retention fixture satisfies deferred invariants');
set constraints all deferred;

select extensions.lives_ok(
  $$select private.pseudonymize_user('70000000-0000-4000-8000-000000000001')$$,
  'service-owned pseudonymization routine completes'
);

select extensions.lives_ok('set constraints all immediate', 'pseudonymized history satisfies deferred invariants');
set constraints all deferred;

select extensions.lives_ok(
  $$select private.pseudonymize_user('70000000-0000-4000-8000-000000000001')$$,
  'repeated pseudonymization is safe'
);
select extensions.is(
  (
    select count(*)::bigint from private.audit_log
    where action = 'account.pseudonymized'
      and target_id = '70000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'repeated pseudonymization does not duplicate its audit side effect'
);

select extensions.is(
  (select account_state from public.users where id = '70000000-0000-4000-8000-000000000001'),
  'deleted'::text,
  'public user identity becomes a deleted tombstone'
);
select extensions.is(
  (select count(*)::bigint from public.profiles where user_id = '70000000-0000-4000-8000-000000000001'),
  0::bigint,
  'profile PII is deleted'
);
select extensions.is(
  (
    select count(*)::bigint from public.organization_memberships
    where user_id = '70000000-0000-4000-8000-000000000001' and status = 'revoked'
  ),
  1::bigint,
  'organization membership is revoked'
);
select extensions.is(
  (select status from public.asks where id = '72000000-0000-4000-8000-000000000001'),
  'closed'::text,
  'accepted Ask is closed but retained'
);
select extensions.is(
  (select count(*)::bigint from public.conversations where id = '73000000-0000-4000-8000-000000000001'),
  1::bigint,
  'shared conversation is retained'
);
select extensions.is(
  (select count(*)::bigint from public.messages where conversation_id = '73000000-0000-4000-8000-000000000001'),
  1::bigint,
  'counterpart message history is retained'
);
select extensions.is(
  (
    select count(*)::bigint from private.reports
    where target_id = '70000000-0000-4000-8000-000000000001'
      and evidence_snapshot ? 'displayName'
  ),
  1::bigint,
  'immutable safety evidence is retained'
);
select extensions.is(
  (
    select count(*)::bigint from private.outbox_jobs
    where job_type = 'delete_storage_objects'
      and dedupe_key = 'delete_storage_objects:70000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'private Storage deletion is durably queued for the Storage API worker'
);
select extensions.ok(
  (
    select delete_reason is null and delete_scheduled_for is null and deleted_at is not null
    from public.users where id = '70000000-0000-4000-8000-000000000001'
  ),
  'tombstone contains lifecycle state but no deletion note PII'
);

select * from extensions.finish();
rollback;
