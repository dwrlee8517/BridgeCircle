begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(33);

select (
  to_regprocedure('api.claim_outbox_jobs(text,integer)') is not null
  and to_regprocedure('api.complete_outbox_job(bigint,text)') is not null
  and to_regprocedure('api.retry_outbox_job(bigint,text,text,timestamp with time zone)') is not null
  and to_regprocedure('api.fail_outbox_job(bigint,text,text)') is not null
)::integer as outbox_api_exists \gset

insert into public.organizations (id, slug, name)
values (
  '60000000-0000-4000-8000-000000000040',
  'foundation-reliability', 'Foundation Reliability'
);

insert into public.users (id) values
  ('70000000-0000-4000-8000-000000000051'),
  ('70000000-0000-4000-8000-000000000052'),
  ('70000000-0000-4000-8000-000000000053');

insert into public.organization_memberships (
  id, user_id, organization_id, status, joined_at
) values
  (
    '63000000-0000-4000-8000-000000000051',
    '70000000-0000-4000-8000-000000000051',
    '60000000-0000-4000-8000-000000000040', 'active', now()
  ),
  (
    '63000000-0000-4000-8000-000000000052',
    '70000000-0000-4000-8000-000000000052',
    '60000000-0000-4000-8000-000000000040', 'active', now()
  ),
  (
    '63000000-0000-4000-8000-000000000053',
    '70000000-0000-4000-8000-000000000053',
    '60000000-0000-4000-8000-000000000040', 'active', now()
  );

insert into public.profiles (user_id, display_name) values
  ('70000000-0000-4000-8000-000000000051', 'Reliability A'),
  ('70000000-0000-4000-8000-000000000052', 'Reliability B'),
  ('70000000-0000-4000-8000-000000000053', 'Reliability Audit');

insert into public.organization_profiles (
  organization_membership_id, organization_id, graduation_year, bio
) values
  (
    '63000000-0000-4000-8000-000000000051',
    '60000000-0000-4000-8000-000000000040', 2001, 'Private A bio'
  ),
  (
    '63000000-0000-4000-8000-000000000052',
    '60000000-0000-4000-8000-000000000040', 2002, 'Private B bio'
  ),
  (
    '63000000-0000-4000-8000-000000000053',
    '60000000-0000-4000-8000-000000000040', 2003, null
  );

insert into public.helper_preferences (
  organization_membership_id, organization_id, open_to_help
) values (
  '63000000-0000-4000-8000-000000000051',
  '60000000-0000-4000-8000-000000000040', true
);

insert into public.helper_topics (
  organization_membership_id, organization_id,
  name, normalized_name, sort_order
) values (
  '63000000-0000-4000-8000-000000000051',
  '60000000-0000-4000-8000-000000000040',
  'Hidden by block', 'hidden by block', 0
);

insert into public.connection_requests (
  id, requester_user_id, recipient_user_id, origin_organization_id,
  status, client_request_id, responded_at
) values
  (
    '64000000-0000-4000-8000-000000000051',
    '70000000-0000-4000-8000-000000000051',
    '70000000-0000-4000-8000-000000000052',
    '60000000-0000-4000-8000-000000000040',
    'accepted', '64000000-0000-4000-8000-000000000151', now()
  ),
  (
    '64000000-0000-4000-8000-000000000052',
    '70000000-0000-4000-8000-000000000052',
    '70000000-0000-4000-8000-000000000051',
    '60000000-0000-4000-8000-000000000040',
    'pending', '64000000-0000-4000-8000-000000000152', null
  );

insert into public.connections (
  id, user_a_id, user_b_id, origin_organization_id, connection_request_id
) values (
  '65000000-0000-4000-8000-000000000051',
  '70000000-0000-4000-8000-000000000051',
  '70000000-0000-4000-8000-000000000052',
  '60000000-0000-4000-8000-000000000040',
  '64000000-0000-4000-8000-000000000051'
);

insert into public.asks (
  id, organization_id, asker_membership_id, kind, status,
  recipient_membership_id, question, request_message, client_request_id
) values (
  '66000000-0000-4000-8000-000000000051',
  '60000000-0000-4000-8000-000000000040',
  '63000000-0000-4000-8000-000000000051', 'direct', 'waiting',
  '63000000-0000-4000-8000-000000000052',
  'Can this blocked member help?', 'This request must close on block.',
  '66000000-0000-4000-8000-000000000151'
);

