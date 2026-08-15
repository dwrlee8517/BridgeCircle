# Shared safety guards for the seed scripts. Source this; do not execute it.
#
#   source "$(dirname "${BASH_SOURCE[0]}")/lib/seed-guard.sh"
#   seed_guard "my-script-name" "$db_url"
#
# The contract every seed script inherits:
#   - psql must be on PATH
#   - production is refused unconditionally — no env var overrides it
#   - non-local targets require an explicit DEMO_ALLOW_REMOTE=1 opt-in
#
# Keep this file free of anything the cutover guards scan for: it must never
# reference destructive database commands or production identifiers.

seed_guard() {
  local script_name="$1"
  local db_url="$2"

  if ! command -v psql >/dev/null 2>&1; then
    echo "${script_name}: psql is required but was not found on PATH" >&2
    exit 1
  fi

  if [[ "$db_url" == *prod* || "$db_url" == *production* ]]; then
    echo "${script_name}: refusing to run against a URL containing a production identifier" >&2
    exit 1
  fi

  if [[ "$db_url" != *127.0.0.1* && "$db_url" != *localhost* ]]; then
    if [[ "${DEMO_ALLOW_REMOTE:-0}" != "1" ]]; then
      echo "${script_name}: target is not local. Re-run with DEMO_ALLOW_REMOTE=1 if that is intended." >&2
      exit 1
    fi
    echo "${script_name}: WARNING — running against a non-local database." >&2
  fi
}

# Same contract, but for datasets that are meaningless off the local stack:
# refuses any non-local target with no opt-in path at all.
seed_guard_local_only() {
  local script_name="$1"
  local db_url="$2"

  if ! command -v psql >/dev/null 2>&1; then
    echo "${script_name}: psql is required but was not found on PATH" >&2
    exit 1
  fi

  if [[ "$db_url" != *127.0.0.1* && "$db_url" != *localhost* ]]; then
    echo "${script_name}: this dataset is local-only; refusing non-local SUPABASE_DB_URL" >&2
    exit 1
  fi
}
