#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for the local Home concurrency contract" >&2
  exit 127
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/bridgecircle-home-concurrency.XXXXXX")"
psql_base=(psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet --tuples-only --no-align)
ask_id="30000000-0000-4000-8000-000000000004"
user_id="10000000-0000-4000-8000-000000000002"

cleanup() {
  "${psql_base[@]}" --command "delete from private.ask_outcome_shares where ask_id = '$ask_id'" >/dev/null 2>&1 || true
  find "$work_dir" -type f -delete 2>/dev/null || true
  rmdir "$work_dir" 2>/dev/null || true
}
trap cleanup EXIT
cleanup
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/bridgecircle-home-concurrency.XXXXXX")"
trap cleanup EXIT

run_save() {
  local index="$1"
  local story="true"
  local identity="false"
  if (( index % 2 == 0 )); then
    story="false"
  fi
  if (( index % 4 == 1 )); then
    identity="true"
  fi
  PGAPPNAME="bridgecircle-home-consent-$index" "${psql_base[@]}" >"$work_dir/$index.out" <<SQL
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '$user_id';
select result_code from api.save_ask_outcome_share('$ask_id', $story, $identity);
commit;
SQL
}

pids=()
for index in $(seq 1 20); do
  run_save "$index" &
  pids+=("$!")
done

failures=0
for pid in "${pids[@]}"; do
  wait "$pid" || failures=$((failures + 1))
done
if (( failures != 0 )); then
  echo "parallel Home consent saves had $failures failed callers" >&2
  exit 1
fi
for output_file in "$work_dir"/*.out; do
  if [[ "$(tr -d '[:space:]' <"$output_file")" != "saved" ]]; then
    echo "a parallel Home consent save returned an unexpected result" >&2
    sed -n '1,20p' "$work_dir"/*.out >&2
    exit 1
  fi
done

row_state="$(${psql_base[@]} --field-separator='|' --command "
  select count(*), bool_and(not share_identity or share_story)
  from private.ask_outcome_shares
  where ask_id = '$ask_id' and participant_user_id = '$user_id'
")"
if [[ "$row_state" != "1|t" ]]; then
  echo "parallel Home consent did not converge to one valid row: $row_state" >&2
  exit 1
fi

final_state="$(${psql_base[@]} --field-separator='|' <<SQL
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '$user_id';
select share_story, share_identity
from api.save_ask_outcome_share('$ask_id', true, false);
commit;
SQL
)"
if [[ "$final_state" != "t|f" ]]; then
  echo "a final Home consent update did not deterministically win: $final_state" >&2
  exit 1
fi

echo "Parallel Home consent updates converge to one valid, last-committed row"
