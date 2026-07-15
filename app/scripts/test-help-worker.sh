#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for the local Help worker contract" >&2
  exit 1
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
psql_base=(psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet)

cleanup() {
  "${psql_base[@]}" <<'SQL' >/dev/null 2>&1 || true
delete from private.outbox_jobs where dedupe_key like 'help:worker-baseline:%';
delete from private.profile_embedding_chunks where fingerprint = repeat('b', 64);
delete from public.asks where id = '82000000-0000-4000-8000-000000000002';
delete from public.asks where id = '82000000-0000-4000-8000-000000000001';
SQL
}
trap cleanup EXIT
cleanup

if [[ "$("${psql_base[@]}" --tuples-only --no-align --command "select to_regprocedure('api.claim_outbox_jobs(text,integer,text[])') is not null")" != "t" ]]; then
  echo "Help worker claim API does not yet filter supported job types" >&2
  exit 1
fi

"${psql_base[@]}" <<'SQL' >/dev/null
insert into private.outbox_jobs (job_type, payload, dedupe_key, available_at) values
  ('create_notification', '{"fixture":1}', 'help:worker-baseline:supported-1', now() - interval '1 minute'),
  ('run_ask_matching', '{"fixture":2}', 'help:worker-baseline:supported-2', now() - interval '1 minute'),
  ('process_account_deletion', '{"fixture":3}', 'help:worker-baseline:unsupported-1', now() - interval '1 minute'),
  ('delete_storage_objects', '{"fixture":4}', 'help:worker-baseline:unsupported-2', now() - interval '1 minute');

begin;
set local role service_role;
select * from api.claim_outbox_jobs(
  'help-worker-baseline', 10,
  array['create_notification', 'run_ask_matching']::text[]
);
commit;

do $$
begin
  if (
    select count(*) from private.outbox_jobs
    where dedupe_key like 'help:worker-baseline:supported-%'
      and status = 'processing' and locked_by = 'help-worker-baseline'
  ) <> 2 then
    raise exception 'expected exactly two supported jobs to be claimed';
  end if;
  if (
    select count(*) from private.outbox_jobs
    where dedupe_key like 'help:worker-baseline:unsupported-%'
      and status = 'pending' and locked_by is null
  ) <> 2 then
    raise exception 'unsupported jobs must remain pending and unclaimed';
  end if;
end;
$$;

delete from private.outbox_jobs where dedupe_key like 'help:worker-baseline:%';

insert into public.asks (
  id, organization_id, asker_membership_id, kind, status, question, reach,
  anonymous_until_accepted, client_request_id
) values (
  '82000000-0000-4000-8000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  '20000000-0000-4000-8000-000000000005',
  'circle', 'open', 'Who can speak to product management?', 'matched', true,
  '82000000-0000-4000-8000-000000000101'
);

insert into public.ask_offers (
  id, organization_id, ask_id, helper_membership_id, offer_note, client_request_id
) values (
  '83000000-0000-4000-8000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  '82000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000004',
  'Happy to compare notes.',
  '83000000-0000-4000-8000-000000000101'
);

insert into private.outbox_jobs (job_type, payload, dedupe_key, available_at) values
  (
    'run_ask_matching',
    '{"askId":"82000000-0000-4000-8000-000000000001"}',
    'help:worker-baseline:matching',
    now() - interval '1 minute'
  ),
  (
    'index_profile',
    '{"userId":"10000000-0000-4000-8000-000000000004","organizationId":"11111111-1111-1111-1111-111111111111","membershipId":"20000000-0000-4000-8000-000000000004"}',
    'help:worker-baseline:index',
    now() - interval '1 minute'
  ),
  (
    'send_email',
    '{"notificationType":"offer_received","recipientUserId":"10000000-0000-4000-8000-000000000004","askId":"82000000-0000-4000-8000-000000000001","offerId":"83000000-0000-4000-8000-000000000001"}',
    'help:worker-baseline:email',
    now() - interval '1 minute'
  );

set role service_role;
select * from api.claim_outbox_jobs(
  'help-worker-runtime', 10,
  array['send_email', 'run_ask_matching', 'index_profile']::text[]
);
reset role;

do $$
declare
  v_matching_job bigint;
  v_index_job bigint;
  v_email_job bigint;
