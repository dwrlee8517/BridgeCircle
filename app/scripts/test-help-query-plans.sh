#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for local Help query-plan checks" >&2
  exit 1
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
psql_base=(psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet)

required=(
  "api.get_help_home(uuid)"
  "api.list_my_asks(timestamp with time zone,uuid,integer)"
  "api.list_give_help(uuid,text,text,timestamp with time zone,uuid,integer)"
  "api.search_help_candidates(uuid,text,extensions.vector,integer)"
)

for signature in "${required[@]}"; do
  if [[ "$("${psql_base[@]}" --tuples-only --no-align --command "select to_regprocedure('$signature') is not null")" != "t" ]]; then
    echo "Help query-plan target is missing: $signature" >&2
    exit 1
  fi
done

plan_output="$("${psql_base[@]}" <<'SQL'
begin;

insert into public.asks (
  organization_id, asker_membership_id, kind, status, question, reach,
  anonymous_until_accepted, client_request_id, ended_at, expires_at,
  created_at
)
select
  '11111111-1111-1111-1111-111111111111',
  '20000000-0000-4000-8000-000000000005',
  'circle',
  'retracted',
  'Owned history plan fixture ' || fixture,
  'organization',
  false,
  gen_random_uuid(),
  now() - fixture * interval '1 minute' + interval '1 second',
  now() - fixture * interval '1 minute' + interval '14 days',
  now() - fixture * interval '1 minute'
from generate_series(1, 2000) fixture;

insert into public.asks (
  organization_id, asker_membership_id, kind, status,
  recipient_membership_id, question, request_message,
  client_request_id, expires_at, created_at
)
select
  '11111111-1111-1111-1111-111111111111',
  '20000000-0000-4000-8000-000000000006',
  'direct',
  'waiting',
  case when fixture <= 10
    then '20000000-0000-4000-8000-000000000003'::uuid
    else '20000000-0000-4000-8000-000000000004'::uuid
  end,
  'Direct feed plan fixture ' || fixture,
  'Only local planner evidence.',
  gen_random_uuid(),
  now() + interval '14 days',
  now() - fixture * interval '1 second'
from generate_series(1, 2000) fixture;

insert into private.profile_embedding_chunks (
  organization_id, user_id, organization_membership_id, chunk_kind,
  source_section, visibility_tier, content, content_hash,
  embedding_model, embedding
)
select
  '11111111-1111-1111-1111-111111111111',
  '10000000-0000-4000-8000-000000000003',
  '20000000-0000-4000-8000-000000000003',
  'raw',
  'bio',
  'organization',
  case when fixture = 1
    then 'planneedle specialized experience'
    else 'ordinary profile planner fixture ' || fixture
  end,
  encode(digest('help-plan-' || fixture::text, 'sha256'), 'hex'),
  'fixture-embedding-v1',
  array_fill(0::real, array[1024])::extensions.vector
from generate_series(1, 2000) fixture;

analyze public.asks;
analyze private.profile_embedding_chunks;

explain (analyze, buffers, costs off)
select a.id
from public.asks a
where a.asker_membership_id = '20000000-0000-4000-8000-000000000005'
order by a.created_at desc, a.id desc
limit 20;

explain (analyze, buffers, costs off)
select a.id
from public.asks a
where a.kind = 'direct'
  and a.recipient_membership_id = '20000000-0000-4000-8000-000000000003'
  and a.status = 'waiting'
order by a.created_at desc, a.id desc
limit 20;

explain (analyze, buffers, costs off)
select c.id
from private.profile_embedding_chunks c
where c.organization_id = '11111111-1111-1111-1111-111111111111'
  and c.search_vector @@ websearch_to_tsquery('english'::regconfig, 'planneedle')
limit 20;

rollback;
SQL
)"

required_indexes=(
  "asks_asker_created_idx"
  "asks_recipient_status_created_idx"
)

for index_name in "${required_indexes[@]}"; do
  if [[ "$plan_output" != *"$index_name"* ]]; then
    echo "representative Help plan did not use expected index: $index_name" >&2
    echo "$plan_output" >&2
    exit 1
  fi
done

if [[ "$plan_output" != *"profile_embedding_chunks_search_idx"* ]]; then
  if [[ "$plan_output" != *"Seq Scan on profile_embedding_chunks"* \
     || "$plan_output" != *"Rows Removed by Filter: 1999"* ]]; then
    echo "lexical Help plan used neither its GIN index nor the bounded 2,000-row pilot scan" >&2
    echo "$plan_output" >&2
    exit 1
  fi
  echo "Help query plans use owned-history/direct-feed indexes; lexical search remains a bounded 2,000-row pilot scan"
else
  echo "Help query plans use owned-history, direct-feed, and lexical-search indexes"
fi
