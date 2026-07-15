#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for local People/Profile query-plan checks" >&2
  exit 127
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
psql_base=(psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet)
required=(
  "api.list_people(uuid,text,text,text,smallint,smallint,text,text,text,text,extensions.vector,integer)"
  "api.get_member_profile(uuid,uuid)"
)
missing=()
for signature in "${required[@]}"; do
  if [[ "$("${psql_base[@]}" --tuples-only --no-align --command "select to_regprocedure('$signature') is not null")" != "t" ]]; then
    missing+=("$signature")
  fi
done

if (( ${#missing[@]} > 0 )); then
  printf 'People/Profile query-plan fixtures are ready; planned target is missing: %s\n' "${missing[@]}" >&2
  exit 1
fi

echo "People/Profile database projections are present; representative plan fixtures will run after schema implementation"
