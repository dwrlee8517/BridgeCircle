begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(55);

select extensions.has_table(
  'private', 'membership_rejection_details',
  'membership rejection details have a private accountable record'
);
select extensions.ok(
  (select c.relrowsecurity and c.relforcerowsecurity
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'private' and c.relname = 'membership_rejection_details'),
  'private rejection details force RLS'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'private.membership_rejection_details', 'select'),
  'authenticated members cannot read rejection details'
);
select extensions.ok(
  not has_table_privilege('anon', 'private.membership_rejection_details', 'select'),
  'anonymous clients cannot read rejection details'
);
select extensions.ok(
  has_table_privilege('service_role', 'private.membership_rejection_details', 'select'),
  'the service role retains explicit private-table access'
);
select extensions.ok(
  has_function_privilege(
    'authenticated', 'private.decide_membership(uuid,text)', 'execute'
  ),
  'the reviewed private compatibility boundary remains available during deploys'
);
select extensions.has_function(
  'api', 'list_admin_reports', array['uuid', 'text', 'integer'],
  'moderation queue uses a fixed admin projection'
);
select extensions.has_function(
  'api', 'decide_admin_report', array['uuid', 'uuid', 'text', 'text'],
  'moderation decisions use one fixed command'
);
select extensions.has_function(
  'api', 'decide_membership_with_reason', array['uuid', 'text', 'text', 'text'],
  'membership rejection records a private reason'
);
select extensions.has_function(
  'api', 'save_admin_school_event_v2',
  array[
    'uuid', 'uuid', 'text', 'text', 'text', 'text', 'text', 'text', 'text',
    'timestamp with time zone', 'timestamp with time zone', 'text', 'text',
    'text', 'text', 'integer', 'text', 'integer', 'boolean', 'text', 'jsonb', 'jsonb'
  ],
  'complete event authoring uses a fixed transactional command'
);
select extensions.ok(
  exists (
    select 1
    from pg_policy policy
    join pg_class relation on relation.oid = policy.polrelid
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'storage'
      and relation.relname = 'objects'
      and policy.polname = 'account_exports_owner_select'
      and policy.polcmd = 'r'
  ),
  'account exports have an authenticated owner-read policy'
);

insert into private.account_export_requests (
  id, user_id, request_id, status, storage_bucket, storage_path,
  expires_at, completed_at
) values
  (
    '96000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '96000000-0000-4000-8000-000000000011', 'ready', 'account-exports',
    '10000000-0000-4000-8000-000000000002/current.json',
    now() + interval '1 day', now()
  ),
  (
    '96000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    '96000000-0000-4000-8000-000000000012', 'expired', 'account-exports',
    '10000000-0000-4000-8000-000000000002/expired.json',
    now() - interval '1 day', now() - interval '2 days'
  ),
  (
    '96000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000002',
    '96000000-0000-4000-8000-000000000013', 'failed', 'account-exports',
    '10000000-0000-4000-8000-000000000002/failed.json',
    null, null
  );

insert into storage.objects (bucket_id, name, owner_id, metadata)
values
  ('account-exports', '10000000-0000-4000-8000-000000000002/current.json',
   '10000000-0000-4000-8000-000000000002', '{}'::jsonb),
  ('account-exports', '10000000-0000-4000-8000-000000000003/other.json',
   '10000000-0000-4000-8000-000000000003', '{}'::jsonb),
  ('account-exports', '10000000-0000-4000-8000-000000000002/expired.json',
   '10000000-0000-4000-8000-000000000002', '{}'::jsonb),
  ('account-exports', '10000000-0000-4000-8000-000000000002/failed.json',
   '10000000-0000-4000-8000-000000000002', '{}'::jsonb);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select extensions.is(
  (select count(*)::integer from storage.objects where bucket_id = 'account-exports'),
  1,
  'a member can read the object under their account-export prefix'
);
select extensions.is(
  (select count(*)::integer from storage.objects
   where bucket_id = 'account-exports'
     and name = '10000000-0000-4000-8000-000000000003/other.json'),
  0,
  'a member cannot read another account-export prefix'
);
select extensions.is(
  (select count(*)::integer from storage.objects
   where bucket_id = 'account-exports'
     and name = '10000000-0000-4000-8000-000000000002/expired.json'),
  0,
  'an expired same-owner export is no longer readable'
);
select extensions.is(
  (select count(*)::integer from storage.objects
   where bucket_id = 'account-exports'
     and name = '10000000-0000-4000-8000-000000000002/failed.json'),
  0,
  'an unready same-owner export is not readable'
);
reset role;
select extensions.is(
  (select count(*)::integer
   from pg_policy policy
   join pg_class relation on relation.oid = policy.polrelid
   join pg_namespace namespace on namespace.oid = relation.relnamespace
   where namespace.nspname = 'storage'
     and relation.relname = 'objects'
     and policy.polname like 'account_exports_%'
     and policy.polcmd <> 'r'),
  0,
  'account-export clients receive no insert, update, or delete policy'
);

