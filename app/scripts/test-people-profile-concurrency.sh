#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for the local People/Profile concurrency contract" >&2
  exit 127
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
psql_base=(psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet)

missing_contracts="$(${psql_base[@]} --tuples-only --no-align <<'SQL'
select string_agg(contract_name, ', ' order by contract_name)
from (
  values
    ('member profile projection', to_regprocedure('api.get_member_profile(uuid,uuid)') is not null),
    ('profile links command', to_regprocedure('api.save_profile_links(uuid,jsonb)') is not null),
    ('profile visibility command', to_regprocedure('api.save_profile_visibility(uuid,jsonb)') is not null)
) required(contract_name, present)
where not coalesce(present, false);
SQL
)"

if [[ -n "$missing_contracts" ]]; then
  echo "People/Profile race fixtures are ready; planned database contracts are still red: $missing_contracts" >&2
  exit 1
fi

echo "People/Profile concurrency contracts are present; race scenarios will run after schema implementation"
