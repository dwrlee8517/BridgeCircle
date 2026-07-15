#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for local Messages query-plan checks" >&2
  exit 127
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
psql_base=(psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet)
required=(
  "api.list_conversation_summaries(text,text,smallint,timestamp with time zone,uuid,integer)"
  "api.list_messages_waiting()"
  "api.get_messages_counts()"
)
missing=()
for signature in "${required[@]}"; do
  if [[ "$("${psql_base[@]}" --tuples-only --no-align --command "select to_regprocedure('$signature') is not null")" != "t" ]]; then
    missing+=("$signature")
  fi
done
if (( ${#missing[@]} > 0 )); then
  printf 'Messages query-plan fixtures are ready; planned target is missing: %s\n' "${missing[@]}" >&2
  exit 1
fi

plan_output="$("${psql_base[@]}" <<'SQL'
begin;

insert into public.asks (
  organization_id, asker_membership_id, kind, status, recipient_membership_id,
  question, request_message, client_request_id, accepted_at, responded_at,
  expires_at, created_at
)
select
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000005',
  'direct', 'accepted', '20000000-0000-4000-8000-000000000003',
  case when fixture = 2000 then 'messagesplanneedle' else 'Messages plan Ask ' || fixture end,
  'Planner-only accepted request.', gen_random_uuid(), now(), now(),
  now() + interval '14 days',
  now() - fixture * interval '1 second'
from generate_series(1, 2000) fixture;

insert into public.conversations (
  kind, user_a_id, user_b_id, organization_id, ask_id, last_message_at, created_at
)
select
  'ask',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000005',
  a.organization_id, a.id, a.created_at, a.created_at
from public.asks a
where a.question like 'Messages plan Ask %' or a.question = 'messagesplanneedle';

insert into public.messages (
  conversation_id, sender_user_id, kind, body, client_nonce, created_at
)
select
  c.id,
  case when message_number % 2 = 0 then c.user_a_id else c.user_b_id end,
  'user', 'Messages planner body ' || message_number,
  gen_random_uuid(), c.created_at + message_number * interval '1 millisecond'
from public.conversations c
cross join generate_series(1, 20) message_number
where c.ask_id in (
  select id from public.asks where question like 'Messages plan Ask %' or question = 'messagesplanneedle'
);

insert into public.asks (
  organization_id, asker_membership_id, kind, status, recipient_membership_id,
  question, request_message, client_request_id, expires_at, created_at
)
select
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000006',
  'direct', 'waiting', '20000000-0000-4000-8000-000000000003',
  'Messages Waiting plan Ask ' || fixture, 'Planner-only request.',
  gen_random_uuid(), now() + interval '14 days', now() - fixture * interval '1 second'
from generate_series(1, 500) fixture;

insert into public.connection_requests (
  requester_user_id, recipient_user_id, origin_organization_id, status,
  client_request_id, responded_at, created_at
)
select
  '10000000-0000-4000-8000-000000000005',
  '10000000-0000-4000-8000-000000000003',
  '11111111-1111-4111-8111-111111111111', 'declined', gen_random_uuid(), now(),
  now() - fixture * interval '1 second'
from generate_series(1, 500) fixture;

analyze public.asks;
analyze public.connection_requests;
analyze public.conversations;
analyze public.messages;

explain (analyze, buffers, costs off)
select c.id from public.conversations c
where c.user_a_id = '10000000-0000-4000-8000-000000000003'
order by c.last_message_at desc nulls last, c.id
limit 50;

explain (analyze, buffers, costs off)
select m.id from public.messages m
where m.conversation_id = '50000000-0000-4000-8000-000000000001'
order by m.id desc limit 1;

explain (analyze, buffers, costs off)
select a.id from public.asks a
where a.recipient_membership_id = '20000000-0000-4000-8000-000000000003'
  and a.kind = 'direct'
  and a.status = 'waiting'
order by a.created_at desc limit 50;

explain (analyze, buffers, costs off)
select r.id from public.connection_requests r
where r.recipient_user_id = '10000000-0000-4000-8000-000000000003'
  and r.status = 'pending'
order by r.created_at desc limit 50;

rollback;
SQL
)"

required_indexes=(
  conversations_user_a_last_idx
  messages_conversation_id_key
  asks_recipient_status_created_idx
  connection_requests_recipient_status_idx
)
for index_name in "${required_indexes[@]}"; do
  if [[ "$plan_output" != *"$index_name"* ]]; then
    echo "representative Messages plan did not use expected index: $index_name" >&2
    echo "$plan_output" >&2
    exit 1
  fi
done

echo "Messages query plans use participant, latest-message, direct-Ask, and Connection indexes"