insert into private.reports (
  id, reporter_user_id, reported_user_id, organization_id, reason, note,
  target_type, target_id, profile_user_id, evidence_snapshot
) values (
  '97000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '11111111-1111-4111-8111-111111111111', 'other', 'Please review this.',
  'profile', '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000003',
  '{"displayName":"Mark Chen","headline":"captured evidence"}'::jsonb
);

-- Amy is a full admin in both organizations. Supplying the organization-one
-- membership must still fence every organization-two report.
insert into public.organization_memberships (
  id, user_id, organization_id, status, joined_at
) values (
  '99000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '22222222-2222-4222-8222-222222222222', 'active', now()
);
insert into public.admin_role_assignments (
  organization_id, organization_membership_id, role
) values (
  '22222222-2222-4222-8222-222222222222',
  '99000000-0000-4000-8000-000000000001', 'admin'
);
insert into private.reports (
  id, reporter_user_id, reported_user_id, organization_id, reason, note,
  target_type, target_id, profile_user_id, evidence_snapshot
) values (
  '97000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000007',
  '10000000-0000-4000-8000-000000000008',
  '22222222-2222-4222-8222-222222222222', 'other', 'Second organization.',
  'profile', '10000000-0000-4000-8000-000000000008',
  '10000000-0000-4000-8000-000000000008', '{}'::jsonb
);

insert into public.admin_role_assignments (
  organization_id, organization_membership_id, role
) values (
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000003',
  'event_moderator'
) on conflict (organization_membership_id, role) do nothing;

insert into public.users (id, account_state)
values
  ('98000000-0000-4000-8000-000000000001', 'active'),
  ('98000000-0000-4000-8000-000000000003', 'active');