insert into public.conversations (
  id, kind, user_a_id, user_b_id
) values (
  '67000000-0000-4000-8000-000000000051', 'direct',
  '70000000-0000-4000-8000-000000000051',
  '70000000-0000-4000-8000-000000000052'
);

insert into public.messages (
  conversation_id, sender_user_id, kind, body, client_nonce
) values (
  '67000000-0000-4000-8000-000000000051',
  '70000000-0000-4000-8000-000000000051',
  'user', 'Existing history is hidden while blocked.',
  '67000000-0000-4000-8000-000000000151'
);

grant select on public.profiles, public.organization_profiles,
  public.helper_preferences, public.helper_topics to authenticated;

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000052', true);
set local role authenticated;
select extensions.is(
  (
    select count(*)::bigint from public.profiles
    where user_id = '70000000-0000-4000-8000-000000000051'
  ),
  1::bigint,
  'same-organization profile is visible before either member blocks'
);
reset role;

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000051', true);
set local role authenticated;
select extensions.lives_ok(
  $$select api.block_member('70000000-0000-4000-8000-000000000052')$$,
  'member can create the directional block through the sole command'
);
reset role;

select extensions.ok(
  private.is_blocked(
    '70000000-0000-4000-8000-000000000051',
    '70000000-0000-4000-8000-000000000052'
  )
  and private.is_blocked(
    '70000000-0000-4000-8000-000000000052',
    '70000000-0000-4000-8000-000000000051'
  ),
  'central block helper is symmetric without exposing the initiator'
);

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000052', true);
set local role authenticated;
select extensions.is(
  (
    select count(*)::bigint from public.profiles
    where user_id = '70000000-0000-4000-8000-000000000051'
  ),
  0::bigint,
  'either-direction block hides the global profile'
);
select extensions.ok(
  (
    select count(*) = 0
    from public.organization_profiles
    where organization_membership_id = '63000000-0000-4000-8000-000000000051'
  )
  and (
    select count(*) = 0
    from public.helper_preferences
    where organization_membership_id = '63000000-0000-4000-8000-000000000051'
  )
  and (
    select count(*) = 0
    from public.helper_topics
    where organization_membership_id = '63000000-0000-4000-8000-000000000051'
  ),
  'block hides organization profile and helper availability surfaces'
);
select extensions.is(
  (
    select count(*)::bigint
    from api.list_conversation_messages_before(
      '67000000-0000-4000-8000-000000000051',
      null,
      100
    )
  ),
  0::bigint,
  'block hides existing conversation messages in either direction'
);
reset role;

