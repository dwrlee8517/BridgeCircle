#!/usr/bin/env bash
set -euo pipefail

# The eval corpus — Evalfield School and the Help-search answer key's data half.
#
# Loads supabase/seeds/eval-org.sql on demand. The corpus is deliberately NOT
# in the auto-loaded seed path: routine `db reset` runs stay fast, and the
# 1,203-member corpus appears only when someone is actually grading search
# (`pnpm eval:search` auto-runs this when the org is absent).
#
# The corpus file itself is plain fixed-UUID inserts — loadable once per
# database state. This wrapper makes it rerunnable by deleting the previous
# corpus first, in FK-safe order, scoped to the eval org's ee… namespace.
#
# Local-only: the corpus exists to be measured against, and eval:search
# refuses non-local targets — so does this. There is no remote opt-in.
#
# Usage, from app/:
#   pnpm seed:eval

db_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/seed-guard.sh"
seed_guard_local_only "seed-eval" "$db_url"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
corpus_file="$script_dir/../supabase/seeds/eval-org.sql"

if [[ ! -f "$corpus_file" ]]; then
  echo "seed-eval: corpus file not found at ${corpus_file}" >&2
  exit 1
fi

psql_base=(psql "$db_url" -v ON_ERROR_STOP=1 -X -q)

echo "seed-eval: clearing any previous Evalfield corpus"

# public.users has no FK to auth.users (the app links them by convention and
# trigger, not constraint), so both sides are deleted explicitly. Order mirrors
# the restrict FKs: asks before conversations, children before parents.
"${psql_base[@]}" <<'SQL'
begin;

delete from public.ask_offers where ask_id in (
  select id from public.asks
  where organization_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');
delete from public.asks
  where organization_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
delete from public.conversation_reads where conversation_id in (
  select id from public.conversations
  where user_a_id::text like 'ee000000-%' or user_b_id::text like 'ee000000-%');
delete from public.messages where conversation_id in (
  select id from public.conversations
  where user_a_id::text like 'ee000000-%' or user_b_id::text like 'ee000000-%');
delete from public.conversations
  where user_a_id::text like 'ee000000-%' or user_b_id::text like 'ee000000-%';
delete from public.connections
  where user_a_id::text like 'ee000000-%' or user_b_id::text like 'ee000000-%';
delete from public.member_blocks
  where blocker_user_id::text like 'ee000000-%' or blocked_user_id::text like 'ee000000-%';
delete from public.helper_topics
  where organization_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
delete from public.helper_preferences
  where organization_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
delete from public.profile_skills where user_id::text like 'ee000000-%';
delete from public.profile_education where user_id::text like 'ee000000-%';
delete from public.profile_experiences where user_id::text like 'ee000000-%';
delete from public.organization_profiles
  where organization_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
delete from public.organization_memberships
  where organization_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
delete from public.profiles where user_id::text like 'ee000000-%';
delete from public.users where id::text like 'ee000000-%';
delete from public.organizations where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
delete from auth.users where email like '%@eval.test';

commit;
SQL

echo "seed-eval: loading the Evalfield corpus"
"${psql_base[@]}" -f "$corpus_file"

member_count="$("${psql_base[@]}" -t -A -c \
  "select count(*) from public.organization_memberships
   where organization_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'")"

echo "seed-eval: done. Evalfield School holds ${member_count} members."