insert into public.organization_memberships (
  id, user_id, organization_id, status
) values
  (
    '98000000-0000-4000-8000-000000000002',
    '98000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111', 'pending'
  ),
  (
    '98000000-0000-4000-8000-000000000004',
    '98000000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111', 'pending'
  );

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select extensions.is(
  api.list_admin_reports('20000000-0000-4000-8000-000000000002', null, 100)->>'resultCode',
  'not_available',
  'an ordinary member cannot open the moderation queue'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
set local role authenticated;
select extensions.is(
  api.list_admin_reports('20000000-0000-4000-8000-000000000003', null, 100)->>'resultCode',
  'not_available',
  'an event moderator cannot open the full moderation queue'
);
select extensions.is(
  api.decide_admin_report(
    '20000000-0000-4000-8000-000000000003',
    '97000000-0000-4000-8000-000000000001', 'start_review', null
  ),
  'not_available',
  'an event moderator cannot decide a report'
);
select extensions.ok(
  (select result_code = 'not_available' and membership_status is null
   from api.decide_membership_with_reason(
    '98000000-0000-4000-8000-000000000002', 'reject', 'not_eligible', null
  )),
  'an event moderator receives no membership existence or status disclosure'
);
select extensions.is(
  (select count(*)::integer from public.organization_memberships
   where id = '98000000-0000-4000-8000-000000000002'),
  0,
  'an event moderator cannot select a pending membership row'
);
select extensions.ok(
  (select result_code = 'not_available' and membership_status is null
   from private.decide_membership(
    '98000000-0000-4000-8000-000000000002', 'approve'
  )),
  'the granted private compatibility command also removes membership status'
);
select extensions.ok(
  (select result_code = 'not_available' and membership_status is null
   from api.decide_membership(
    '99999999-9999-4999-8999-999999999999', 'approve'
  )),
  'a nonexistent membership has the same non-disclosing decision result'
);
select extensions.is(
  api.save_admin_school_event_v2(
    '20000000-0000-4000-8000-000000000003', null,
    'Event moderator workshop', 'A role-boundary fixture.', null, 'Community',
    'online', 'America/Los_Angeles', 'online', now() + interval '12 days',
    now() + interval '12 days 1 hour', null, null, null,
    'https://meet.example.com/moderator', 30, 'the Alumni Office', 20, true,
    null, '[]'::jsonb, '[]'::jsonb
  )->>'resultCode',
  'created',
  'an event moderator can author an event'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select extensions.is(
  api.list_admin_reports('20000000-0000-4000-8000-000000000007', null, 100)->>'resultCode',
  'not_available',
  'a full admin cannot use a membership from another organization'
);
select extensions.is(
  jsonb_array_length(
    api.list_admin_reports('20000000-0000-4000-8000-000000000001', 'open', 100)->'items'
  ),
  1,
  'a same-organization full admin can list open reports'
);
select extensions.is(
  api.decide_admin_report(
    '20000000-0000-4000-8000-000000000001',
    '97000000-0000-4000-8000-000000000002', 'start_review', null
  ),
  'not_available',
  'an organization-one command cannot decide an organization-two report'
);
reset role;
select extensions.is(
  (select status from private.reports
   where id = '97000000-0000-4000-8000-000000000002'),
  'open',
  'a denied cross-organization report decision leaves the target unchanged'
);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select extensions.is(
  api.decide_admin_report(
    '20000000-0000-4000-8000-000000000001',
    '97000000-0000-4000-8000-000000000001', null, null
  ),
  'invalid_input',
  'a null moderation decision cannot fall through to actioned'
);
select extensions.is(
  api.decide_admin_report(
    '20000000-0000-4000-8000-000000000001',
    '97000000-0000-4000-8000-000000000001', 'start_review', null
  ),
  'reviewing',
  'an admin can take ownership of an open report'
);
select extensions.is(
  api.decide_admin_report(
    '20000000-0000-4000-8000-000000000001',
    '97000000-0000-4000-8000-000000000001', 'mark_actioned', null
  ),
  'invalid_input',
  'a terminal moderation action requires a private note'
);
select extensions.is(
  api.decide_admin_report(
    '20000000-0000-4000-8000-000000000001',
    '97000000-0000-4000-8000-000000000001', 'mark_actioned',
    'Reviewed the captured evidence and handled this outside the member app.'
  ),
  'actioned',
  'an assigned report can be marked handled with an accountable note'
);
select extensions.is(
  api.decide_admin_report(
    '20000000-0000-4000-8000-000000000001',
    '97000000-0000-4000-8000-000000000001', 'dismiss', 'Duplicate review.'
  ),
  'stale',
  'terminal report decisions cannot be overwritten'
);

select extensions.is(
  (select result_code from api.decide_membership_with_reason(
    '98000000-0000-4000-8000-000000000002', null, 'could_not_verify', null
  )),
  'invalid_reason',
  'a null membership decision cannot fall through to rejection'
);
select extensions.is(
  (select result_code from api.decide_membership(
    '98000000-0000-4000-8000-000000000004', 'reject'
  )),
  'rejected',
  'the legacy membership command records a compatibility reason'
);
reset role;
select extensions.is(
  (select reason_code from private.membership_rejection_details
   where membership_id = '98000000-0000-4000-8000-000000000004'),
  'other',
  'the legacy rejection cannot bypass the private accountability record'
);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select extensions.is(
  (select result_code from api.decide_membership_with_reason(
    '98000000-0000-4000-8000-000000000002', 'reject', null, null
  )),
  'invalid_reason',
  'membership rejection requires a bounded reason code'
);
select extensions.is(
  (select result_code from api.decide_membership_with_reason(
    '98000000-0000-4000-8000-000000000002', 'reject', 'could_not_verify',
    'The submitted identity did not match the school record.'
  )),
  'rejected',
  'a full admin can reject with a private accountable reason'
);
select extensions.is(
  (select result_code from api.decide_membership_with_reason(
    '98000000-0000-4000-8000-000000000002', 'reject', 'other',
    'A replay must not replace the original reason.'
  )),
  'rejected',
  'replaying a completed rejection is idempotent'
);

reset role;
select extensions.is(
  (select reason_code from private.membership_rejection_details
   where membership_id = '98000000-0000-4000-8000-000000000002'),
  'could_not_verify',
  'the first rejection reason remains authoritative'
);
select extensions.is(
  (select count(*)::bigint from private.audit_log
   where action = 'membership.rejection_reason_recorded'
     and target_id = '98000000-0000-4000-8000-000000000002'),
  1::bigint,
  'an idempotent rejection replay does not write a false reason audit row'
);

create temporary table admin_operations_event (event_id uuid primary key) on commit drop;
grant select, insert on admin_operations_event to authenticated;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
with saved as (
  select api.save_admin_school_event_v2(
    '20000000-0000-4000-8000-000000000001', null,
    'Community design evening', 'A practical evening for members building community.',
    'A short talk followed by small-group discussion.', 'Community', 'hybrid',
    'America/Los_Angeles', 'palos_verdes', now() + interval '10 days',
    now() + interval '10 days 2 hours', 'Roessler Hall', '26800 South Academy Drive',
    'https://maps.example.com/chadwick', 'https://meet.example.com/community', 30,
    'the Alumni Office', 80, true, null,
    jsonb_build_array(jsonb_build_object(
      'startsAt', now() + interval '10 days 15 minutes', 'label', 'Welcome'
    )),
    jsonb_build_array(jsonb_build_object(
      'label', 'What to bring', 'value', 'A question for the group',
      'linkLabel', null, 'linkUrl', null
    ))
  ) as result
)
insert into admin_operations_event (event_id)
select (result->>'eventId')::uuid from saved where result->>'resultCode' = 'created';
select extensions.is(
  (select count(*)::integer from admin_operations_event),
  1,
  'a full event payload can be published atomically'
);

reset role;
select extensions.is(
  (
    select e.format || ':' || e.campus || ':' || e.time_zone
    from public.events e join admin_operations_event fixture on fixture.event_id = e.id
  ),
  'hybrid:palos_verdes:America/Los_Angeles',
  'event format, campus, and timezone round-trip to the member model'
);
select extensions.is(
  (select count(*)::integer from public.event_schedule_items item
   join admin_operations_event fixture on fixture.event_id = item.event_id),
  1,
  'event schedule items are written in the parent transaction'
);
select extensions.is(
  (select count(*)::integer from public.event_facts fact
   join admin_operations_event fixture on fixture.event_id = fact.event_id),
  1,
  'event facts are written in the parent transaction'
);

insert into public.event_rsvps (
  organization_id, event_id, organization_membership_id, status
)
select '11111111-1111-4111-8111-111111111111', fixture.event_id,
  recipient.membership_id, recipient.status
from admin_operations_event fixture
cross join (values
  ('20000000-0000-4000-8000-000000000002'::uuid, 'going'::text),
  ('20000000-0000-4000-8000-000000000004'::uuid, 'waitlisted'::text)
) recipient(membership_id, status);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select extensions.is(
  (select api.save_admin_school_event_v2(
    '20000000-0000-4000-8000-000000000001', fixture.event_id,
    'Must not persist', 'A practical evening for members building community.',
    'A short talk followed by small-group discussion.', 'Community', 'hybrid',
    'America/Los_Angeles', 'palos_verdes', now() + interval '10 days',
    now() + interval '10 days 2 hours', 'Roessler Hall', '26800 South Academy Drive',
    'https://maps.example.com/chadwick', 'https://meet.example.com/community', 30,
    'the Alumni Office', 80, true, null, '[1]'::jsonb, '[]'::jsonb
  )->>'resultCode' from admin_operations_event fixture),
  'invalid_input',
  'a non-object schedule element is rejected without a transport error'
);

reset role;
select extensions.is(
  (select e.title from public.events e
   join admin_operations_event fixture on fixture.event_id = e.id),
  'Community design evening',
  'malformed child input leaves the parent and prior children unchanged'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select extensions.is(
  (select api.save_admin_school_event_v2(
    '20000000-0000-4000-8000-000000000001', fixture.event_id,
    'Community design evening', 'A practical evening for members building community.',
    'A short talk followed by small-group discussion.', 'Community', 'hybrid',
    'America/Los_Angeles', 'palos_verdes', now() + interval '10 days',
    now() + interval '10 days 2 hours', 'Roessler Hall', '26800 South Academy Drive',
    'https://maps.example.com/chadwick', 'https://meet.example.com/community', 30,
    'the Alumni Office', 80, true, null,
    jsonb_build_array(jsonb_build_object(
      'startsAt', now() + interval '10 days 15 minutes', 'label', 'Welcome'
    )),
    jsonb_build_array(jsonb_build_object(
      'label', 'What to bring', 'value', 'A question for the group',
      'linkLabel', null, 'linkUrl', null
    ))
  )->>'resultCode' from admin_operations_event fixture),
  'updated',
  'a logical no-op update succeeds'
);

reset role;
select extensions.is(
  (select count(*)::bigint from private.outbox_jobs job
   join admin_operations_event fixture on job.payload->>'eventId' = fixture.event_id::text
   where job.job_type = 'create_notification'
     and job.payload->>'type' = 'event_changed'),
  0::bigint,
  'a logical no-op child replacement sends no change notification'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select extensions.is(
  (select api.save_admin_school_event_v2(
    '20000000-0000-4000-8000-000000000001', fixture.event_id,
    'Community design evening', 'Updated community details.',
    'A short talk followed by small-group discussion.', 'Community', 'hybrid',
    'America/Los_Angeles', 'palos_verdes', now() + interval '10 days',
    now() + interval '10 days 2 hours', 'Roessler Hall', '26800 South Academy Drive',
    'https://maps.example.com/chadwick', 'https://meet.example.com/community', 30,
    'the Alumni Office', 80, true, 'The agenda now includes discussion time.',
    jsonb_build_array(
      jsonb_build_object('startsAt', now() + interval '10 days 15 minutes', 'label', 'Welcome'),
      jsonb_build_object('startsAt', now() + interval '10 days 45 minutes', 'label', 'Discussion')
    ),
    jsonb_build_array(jsonb_build_object(
      'label', 'What to bring', 'value', 'Two questions for the group',
      'linkLabel', null, 'linkUrl', null
    ))
  )->>'resultCode' from admin_operations_event fixture),
  'updated',
  'a changed event replaces its complete child payload'
);

reset role;
select extensions.is(
  (select count(*)::integer from public.event_schedule_items item
   join admin_operations_event fixture on fixture.event_id = item.event_id),
  2,
  'a changed schedule replaces rather than appends child rows'
);
select extensions.is(
  (select count(*)::bigint from private.outbox_jobs job
   join admin_operations_event fixture on job.payload->>'eventId' = fixture.event_id::text
   where job.job_type = 'create_notification'
     and job.payload->>'type' = 'event_changed'),
  2::bigint,
  'one durable event-change job is queued for each eligible RSVP'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select extensions.is(
  (select api.save_admin_school_event_v2(
    '20000000-0000-4000-8000-000000000001', fixture.event_id,
    'Community design evening', 'A second rapid update.',
    'A short talk followed by small-group discussion.', 'Community', 'hybrid',
    'America/Los_Angeles', 'palos_verdes', now() + interval '10 days',
    now() + interval '10 days 2 hours', 'Roessler Hall', '26800 South Academy Drive',
    'https://maps.example.com/chadwick', 'https://meet.example.com/community', 30,
    'the Alumni Office', 80, true, 'The summary changed again.',
    jsonb_build_array(
      jsonb_build_object('startsAt', now() + interval '10 days 15 minutes', 'label', 'Welcome'),
      jsonb_build_object('startsAt', now() + interval '10 days 45 minutes', 'label', 'Discussion')
    ),
    jsonb_build_array(jsonb_build_object(
      'label', 'What to bring', 'value', 'Two questions for the group',
      'linkLabel', null, 'linkUrl', null
    ))
  )->>'resultCode' from admin_operations_event fixture),
  'updated',
  'a second change in the same transaction is retained'
);

reset role;
select extensions.is(
  (select count(*)::bigint from private.outbox_jobs job
   join admin_operations_event fixture on job.payload->>'eventId' = fixture.event_id::text
   where job.job_type = 'create_notification'
     and job.payload->>'type' = 'event_changed'),
  4::bigint,
  'rapid distinct changes do not collide in the notification outbox'
);
select extensions.is(
  (select count(distinct job.dedupe_key)::bigint from private.outbox_jobs job
   join admin_operations_event fixture on job.payload->>'eventId' = fixture.event_id::text
   where job.job_type = 'create_notification'
     and job.payload->>'type' = 'event_changed'),
  4::bigint,
  'each recipient and event change has a unique durable dedupe key'
);

select * from extensions.finish();
rollback;
