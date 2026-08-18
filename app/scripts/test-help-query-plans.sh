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
  "api.list_my_asks(uuid,timestamp with time zone,uuid,integer)"
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
  '11111111-1111-4111-8111-111111111111',
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
  '11111111-1111-4111-8111-111111111111',
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
  source_section, visibility_tier, content, content_version, content_hash, fingerprint,
  embedding_model, embedding
)
select
  '11111111-1111-4111-8111-111111111111',
  '10000000-0000-4000-8000-000000000003',
  '20000000-0000-4000-8000-000000000003',
  'raw',
  'bio',
  'organization',
  case when fixture = 1
    then 'planneedle specialized experience'
    else 'ordinary profile planner fixture ' || fixture
  end,
  'help-profile-v1',
  encode(digest('help-plan-' || fixture::text, 'sha256'), 'hex'),
  encode(digest('help-plan-fingerprint-' || fixture::text, 'sha256'), 'hex'),
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
where c.organization_id = '11111111-1111-4111-8111-111111111111'
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

# ---------------------------------------------------------------------------
# Deterministic-baseline latency guard. The baseline computes the weighted
# helper-card tsvector INLINE per query (no stored document), which is
# O(eligible helpers) per search. This is the tripwire for the escape hatch
# (a trigger-maintained document table — see the help-search-golden-baseline
# initiative, Risks): ~2,000 eligible helpers in a rolled-back transaction,
# hard ceiling 1000 ms.
# ---------------------------------------------------------------------------
latency_output="$("${psql_base[@]}" <<'SQL'
begin;

insert into public.users (id, onboarding_completed_at)
select ('82000000-0000-4000-8000-' || lpad(fixture::text, 12, '0'))::uuid, now()
from generate_series(1, 2000) fixture;

insert into public.organization_memberships (id, user_id, organization_id, status, joined_at)
select
  ('82111111-1111-4111-8111-' || lpad(fixture::text, 12, '0'))::uuid,
  ('82000000-0000-4000-8000-' || lpad(fixture::text, 12, '0'))::uuid,
  '11111111-1111-4111-8111-111111111111',
  'active',
  now()
from generate_series(1, 2000) fixture;

insert into public.profiles (
  user_id, display_name, headline, current_employer, current_title, industry, city
)
select
  ('82000000-0000-4000-8000-' || lpad(fixture::text, 12, '0'))::uuid,
  'Latency Fixture ' || fixture,
  case when fixture % 2 = 0 then 'Consulting engagements and offer negotiation at scale' end,
  'Fixture Corp',
  case when fixture % 3 = 0 then 'Consultant' else 'Analyst' end,
  'Management consulting',
  'Planville, TS'
from generate_series(1, 2000) fixture;

insert into public.helper_preferences (
  organization_membership_id, organization_id, open_to_help, max_pending_requests
)
select
  ('82111111-1111-4111-8111-' || lpad(fixture::text, 12, '0'))::uuid,
  '11111111-1111-4111-8111-111111111111',
  true,
  100
from generate_series(1, 2000) fixture;

insert into public.helper_topics (
  organization_membership_id, organization_id, name, normalized_name, sort_order
)
select
  ('82111111-1111-4111-8111-' || lpad(fixture::text, 12, '0'))::uuid,
  '11111111-1111-4111-8111-111111111111',
  case when fixture % 2 = 0 then 'Consulting' else 'Negotiating an offer' end,
  case when fixture % 2 = 0 then 'consulting' else 'negotiating an offer' end,
  0
from generate_series(1, 2000) fixture;

analyze public.organization_memberships;
analyze public.profiles;
analyze public.helper_preferences;
analyze public.helper_topics;

explain (analyze, costs off, timing off, summary on)
select *
from private.search_help_candidates(
  '11111111-1111-4111-8111-111111111111',
  '10000000-0000-4000-8000-000000000004',
  'negotiating a consulting offer',
  null,
  40
);

rollback;
SQL
)"

baseline_ms="$(printf '%s\n' "$latency_output" | awk '/Execution Time/ {print $3}' | tail -1)"
if [[ -z "$baseline_ms" ]]; then
  echo "baseline latency guard could not read an execution time" >&2
  echo "$latency_output" >&2
  exit 1
fi
if awk -v ms="$baseline_ms" 'BEGIN { exit !(ms > 1000) }'; then
  echo "deterministic baseline took ${baseline_ms} ms at ~2,000 eligible helpers (ceiling 1000 ms) — time for the stored-document escape hatch" >&2
  exit 1
fi
echo "deterministic baseline search: ${baseline_ms} ms at ~2,000 eligible helpers (ceiling 1000 ms)"
