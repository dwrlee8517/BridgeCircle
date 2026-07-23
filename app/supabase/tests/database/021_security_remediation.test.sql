begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(60);

select extensions.has_table(
  'private', 'security_usage_windows',
  'security-sensitive provider and message budgets use one private atomic ledger'
);
select extensions.ok(
  coalesce((
    select c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'private' and c.relname = 'security_usage_windows'
  ), false),
  'the shared security usage ledger enforces RLS'
);
select extensions.is(
  (
    select count(*)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname like '%pre_security_remediation'
      and has_function_privilege('service_role', p.oid, 'execute')
  ),
  0::bigint,
  'renamed pre-remediation implementations are not callable by service workers'
);
select extensions.ok(
  has_function_privilege(
    'service_role',
    'api.begin_profile_index_attempt(bigint,text,text)',
    'execute'
  ) and not has_function_privilege(
    'authenticated',
    'api.begin_profile_index_attempt(bigint,text,text)',
    'execute'
  ),
  'profile-index authorization is service-only'
);
select extensions.ok(
  (
    select convalidated
    from pg_constraint
    where conrelid = 'public.invites'::regclass
      and conname = 'invites_email_format_check'
  ),
  'the canonical invite email constraint was validated against existing rows'
);

select extensions.ok(
  private.profile_import_attempts_are_bounded(
    '[{"provider":"pdl","purpose":"onboarding_import","status":"no_match","costUnits":0}]'
  ),
  'bounded profile-import attempt metadata is accepted'
);
select extensions.ok(
  not private.profile_import_attempts_are_bounded('{}'::jsonb),
  'non-array profile-import attempt metadata is rejected'
);
select extensions.ok(
  not private.profile_import_attempts_are_bounded(
    '[{"provider":"untrusted","purpose":"onboarding_import","status":"failed","costUnits":0}]'
  ),
  'unrecognized profile-import providers are rejected'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
create temporary table candidate_budget_results on commit drop as
select budget.result_code
from generate_series(1, 10) sequence
cross join lateral api.consume_help_ai_budget(
  case when sequence > 0 then 'candidate_search' else '' end
) budget;
select extensions.is(
  (select count(*)::bigint from candidate_budget_results where result_code = 'allowed'),
  10::bigint,
  'the first ten member candidate-search provider calls are allowed per hour'
);
select extensions.is(
  (select result_code from api.consume_help_ai_budget('candidate_search')),
  'limited',
  'the eleventh member candidate-search provider call is denied'
);
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
create temporary table first_security_message on commit drop as
select * from api.send_message(
  '50000000-0000-4000-8000-000000000001',
  'Security budget message 1',
  'a1000000-0000-4000-8000-000000000001'
);
create temporary table duplicate_security_message on commit drop as
select * from api.send_message(
  '50000000-0000-4000-8000-000000000001',
  'Ignored duplicate message',
  'a1000000-0000-4000-8000-000000000001'
);
select extensions.is(
  (select result_code from first_security_message),
  'sent',
  'the first message is sent'
);
select extensions.is(
  (select result_code from duplicate_security_message),
  'duplicate',
  'an idempotent message replay returns the original result'
);
reset role;
select extensions.is(
  (
    select request_count
    from private.security_usage_windows
    where actor_user_id = '10000000-0000-4000-8000-000000000002'
      and resource = 'message_send'
      and resource_key = '50000000-0000-4000-8000-000000000001'
  ),
  1,
  'an idempotent message replay does not consume another rate-limit unit'
);
set local role authenticated;
create temporary table remaining_security_messages on commit drop as
select sent.result_code
from generate_series(2, 30) sequence
cross join lateral api.send_message(
  '50000000-0000-4000-8000-000000000001',
  'Security budget message ' || sequence,
  ('a1000000-0000-4000-8000-' || lpad(sequence::text, 12, '0'))::uuid
) sent;
select extensions.is(
  (select count(*)::bigint from remaining_security_messages where result_code = 'sent'),
  29::bigint,
  'thirty distinct messages can be sent in one conversation per minute'
);
select extensions.is(
  (
    select result_code from api.send_message(
      '50000000-0000-4000-8000-000000000001',
      'Security budget message 31',
      'a1000000-0000-4000-8000-000000000031'
    )
  ),
  'rate_limited',
  'the thirty-first distinct message is rate limited'
);
reset role;
select extensions.is(
  (
    select request_count
    from private.security_usage_windows
    where actor_user_id = '10000000-0000-4000-8000-000000000002'
      and resource = 'message_send'
      and resource_key = '50000000-0000-4000-8000-000000000001'
  ),
  30,
  'the atomic message budget never increments beyond its limit'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000007', true);
set local role authenticated;
create temporary table first_import_request on commit drop as
select * from api.begin_profile_import(
  '20000000-0000-4000-8000-000000000007',
  'a2000000-0000-4000-8000-000000000001',
  'linkedin',
  'https://www.linkedin.com/in/security-one'
);
select extensions.is(
  (select result_code from first_import_request),
  'started',
  'a fresh LinkedIn import starts'
);
select extensions.is(
  (
    select result_code from api.finish_profile_import(
      (select request_id from first_import_request),
      '{}'::jsonb, '{}'::jsonb, 'pdl', '{}'::jsonb,
      '[{"provider":"untrusted"}]'::jsonb, 0.5
    )
  ),
  'invalid_input',
  'invalid provider-attempt metadata cannot finish an import'
);
select extensions.is(
  api.fail_profile_import(
    (select request_id from first_import_request), 'provider_failed', '[]'::jsonb
  ),
  'failed',
  'a processing import can transition to failed once'
);
select extensions.is(
  api.fail_profile_import(
    (select request_id from first_import_request), 'provider_failed', '[]'::jsonb
  ),
  'not_processing',
  'a completed failure transition cannot be replayed'
);
create temporary table remaining_linkedin_imports on commit drop as
select started.result_code
from generate_series(2, 3) sequence
cross join lateral api.begin_profile_import(
  '20000000-0000-4000-8000-000000000007',
  ('a2000000-0000-4000-8000-' || lpad(sequence::text, 12, '0'))::uuid,
  'linkedin',
  'https://www.linkedin.com/in/security-' || sequence
) started;
select extensions.is(
  (select count(*)::bigint from remaining_linkedin_imports where result_code = 'started'),
  2::bigint,
  'three distinct LinkedIn imports can start per hour'
);
select extensions.is(
  (
    select result_code from api.begin_profile_import(
      '20000000-0000-4000-8000-000000000007',
      'a2000000-0000-4000-8000-000000000004',
      'linkedin',
      'https://www.linkedin.com/in/security-four'
    )
  ),
  'limited',
  'a fourth distinct LinkedIn import is denied before provider work'
);
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select extensions.is(
  (
    select result_code from api.issue_invite(
      '11111111-1111-4111-8111-111111111111',
      'a@b', 'Invalid Invite', 2018::smallint,
      'a3000000-0000-4000-8000-000000000001'
    )
  ),
  'invalid_input',
  'an invite address without a registrable domain is rejected'
);
reset role;

insert into public.admin_role_assignments (
  organization_id, organization_membership_id, role
) values (
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000003',
  'event_moderator'
);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
set local role authenticated;
select extensions.is(
  api.publish_admin_school_announcement(
    '20000000-0000-4000-8000-000000000003',
    'Unauthorized announcement', 'Must not publish.', 'general', false
  )->>'resultCode',
  'not_available',
  'an event moderator cannot publish announcements'
);
reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select extensions.is(
  api.publish_admin_school_announcement(
    '20000000-0000-4000-8000-000000000001',
    'Authorized security announcement', 'Published by an administrator.', 'general', false
  )->>'resultCode',
  'published',
  'an organization administrator retains announcement publication access'
);
reset role;

update public.organization_memberships
set status = 'revoked'
where id = '20000000-0000-4000-8000-000000000003';
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select extensions.throws_ok(
  $$update public.asks
      set status = 'declined', decline_reason_code = 'other',
          decline_note = 'No longer eligible.', responded_at = now(), ended_at = now()
    where id = '30000000-0000-4000-8000-000000000001'$$,
  '42501',
  'direct_ask_recipient_not_current',
  'a former direct-Ask recipient cannot decide the Ask'
);
update public.organization_memberships
set status = 'active'
where id = '20000000-0000-4000-8000-000000000003';

insert into public.asks (
  id, organization_id, asker_membership_id, kind, status,
  recipient_membership_id, question, request_message, client_request_id
) values (
  'a5000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000004',
  'direct', 'waiting',
  '20000000-0000-4000-8000-000000000006',
  'Can you help test current membership authorization?',
  'This Ask must stay waiting while either endpoint is not current.',
  'a5000000-0000-4000-8000-000000000002'
);
update public.organization_memberships
set status = 'revoked'
where id = '20000000-0000-4000-8000-000000000004';
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000006', true);
set local role authenticated;
select extensions.is(
  (
    select result_code from api.respond_to_direct_ask(
      'a5000000-0000-4000-8000-000000000001',
      'accept', 'Happy to help.', null, null,
      'a5000000-0000-4000-8000-000000000003'
    )
  ),
  'not_available',
  'a current recipient cannot accept an Ask from a revoked asker membership'
);
reset role;
select extensions.is(
  (select status from public.asks where id = 'a5000000-0000-4000-8000-000000000001'),
  'waiting',
  'rejected stale-asker acceptance leaves the Ask waiting'
);
select extensions.is(
  (select conversation_id from public.asks where id = 'a5000000-0000-4000-8000-000000000001'),
  null::uuid,
  'rejected stale-asker acceptance creates no conversation link'
);
select extensions.is(
  (
    select count(*)::bigint from private.ask_events
    where ask_id = 'a5000000-0000-4000-8000-000000000001'
      and event_type = 'accepted'
  ),
  0::bigint,
  'rejected stale-asker acceptance creates no acceptance event'
);
select extensions.is(
  (
    select count(*)::bigint from private.outbox_jobs
    where dedupe_key = 'ask_accepted:a5000000-0000-4000-8000-000000000001'
  ),
  0::bigint,
  'rejected stale-asker acceptance creates no notification job'
);
select extensions.throws_ok(
  $$update public.asks
      set status = 'declined', decline_reason_code = 'other',
          decline_note = 'Must not commit.', responded_at = now(), ended_at = now()
    where id = 'a5000000-0000-4000-8000-000000000001'$$,
  '42501',
  'direct_ask_asker_not_current',
  'the table boundary rejects a revoked direct-Ask asker'
);
update public.organization_memberships
set status = 'pending', joined_at = null
where id = '20000000-0000-4000-8000-000000000004';
select extensions.throws_ok(
  $$update public.asks
      set status = 'declined', decline_reason_code = 'other',
          decline_note = 'Must not commit.', responded_at = now(), ended_at = now()
    where id = 'a5000000-0000-4000-8000-000000000001'$$,
  '42501',
  'direct_ask_asker_not_current',
  'the table boundary rejects a pending direct-Ask asker'
);
update public.organization_memberships
set status = 'active', joined_at = now()
where id = '20000000-0000-4000-8000-000000000004';
update public.users
set account_state = 'deletion_scheduled', delete_scheduled_for = now() + interval '7 days'
where id = '10000000-0000-4000-8000-000000000004';
select extensions.throws_ok(
  $$update public.asks
      set status = 'declined', decline_reason_code = 'other',
          decline_note = 'Must not commit.', responded_at = now(), ended_at = now()
    where id = 'a5000000-0000-4000-8000-000000000001'$$,
  '42501',
  'direct_ask_asker_not_current',
  'the table boundary rejects a direct Ask from a non-active account'
);
update public.users
set account_state = 'active', delete_scheduled_for = null
where id = '10000000-0000-4000-8000-000000000004';
set local role authenticated;
select extensions.is(
  (
    select result_code from api.respond_to_direct_ask(
      'a5000000-0000-4000-8000-000000000001',
      'accept', 'Happy to help now that both memberships are current.', null, null,
      'a5000000-0000-4000-8000-000000000004'
    )
  ),
  'accepted',
  'a current recipient can still accept an Ask from a current asker'
);
reset role;
select extensions.ok(
  (select conversation_id is not null from public.asks
    where id = 'a5000000-0000-4000-8000-000000000001'),
  'the legitimate direct-Ask acceptance still creates a conversation'
);
select extensions.is(
  (
    select count(*)::bigint from private.ask_events
    where ask_id = 'a5000000-0000-4000-8000-000000000001'
      and event_type = 'accepted'
  ),
  1::bigint,
  'the legitimate direct-Ask acceptance records one acceptance event'
);

select extensions.ok(
  has_function_privilege(
    'service_role',
    'api.consume_ask_matching_provider_budget(bigint,text)',
    'execute'
  ) and not has_function_privilege(
    'authenticated',
    'api.consume_ask_matching_provider_budget(bigint,text)',
    'execute'
  ),
  'queued matching budget authorization is service-only'
);
create temporary table matching_budget_jobs on commit drop as
with inserted as (
  insert into private.outbox_jobs (
    job_type, payload, dedupe_key, status, locked_at, locked_by
  )
  select
    'run_ask_matching',
    jsonb_build_object('askId', '30000000-0000-4000-8000-000000000002'),
    'security-matching-budget-' || sequence,
    'processing', now(), 'security-matching-worker-' || sequence
  from generate_series(1, 11) sequence
  returning id, locked_by
)
select * from inserted;
grant select on matching_budget_jobs to service_role;
set local role service_role;
create temporary table matching_budget_results on commit drop as
select api.consume_ask_matching_provider_budget(id, locked_by) as result_code
from matching_budget_jobs
order by id
limit 10;
select extensions.is(
  (select count(*)::bigint from matching_budget_results where result_code = 'allowed'),
  10::bigint,
  'the first ten queued matching provider attempts are allowed per actor per hour'
);
select extensions.is(
  (
    select api.consume_ask_matching_provider_budget(id, locked_by)
    from matching_budget_jobs order by id desc limit 1
  ),
  'limited',
  'the eleventh queued matching provider attempt for one actor is denied'
);
reset role;
select extensions.is(
  (
    select request_count from private.security_usage_windows
    where actor_user_id = '10000000-0000-4000-8000-000000000002'
      and resource = 'ask_matching_provider'
      and resource_key = ''
  ),
  10,
  'the atomic queued matching budget never increments beyond its limit'
);
set local role service_role;
select extensions.is(
  (
    select api.consume_ask_matching_provider_budget(id, 'wrong-worker')
    from matching_budget_jobs order by id limit 1
  ),
  'not_available',
  'a worker cannot charge a matching budget for a job it does not own'
);
reset role;

insert into public.asks (
  id, organization_id, asker_membership_id, kind, status,
  question, reach, anonymous_until_accepted, client_request_id
) values (
  'a5000000-0000-4000-8000-000000000010',
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000004',
  'circle', 'open', 'Who can help with an independent budget?',
  'matched', true, 'a5000000-0000-4000-8000-000000000011'
);
insert into private.outbox_jobs (
  job_type, payload, dedupe_key, status, locked_at, locked_by
) values (
  'run_ask_matching',
  jsonb_build_object('askId', 'a5000000-0000-4000-8000-000000000010'),
  'security-matching-independent', 'processing', now(), 'security-independent-worker'
) returning id as independent_matching_job_id \gset
set local role service_role;
select extensions.is(
  api.consume_ask_matching_provider_budget(
    :independent_matching_job_id, 'security-independent-worker'
  ),
  'allowed',
  'a different actor receives an independent queued matching budget'
);
reset role;
select extensions.is(
  (
    select request_count from private.security_usage_windows
    where actor_user_id = '10000000-0000-4000-8000-000000000004'
      and resource = 'ask_matching_provider'
      and resource_key = ''
  ),
  1,
  'the independent actor has its own matching counter'
);
update public.organization_memberships
set status = 'revoked'
where id = '20000000-0000-4000-8000-000000000004';
insert into private.outbox_jobs (
  job_type, payload, dedupe_key, status, locked_at, locked_by
) values (
  'run_ask_matching',
  jsonb_build_object('askId', 'a5000000-0000-4000-8000-000000000010'),
  'security-matching-revoked', 'processing', now(), 'security-revoked-worker'
) returning id as revoked_matching_job_id \gset
set local role service_role;
select extensions.is(
  api.consume_ask_matching_provider_budget(
    :revoked_matching_job_id, 'security-revoked-worker'
  ),
  'not_available',
  'a revoked Ask owner cannot consume queued matching provider budget'
);
reset role;
select extensions.is(
  (
    select request_count from private.security_usage_windows
    where actor_user_id = '10000000-0000-4000-8000-000000000004'
      and resource = 'ask_matching_provider'
      and resource_key = ''
  ),
  1,
  'a rejected current-state check does not consume another provider unit'
);
update public.organization_memberships
set status = 'active', joined_at = now()
where id = '20000000-0000-4000-8000-000000000004';

insert into public.ask_offers (
  id, organization_id, ask_id, helper_membership_id, status,
  offer_note, client_request_id
) values (
  'a4000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '30000000-0000-4000-8000-000000000002',
  '20000000-0000-4000-8000-000000000006',
  'pending', 'I can help with this.',
  'a4000000-0000-4000-8000-000000000002'
);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000006', true);
select extensions.ok(
  not private.can_reveal_anonymous_asker('30000000-0000-4000-8000-000000000002'),
  'an anonymous circle asker stays masked before offer acceptance'
);
update public.organization_memberships
set status = 'revoked'
where id = '20000000-0000-4000-8000-000000000006';
select extensions.throws_ok(
  $$update public.ask_offers
      set status = 'accepted', responded_at = now()
    where id = 'a4000000-0000-4000-8000-000000000001'$$,
  '42501',
  'offer_helper_not_current',
  'an offer from a former helper cannot be accepted'
);
update public.organization_memberships
set status = 'active'
where id = '20000000-0000-4000-8000-000000000006';
update public.ask_offers
set status = 'accepted', responded_at = now()
where id = 'a4000000-0000-4000-8000-000000000001';
select extensions.ok(
  private.can_reveal_anonymous_asker('30000000-0000-4000-8000-000000000002'),
  'only the current accepted helper can see the anonymous asker identity'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select extensions.ok(
  api.submit_report(
    'profile', '10000000-0000-4000-8000-000000000003', 'other', 'Security test.'
  ) is not null,
  'a current member can report a visible same-circle profile'
);
select extensions.throws_ok(
  $$select api.submit_report(
      'profile', '10000000-0000-4000-8000-000000000008', 'other', 'Cross circle.'
    )$$,
  '42501',
  'report_target_not_accessible',
  'a profile outside every shared active circle cannot be reported'
);
reset role;
insert into public.member_blocks (blocker_user_id, blocked_user_id)
values (
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000004'
);
set local role authenticated;
select extensions.throws_ok(
  $$select api.submit_report(
      'profile', '10000000-0000-4000-8000-000000000004', 'other', 'Blocked.'
    )$$,
  '42501',
  'report_target_not_accessible',
  'a blocked profile cannot be reached through the report command'
);
reset role;
delete from public.member_blocks
where blocker_user_id = '10000000-0000-4000-8000-000000000002'
  and blocked_user_id = '10000000-0000-4000-8000-000000000004';

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select extensions.is(
  (
    select counterpart_headline
    from api.get_conversation_detail('50000000-0000-4000-8000-000000000001')
  ),
  'Product leadership across Seoul and San Francisco',
  'conversation context includes current profile fields for active circle peers'
);
reset role;
update public.organization_memberships
set status = 'revoked'
where id = '20000000-0000-4000-8000-000000000004';
set local role authenticated;
select extensions.is(
  (
    select counterpart_headline
    from api.get_conversation_detail('50000000-0000-4000-8000-000000000001')
  ),
  null::text,
  'conversation context removes current profile fields after circle access ends'
);
reset role;
update public.organization_memberships
set status = 'active'
where id = '20000000-0000-4000-8000-000000000004';

select extensions.ok(
  private.notification_recipient_is_authorized(
    'message_received',
    '10000000-0000-4000-8000-000000000002',
    jsonb_build_object(
      'recipientUserId', '10000000-0000-4000-8000-000000000002',
      'actorUserId', '10000000-0000-4000-8000-000000000004',
      'conversationId', '50000000-0000-4000-8000-000000000001',
      'messageId', (
        select id from public.messages
        where client_nonce = '50000000-0000-4000-8000-000000000101'
      )
    )
  ),
  'worker-time notification authorization accepts an existing valid message'
);
select extensions.ok(
  not private.notification_recipient_is_authorized(
    'message_received',
    '10000000-0000-4000-8000-000000000002',
    jsonb_build_object(
      'recipientUserId', '10000000-0000-4000-8000-000000000002',
      'actorUserId', '10000000-0000-4000-8000-000000000004',
      'conversationId', '50000000-0000-4000-8000-000000000001',
      'messageId', 9223372036854775807
    )
  ),
  'worker-time notification authorization rejects a mismatched message payload'
);

insert into private.profile_embedding_status (
  organization_membership_id, organization_id, user_id,
  status, dirty_reason, dirty_since
) values (
  '20000000-0000-4000-8000-000000000002',
  '11111111-1111-4111-8111-111111111111',
  '10000000-0000-4000-8000-000000000002',
  'dirty', 'security_test', now()
) on conflict (organization_membership_id) do update
set status = 'dirty', dirty_reason = 'security_test', dirty_since = now(),
    locked_at = null, locked_by = null,
    processing_source_fingerprint = null, processing_job_id = null;

insert into private.outbox_jobs (
  job_type, payload, dedupe_key, status, locked_at, locked_by
) values (
  'index_profile',
  jsonb_build_object(
    'membershipId', '20000000-0000-4000-8000-000000000002',
    'organizationId', '11111111-1111-4111-8111-111111111111',
    'userId', '10000000-0000-4000-8000-000000000002'
  ),
  'security-profile-index-one', 'processing', now(), 'security-worker'
) returning id as profile_job_id \gset
set local role service_role;
select extensions.is(
  api.begin_profile_index_attempt(
    :profile_job_id, 'security-worker', repeat('a', 64)
  ),
  'allowed',
  'a claimed current profile-index job is authorized before provider work'
);
reset role;
insert into private.outbox_jobs (
  job_type, payload, dedupe_key, status, locked_at, locked_by
) values (
  'index_profile',
  jsonb_build_object(
    'membershipId', '20000000-0000-4000-8000-000000000002',
    'organizationId', '11111111-1111-4111-8111-111111111111',
    'userId', '10000000-0000-4000-8000-000000000002'
  ),
  'security-profile-index-without-begin', 'processing', now(), 'security-worker'
) returning id as unbegun_profile_job_id \gset
set local role service_role;
select extensions.is(
  (
    select result_code from api.sync_profile_index(
      :unbegun_profile_job_id, 'security-worker', array[]::text[], '[]'::jsonb
    )
  ),
  'not_available',
  'profile-index synchronization fails closed without an authorized attempt'
);
reset role;
update private.profile_embedding_status
set status = 'ready', last_source_fingerprint = repeat('b', 64),
    processing_source_fingerprint = null, processing_job_id = null,
    locked_at = null, locked_by = null
where organization_membership_id = '20000000-0000-4000-8000-000000000002';
insert into private.outbox_jobs (
  job_type, payload, dedupe_key, status, locked_at, locked_by
) values (
  'index_profile',
  jsonb_build_object(
    'membershipId', '20000000-0000-4000-8000-000000000002',
    'organizationId', '11111111-1111-4111-8111-111111111111',
    'userId', '10000000-0000-4000-8000-000000000002'
  ),
  'security-profile-index-unchanged', 'processing', now(), 'security-worker'
) returning id as unchanged_profile_job_id \gset
set local role service_role;
select extensions.is(
  api.begin_profile_index_attempt(
    :unchanged_profile_job_id, 'security-worker', repeat('b', 64)
  ),
  'unchanged',
  'an unchanged profile is coalesced before provider work'
);
reset role;

update public.organization_memberships
set status = 'revoked'
where id = '20000000-0000-4000-8000-000000000002';
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000006', true);
select extensions.ok(
  not private.can_view_ask('30000000-0000-4000-8000-000000000002'),
  'an Ask becomes inaccessible when its owning membership is no longer active'
);

select * from extensions.finish();
rollback;