begin
  select id into v_matching_job from private.outbox_jobs
  where dedupe_key = 'help:worker-baseline:matching';
  select id into v_index_job from private.outbox_jobs
  where dedupe_key = 'help:worker-baseline:index';
  select id into v_email_job from private.outbox_jobs
  where dedupe_key = 'help:worker-baseline:email';

  if not exists (
    select 1 from api.get_ask_matching_context(v_matching_job, 'help-worker-runtime')
    where ask_id = '82000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'claimed matching context was unavailable';
  end if;
  if not exists (
    select 1 from api.search_ask_matching_candidates(
      v_matching_job, 'help-worker-runtime', null, 40
    )
    where helper_membership_id = '20000000-0000-4000-8000-000000000004'
  ) then
    raise exception 'hard-gated worker candidate search missed the product helper';
  end if;
  update public.helper_preferences
  set max_pending_requests = 1
  where organization_membership_id = '20000000-0000-4000-8000-000000000004';
  insert into public.asks (
    id, organization_id, asker_membership_id, kind, status,
    recipient_membership_id, question, request_message,
    anonymous_until_accepted, client_request_id
  ) values (
    '82000000-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '20000000-0000-4000-8000-000000000002',
    'direct', 'waiting', '20000000-0000-4000-8000-000000000004',
    'Capacity fixture', 'Local worker hard-gate fixture.',
    false, '82000000-0000-4000-8000-000000000102'
  );
  if exists (
    select 1 from api.search_ask_matching_candidates(
      v_matching_job, 'help-worker-runtime', null, 40
    )
    where helper_membership_id = '20000000-0000-4000-8000-000000000004'
  ) then
    raise exception 'worker candidate search ignored helper capacity';
  end if;
  delete from public.asks where id = '82000000-0000-4000-8000-000000000002';
  update public.helper_preferences
  set max_pending_requests = 10
  where organization_membership_id = '20000000-0000-4000-8000-000000000004';
  if not exists (
    select 1 from api.get_profile_index_source(v_index_job, 'help-worker-runtime')
    where membership_id = '20000000-0000-4000-8000-000000000004'
      and jsonb_array_length(facts) > 0
  ) then
    raise exception 'claimed profile source was unavailable';
  end if;
  if not exists (
    select 1 from api.sync_profile_index(
      v_index_job,
      'help-worker-runtime',
      array[repeat('b', 64)],
      '{}'::jsonb
    ) where result_code = 'invalid_input' and chunk_count = 0
  ) or not exists (
    select 1 from api.sync_profile_index(
      v_index_job,
      'help-worker-runtime',
      array[repeat('b', 64)],
      '[1]'::jsonb
    ) where result_code = 'invalid_input' and chunk_count = 0
  ) then
    raise exception 'malformed profile chunks did not fail closed';
  end if;
  if not exists (
    select 1 from api.sync_profile_index(
      v_index_job,
      'help-worker-runtime',
      array[repeat('b', 64)],
      jsonb_build_array(jsonb_build_object(
        'chunkKind', 'raw',
        'sourceSection', 'directory',
        'visibility', 'organization',
        'content', 'Product management leader',
        'contentVersion', 'help-profile-v1',
        'contentHash', repeat('a', 64),
        'fingerprint', repeat('b', 64),
        'syntheticPromptVersion', null,
        'embeddingModel', 'voyage-4',
        'embeddingDimensions', 1024,
        'embedding', array_fill(0::real, array[1024])::extensions.vector::text
      ))
    ) where result_code = 'synced' and chunk_count = 1
  ) then
    raise exception 'profile index did not synchronize atomically';
  end if;
  if not exists (
    select 1 from api.get_outbox_email_context(v_email_job, 'help-worker-runtime')
    where idempotency_key = 'outbox:' || v_email_job::text
      and provider_result_id is null
      and target_type = 'ask'
      and target_id = '82000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'claimed email context was unavailable';
  end if;
  if api.record_outbox_provider_result(v_email_job, 'help-worker-runtime', 'email-fixture-1') <> 'recorded'
     or api.record_outbox_provider_result(v_email_job, 'help-worker-runtime', 'email-fixture-1') <> 'recorded' then
    raise exception 'email provider result was not idempotently recorded';
  end if;
end;
$$;
SQL

echo "Help worker claims only implemented types and enforces matching, index, and email durability"
