#!/usr/bin/env bash
set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required for the local Messages Realtime contract" >&2
  exit 127
fi
if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for the local Messages Realtime contract" >&2
  exit 127
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
request_key="a2000000-0000-4000-8000-000000000001"
message_nonce="a2000000-0000-4000-8000-000000000002"

cleanup() {
  psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet <<SQL >/dev/null 2>&1 || true
delete from private.outbox_jobs where dedupe_key in (
  select 'connection_requested:' || r.id::text
  from public.connection_requests r where r.client_request_id = '$request_key'
  union all
  select 'message_received:' || m.id::text
  from public.messages m where m.client_nonce = '$message_nonce'
);
delete from public.connection_requests where client_request_id = '$request_key';
delete from public.messages where client_nonce = '$message_nonce';
SQL
}
trap cleanup EXIT
cleanup

supabase_url="$(pnpm exec supabase status --output json 2>/dev/null | jq -er '.API_URL')"
publishable_key="$(pnpm exec supabase status --output json 2>/dev/null | jq -er '.PUBLISHABLE_KEY // .ANON_KEY')"

if [[ ! "$supabase_url" =~ ^https?://(localhost|127\.0\.0\.1) ]]; then
  echo "Messages Realtime tests refuse non-local Supabase URL: $supabase_url" >&2
  exit 1
fi

NEXT_PUBLIC_SUPABASE_URL="$supabase_url" \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$publishable_key" \
MESSAGES_TEST_REQUEST_KEY="$request_key" \
MESSAGES_TEST_MESSAGE_NONCE="$message_nonce" \
node scripts/test-messages-realtime.mjs
