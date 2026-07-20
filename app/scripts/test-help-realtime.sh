#!/usr/bin/env bash
set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required for the local Help Realtime contract" >&2
  exit 1
fi
if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for the local Help Realtime contract" >&2
  exit 1
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
request_id="93000000-0000-4000-8000-000000000001"

cleanup() {
  psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet <<SQL >/dev/null 2>&1 || true
delete from private.outbox_jobs
where payload ->> 'askId' in (
  select id::text from public.asks where client_request_id = '$request_id'
);
delete from public.notifications
where target_type = 'ask'
  and target_id in (
    select id::text from public.asks where client_request_id = '$request_id'
  );
delete from public.asks where client_request_id = '$request_id';
SQL
}
trap cleanup EXIT
cleanup

supabase_url="$(pnpm exec supabase status --output json 2>/dev/null | jq -er '.API_URL')"
publishable_key="$(pnpm exec supabase status --output json 2>/dev/null | jq -er '.PUBLISHABLE_KEY // .ANON_KEY')"

if [[ ! "$supabase_url" =~ ^https?://(localhost|127\.0\.0\.1) ]]; then
  echo "Help Realtime tests refuse non-local Supabase URL: $supabase_url" >&2
  exit 1
fi

NEXT_PUBLIC_SUPABASE_URL="$supabase_url" \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$publishable_key" \
HELP_TEST_REQUEST_ID="$request_id" \
node scripts/test-help-realtime.mjs