select extensions.is(
  (
    select count(*)::bigint from public.connections
    where id = '65000000-0000-4000-8000-000000000051'
  ),
  0::bigint,
  'blocking removes the connection edge'
);
select extensions.is(
  (
    select status from public.connection_requests
    where id = '64000000-0000-4000-8000-000000000052'
  ),
  'cancelled',
  'blocking cancels pending connection requests'
);
select extensions.is(
  (
    select status from public.asks
    where id = '66000000-0000-4000-8000-000000000051'
  ),
  'closed',
  'blocking closes the direct Help request between the pair'
);
select extensions.is(
  (
    select count(*)::bigint from private.audit_log
    where actor_user_id = '70000000-0000-4000-8000-000000000051'
      and action = 'safety.member_blocked'
      and target_id = '70000000-0000-4000-8000-000000000052'
  ),
  1::bigint,
  'block command writes the expected non-PII audit event'
);

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000051', true);
set local role authenticated;
select extensions.lives_ok(
  $$select api.unblock_member('70000000-0000-4000-8000-000000000052')$$,
  'block owner can remove their directional block'
);
reset role;

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000052', true);
set local role authenticated;
select extensions.is(
  (
    select count(*)::bigint from public.profiles
    where user_id = '70000000-0000-4000-8000-000000000051'
  ),
  1::bigint,
  'profile visibility returns after the only block is removed'
);
select api.block_member('70000000-0000-4000-8000-000000000051');
select extensions.is(
  (
    select count(*)::bigint from public.profiles
    where user_id = '70000000-0000-4000-8000-000000000051'
  ),
  0::bigint,
  'reverse-direction block enforces the identical visibility denial'
);
reset role;

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000053', true);
set local role authenticated;
select api.save_profile_identity(
  '63000000-0000-4000-8000-000000000053',
  'Reliability Audit Updated', null, null, 2004::smallint
);
select api.save_profile_education(
  '63000000-0000-4000-8000-000000000053',
  'Audit University', 'Audit Major',
  '[{"school":"Audit University","degree":"BA","startYear":2000,"endYear":2004}]'::jsonb
);
select api.save_profile_current(
  '63000000-0000-4000-8000-000000000053',
  'Audit Co', 'Audit Role', 'Audit City', 'Audit headline',
  'Technology'
);
select api.save_profile_history(
  '63000000-0000-4000-8000-000000000053',
  '[{"employer":"Audit Co","title":"Audit Role","startYear":2020}]'::jsonb,
  array['Auditing']
);
select api.save_profile_preferences(
  '63000000-0000-4000-8000-000000000053',
  'Audit bio', true, array['Audit topic'],
  'https://www.linkedin.com/in/reliability-audit',
  'review_before_update', 'monthly', true
);
select api.set_my_avatar_path(
  '63000000-0000-4000-8000-000000000053',
  '70000000-0000-4000-8000-000000000053/audit.webp'
);
reset role;

select extensions.is(
  (
    select array_agg(action order by action)
    from private.audit_log
    where actor_user_id = '70000000-0000-4000-8000-000000000053'
  ),
  array[
    'profile.avatar_saved', 'profile.current_saved',
    'profile.education_saved', 'profile.history_saved',
    'profile.identity_saved', 'profile.preferences_saved'
  ]::text[],
  'every mutable profile command writes its reviewed audit action'
);
select extensions.ok(
  not exists (
    select 1
    from private.audit_log a
    where a.actor_user_id = '70000000-0000-4000-8000-000000000053'
      and a.payload ?| array[
        'displayName', 'bio', 'linkedinUrl', 'avatarPath',
        'employer', 'title', 'city', 'headline'
      ]
  ),
  'profile audit payloads contain no profile PII'
);
select extensions.ok(
  (
    select count(*) = 6
      and bool_and(organization_id = '60000000-0000-4000-8000-000000000040')
      and bool_and(target_type = 'profile')
      and bool_and(target_id = '70000000-0000-4000-8000-000000000053')
    from private.audit_log
    where actor_user_id = '70000000-0000-4000-8000-000000000053'
  ),
  'profile audits retain exact actor, organization, and target identity'
);

select extensions.has_function(
  'api', 'claim_outbox_jobs', array['text', 'integer', 'text[]'],
  'service outbox claim wrapper filters to implemented worker job types'
);
select extensions.has_function(
  'api', 'complete_outbox_job', array['bigint', 'text'],
  'service outbox completion wrapper exists'
);
select extensions.has_function(
  'api', 'retry_outbox_job', array['bigint', 'text', 'text', 'timestamp with time zone'],
  'service outbox retry wrapper exists'
);
select extensions.has_function(
  'api', 'fail_outbox_job', array['bigint', 'text', 'text'],
  'service outbox terminal-failure wrapper exists'
);

\if :outbox_api_exists
select extensions.ok(
  has_function_privilege('service_role', 'api.claim_outbox_jobs(text,integer)', 'execute')
  and has_function_privilege('service_role', 'api.complete_outbox_job(bigint,text)', 'execute')
  and has_function_privilege('service_role', 'api.retry_outbox_job(bigint,text,text,timestamp with time zone)', 'execute')
  and has_function_privilege('service_role', 'api.fail_outbox_job(bigint,text,text)', 'execute')
  and not has_function_privilege('authenticated', 'api.claim_outbox_jobs(text,integer)', 'execute')
  and not has_function_privilege('anon', 'api.claim_outbox_jobs(text,integer)', 'execute'),
  'outbox wrappers are service-only'
);

