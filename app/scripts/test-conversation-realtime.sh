#!/usr/bin/env bash
set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required for the local Conversation Realtime contract" >&2
  exit 1
fi
if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for local Realtime fixture cleanup" >&2
  exit 1
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
conversation_id="50000000-0000-4000-8000-000000000001"
richard_id="10000000-0000-4000-8000-000000000002"
mei_id="10000000-0000-4000-8000-000000000004"

cleanup() {
  psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet <<'SQL' >/dev/null 2>&1 || true
delete from private.outbox_jobs
where dedupe_key in (
  select 'message_received:' || m.id::text
  from public.messages m
  where m.client_nonce between
    '92000000-0000-4000-8000-000000000001'::uuid
    and '92000000-0000-4000-8000-000000000099'::uuid
);
delete from public.conversation_reads
where conversation_id = '50000000-0000-4000-8000-000000000001'
  and user_id in (
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000004'
  );
delete from public.messages
where client_nonce between
  '92000000-0000-4000-8000-000000000001'::uuid
  and '92000000-0000-4000-8000-000000000099'::uuid;
delete from public.member_blocks
where blocker_user_id = '10000000-0000-4000-8000-000000000002'
  and blocked_user_id = '10000000-0000-4000-8000-000000000004';
insert into public.connections (
  user_a_id, user_b_id, origin_organization_id
) values (
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000004',
  '11111111-1111-1111-1111-111111111111'
)
on conflict (user_a_id, user_b_id) do nothing;
delete from private.conversation_typing_limits
where conversation_id = '50000000-0000-4000-8000-000000000001'
  and user_id in (
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000004'
  );
SQL
}

trap cleanup EXIT

supabase_url="$(pnpm exec supabase status --output json 2>/dev/null | jq -er '.API_URL')"
publishable_key="$(pnpm exec supabase status --output json 2>/dev/null | jq -er '.PUBLISHABLE_KEY // .ANON_KEY')"

if [[ ! "$supabase_url" =~ ^https?://(localhost|127\.0\.0\.1) ]]; then
  echo "Conversation Realtime tests refuse non-local Supabase URL: $supabase_url" >&2
  exit 1
fi

NEXT_PUBLIC_SUPABASE_URL="$supabase_url" \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$publishable_key" \
CONVERSATION_TEST_ID="$conversation_id" \
CONVERSATION_TEST_RICHARD_ID="$richard_id" \
CONVERSATION_TEST_MEI_ID="$mei_id" \
node scripts/test-conversation-realtime.mjs
