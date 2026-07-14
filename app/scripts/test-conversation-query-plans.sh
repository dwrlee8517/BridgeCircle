#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for the local Conversation query-plan contract" >&2
  exit 1
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
plan_output="$(mktemp "${TMPDIR:-/tmp}/bridgecircle-conversation-plans.XXXXXX")"
psql_base=(psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet)

cleanup() {
  rm -f "$plan_output"
}
trap cleanup EXIT

"${psql_base[@]}" >"$plan_output" <<'SQL'
begin;
set local session_replication_role = replica;

insert into public.users (id)
select ('80000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid
from generate_series(1, 5000) as fixture(i);

insert into public.conversations (id, kind, user_a_id, user_b_id)
select
  ('81000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  'direct',
  '10000000-0000-4000-8000-000000000002'::uuid,
  ('80000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid
from generate_series(1, 5000) as fixture(i);

insert into public.messages (
  conversation_id, sender_user_id, kind, body, client_nonce
)
select
  ('81000000-0000-4000-8000-' || lpad(conversation_number::text, 12, '0'))::uuid,
  '10000000-0000-4000-8000-000000000002'::uuid,
  'user',
  'Synthetic query-plan fixture',
  (
    '82000000-'
    || lpad(conversation_number::text, 4, '0')
    || '-4000-8000-'
    || lpad(message_number::text, 12, '0')
  )::uuid
from generate_series(1, 201) as conversations(conversation_number)
cross join generate_series(1, 200) as messages(message_number);

analyze public.users;
analyze public.conversations;
analyze public.messages;
analyze public.conversation_reads;

\echo participant_lookup
explain (costs off)
select 1
from public.conversations c
join public.users viewer
  on viewer.id = '10000000-0000-4000-8000-000000000002'
where c.id = '81000000-0000-4000-8000-000000000001'
  and '10000000-0000-4000-8000-000000000002' in (c.user_a_id, c.user_b_id)
  and viewer.account_state = 'active';

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000002',
  true
);

\echo valid_topic
explain (costs off)
select private.can_access_conversation_topic(
  'conversation:81000000-0000-4000-8000-000000000001'
);

\echo malformed_topic
explain (costs off)
select private.can_access_conversation_topic('conversation:not-a-uuid');

\echo older_history
explain (costs off)
select m.id
from public.messages m
where m.conversation_id = '81000000-0000-4000-8000-000000000001'
  and m.id < (
    select max(candidate.id) - 50
    from public.messages candidate
    where candidate.conversation_id = '81000000-0000-4000-8000-000000000001'
  )
order by m.id desc
limit 50;

\echo gap_history
explain (costs off)
select m.id
from public.messages m
where m.conversation_id = '81000000-0000-4000-8000-000000000001'
  and m.id > (
    select max(candidate.id) - 100
    from public.messages candidate
    where candidate.conversation_id = '81000000-0000-4000-8000-000000000001'
  )
order by m.id asc
limit 100;

\echo nonce_lookup
explain (costs off)
select m.id
from public.messages m
where m.conversation_id = '81000000-0000-4000-8000-000000000001'
  and m.sender_user_id = '10000000-0000-4000-8000-000000000002'
  and m.client_nonce = '82000000-0001-4000-8000-000000000001';

\echo monotonic_read_upsert
explain (costs off)
insert into public.conversation_reads (
  conversation_id, user_id, last_read_message_id, last_read_at
)
select
  '81000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  max(m.id),
  now()
from public.messages m
where m.conversation_id = '81000000-0000-4000-8000-000000000001'
on conflict (conversation_id, user_id) do update
set last_read_message_id = excluded.last_read_message_id,
    last_read_at = excluded.last_read_at
where public.conversation_reads.last_read_message_id is null
   or public.conversation_reads.last_read_message_id < excluded.last_read_message_id;

\echo direct_pair_lookup
explain (costs off)
select c.id
from public.conversations c
where c.kind = 'direct'
  and c.user_a_id = '10000000-0000-4000-8000-000000000002'
  and c.user_b_id = '80000000-0000-4000-8000-000000000001';

rollback;
SQL

require_plan() {
  local needle="$1"
  local description="$2"
  if ! grep -Fq "$needle" "$plan_output"; then
    echo "query-plan contract failed: $description" >&2
    sed -n '1,240p' "$plan_output" >&2
    exit 1
  fi
}

require_plan "conversations_pkey" "participant lookup did not use the conversation primary key"
require_plan "users_pkey" "participant lookup did not use the user primary key"
require_plan "messages_conversation_id_key" "bounded history did not use the conversation/message keyset index"
require_plan "messages_client_nonce_key" "nonce lookup did not use the partial unique index"
require_plan "Conflict Arbiter Indexes: conversation_reads_pkey" "read UPSERT did not use the composite primary key"
require_plan "conversations_direct_pair_key" "direct pair lookup did not use the scoped unique index"

history_index_uses="$(grep -Fc "messages_conversation_id_key" "$plan_output")"
if (( history_index_uses < 4 )); then
  echo "query-plan contract failed: older/gap cursor scans were not all index-backed" >&2
  sed -n '1,240p' "$plan_output" >&2
  exit 1
fi

echo "Conversation query plans use primary, pair, nonce, read-cursor, and bounded-history indexes"