insert into private.outbox_jobs (
  id, job_type, payload, dedupe_key, status, attempts, max_attempts,
  available_at, locked_at, locked_by
) overriding system value values
  (
    980001, 'index_profile', '{}', 'reliability:claim:1',
    'pending', 0, 8, '-infinity'::timestamptz, null, null
  ),
  (
    980002, 'index_profile', '{}', 'reliability:claim:2',
    'pending', 0, 8, '-infinity'::timestamptz, null, null
  ),
  (
    980003, 'index_profile', '{}', 'reliability:cap',
    'processing', 1, 1, now(), now(), 'worker-cap'
  ),
  (
    980004, 'index_profile', '{}', 'reliability:fail',
    'processing', 1, 8, now(), now(), 'worker-fail'
  );

set local role service_role;
select extensions.is(
  (select count(*)::bigint from api.claim_outbox_jobs('worker-a', 2)),
  2::bigint,
  'worker atomically claims the requested available jobs'
);
reset role;
select extensions.ok(
  (
    select count(*) = 2
      and bool_and(status = 'processing')
      and bool_and(locked_by = 'worker-a')
      and bool_and(attempts = 1)
    from private.outbox_jobs
    where id in (980001, 980002)
  ),
  'claimed jobs record one attempt and the lock owner'
);

set local role service_role;
select extensions.is(
  api.complete_outbox_job(980001, 'worker-a'),
  'completed',
  'lock owner can complete a claimed job'
);
reset role;
select extensions.ok(
  (
    select status = 'completed' and completed_at is not null
      and locked_by = 'worker-a'
    from private.outbox_jobs where id = 980001
  ),
  'completed job keeps durable owner evidence'
);

set local role service_role;
select extensions.is(
  api.complete_outbox_job(980002, 'worker-b'),
  'lock_not_owned',
  'another worker cannot complete a claimed job'
);
select extensions.is(
  api.retry_outbox_job(980002, 'worker-b', 'temporary', now()),
  'lock_not_owned',
  'another worker cannot retry a claimed job'
);
select api.retry_outbox_job(
  980002, 'worker-a', 'temporary', now() + interval '1 hour'
) as retry_result \gset
reset role;
select extensions.ok(
  :'retry_result' = 'pending'
  and (
    select status = 'pending' and locked_at is null and locked_by is null
      and last_error = 'temporary' and available_at > now()
    from private.outbox_jobs where id = 980002
  ),
  'owner retry clears the lock and schedules the next attempt'
);

set local role service_role;
select api.retry_outbox_job(
  980003, 'worker-cap', 'attempt cap reached', now()
) as capped_result \gset
reset role;
select extensions.ok(
  :'capped_result' = 'failed'
  and (
    select status = 'failed' and last_error = 'attempt cap reached'
    from private.outbox_jobs where id = 980003
  ),
  'retry at max attempts becomes a terminal failure'
);

set local role service_role;
select extensions.is(
  api.fail_outbox_job(980004, 'worker-fail', 'permanent'),
  'failed',
  'lock owner can mark a job terminally failed'
);
select extensions.is(
  api.fail_outbox_job(980004, 'worker-other', 'overwrite'),
  'lock_not_owned',
  'another worker cannot overwrite terminal failure evidence'
);
reset role;

insert into private.outbox_jobs (
  id, job_type, payload, dedupe_key, status, attempts, max_attempts,
  available_at, locked_at, locked_by
) overriding system value values (
  980005, 'index_profile', '{}', 'reliability:stale',
  'processing', 0, 8, '-infinity'::timestamptz,
  '-infinity'::timestamptz, 'worker-stale-old'
);

set local role service_role;
select extensions.is(
  (select count(*)::bigint from api.claim_outbox_jobs('worker-stale-new', 1)),
  1::bigint,
  'claim recovers one stale processing lock before selecting work'
);
reset role;
select extensions.ok(
  (
    select status = 'processing' and attempts = 1
      and locked_by = 'worker-stale-new' and locked_at > now() - interval '1 minute'
    from private.outbox_jobs where id = 980005
  ),
  'stale job is reclaimed with the new worker identity'
);
\else
select * from extensions.skip(13, 'service outbox wrappers are not implemented yet');
\endif

select * from extensions.finish();
rollback;
