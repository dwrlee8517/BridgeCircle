#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for the local Help concurrency contract" >&2
  exit 1
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/bridgecircle-help-concurrency.XXXXXX")"
psql_base=(psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet)

org_id="81000000-0000-4000-8000-000000000001"
helper_user_id="81000000-0000-4000-8000-000000000010"
helper_membership_id="81000000-0000-4000-8000-000000000110"
asker_one_user_id="81000000-0000-4000-8000-000000000011"
asker_one_membership_id="81000000-0000-4000-8000-000000000111"
asker_two_user_id="81000000-0000-4000-8000-000000000012"
asker_two_membership_id="81000000-0000-4000-8000-000000000112"

cleanup() {
  exec 3>&- 2>/dev/null || true
  "${psql_base[@]}" <<SQL >/dev/null 2>&1 || true
select pg_terminate_backend(a.pid)
from pg_stat_activity a
where a.pid <> pg_backend_pid()
  and a.application_name like 'bridgecircle-help-%';
drop trigger if exists help_test_ask_barrier on public.asks;
drop function if exists private.help_test_barrier();
delete from private.outbox_jobs
where job_type = 'create_notification'
  and payload ->> 'recipientUserId' = '$helper_user_id'
  and payload ->> 'actorUserId' in ('$asker_one_user_id', '$asker_two_user_id');
delete from public.asks where organization_id = '$org_id';
delete from public.organization_memberships where organization_id = '$org_id';
delete from public.users where id in (
  '$helper_user_id', '$asker_one_user_id', '$asker_two_user_id'
);
delete from public.organizations where id = '$org_id';
SQL
  find "$work_dir" -type f -delete 2>/dev/null || true
  rmdir "$work_dir" 2>/dev/null || true
}
trap cleanup EXIT

# Recover from an interrupted prior run before creating fixed-ID fixtures.
"${psql_base[@]}" <<SQL >/dev/null
drop trigger if exists help_test_ask_barrier on public.asks;
drop function if exists private.help_test_barrier();
delete from private.outbox_jobs
where job_type = 'create_notification'
  and payload ->> 'recipientUserId' = '$helper_user_id'
  and payload ->> 'actorUserId' in ('$asker_one_user_id', '$asker_two_user_id');
delete from public.asks where organization_id = '$org_id';
delete from public.organization_memberships where organization_id = '$org_id';
delete from public.users where id in (
  '$helper_user_id', '$asker_one_user_id', '$asker_two_user_id'
);
delete from public.organizations where id = '$org_id';
SQL

wait_for_sql() {
  local description="$1"
  local query="$2"
  local attempts=0
  local result=""
  while (( attempts < 200 )); do
    result="$("${psql_base[@]}" --tuples-only --no-align --command "$query" 2>/dev/null || true)"
    if [[ "$result" == "t" ]]; then
      return 0
    fi
    attempts=$((attempts + 1))
    sleep 0.05
  done
  echo "timed out waiting for $description" >&2
  return 1
}

start_holder() {
  local key="$1"
  local fifo="$work_dir/holder-$key.fifo"
  mkfifo "$fifo"
  PGAPPNAME="bridgecircle-help-holder-$key" \
    "${psql_base[@]}" <"$fifo" >"$work_dir/holder-$key.out" 2>&1 &
  holder_pid=$!
  exec 3>"$fifo"
  printf '%s\n' "select pg_advisory_lock($key);" >&3
  wait_for_sql "exclusive Help barrier $key" \
    "select exists (select 1 from pg_locks l join pg_stat_activity a on a.pid = l.pid where l.locktype = 'advisory' and l.objid = $key and l.mode = 'ExclusiveLock' and l.granted and a.application_name = 'bridgecircle-help-holder-$key')"
}

release_holder() {
  local key="$1"
  printf '%s\n' "select pg_advisory_unlock($key);" "\\q" >&3
  exec 3>&-
  wait "$holder_pid"
}

"${psql_base[@]}" <<SQL >/dev/null
create function private.help_test_barrier()
returns trigger
language plpgsql
set search_path = ''
as \$\$
declare
  v_key text := current_setting('bridgecircle.help_test_barrier', true);
begin
  if v_key is not null and v_key <> '' then
    perform pg_advisory_xact_lock_shared(v_key::bigint);
  end if;
  return new;
end;
\$\$;

create trigger help_test_ask_barrier
  before insert on public.asks
  for each row execute function private.help_test_barrier();

insert into public.organizations (id, slug, name)
values ('$org_id', 'help-concurrency', 'Help Concurrency');
insert into public.users (id) values
  ('$helper_user_id'), ('$asker_one_user_id'), ('$asker_two_user_id');
insert into public.profiles (user_id, display_name) values
  ('$helper_user_id', 'Capacity Helper'),
  ('$asker_one_user_id', 'Parallel Asker One'),
  ('$asker_two_user_id', 'Parallel Asker Two');
insert into public.organization_memberships (
  id, user_id, organization_id, status, joined_at
) values
  ('$helper_membership_id', '$helper_user_id', '$org_id', 'active', now()),
  ('$asker_one_membership_id', '$asker_one_user_id', '$org_id', 'active', now()),
  ('$asker_two_membership_id', '$asker_two_user_id', '$org_id', 'active', now());
insert into public.organization_profiles (
  organization_membership_id, organization_id, graduation_year
) values
  ('$helper_membership_id', '$org_id', 2000),
  ('$asker_one_membership_id', '$org_id', 2001),
  ('$asker_two_membership_id', '$org_id', 2002);
insert into public.helper_preferences (
  organization_membership_id, organization_id, open_to_help, max_pending_requests
) values ('$helper_membership_id', '$org_id', true, 1);
SQL

run_create() {
  local application_name="$1"
  local user_id="$2"
  local membership_id="$3"
  local request_id="$4"
  local barrier_key="$5"
  local output="$6"
  PGAPPNAME="$application_name" "${psql_base[@]}" >"$output" 2>&1 <<SQL
begin;
set local statement_timeout = '8s';
set local role authenticated;
set local "request.jwt.claim.sub" = '$user_id';
set local "bridgecircle.help_test_barrier" = '$barrier_key';
select * from api.create_direct_ask(
  '$membership_id', '$helper_membership_id',
  'Can you help with this concurrency test?',
  'A bounded request used only by the local race harness.',
  '$request_id'
);
commit;
SQL
}

failure=0

same_key="81000000-0000-4000-8000-000000000201"
same_barrier=7123401
start_holder "$same_barrier"
pids=()
for item in $(seq 1 8); do
  run_create \
    "bridgecircle-help-idempotency-$item" \
    "$asker_one_user_id" "$asker_one_membership_id" \
    "$same_key" "$same_barrier" "$work_dir/idempotency-$item.out" &
  pids+=("$!")
done
wait_for_sql "all identical Ask calls at the insert barrier" \
  "select count(*) = 8 from pg_stat_activity where application_name like 'bridgecircle-help-idempotency-%' and wait_event_type = 'Lock'"
release_holder "$same_barrier"

same_failures=0
for pid in "${pids[@]}"; do
  if ! wait "$pid"; then
    same_failures=$((same_failures + 1))
  fi
done
same_rows="$("${psql_base[@]}" --tuples-only --no-align --command "select count(*) from public.asks where asker_membership_id = '$asker_one_membership_id' and client_request_id = '$same_key'")"
if (( same_failures != 0 )) || [[ "$same_rows" != "1" ]]; then
  echo "parallel identical Ask retries did not converge cleanly (failed callers=$same_failures rows=$same_rows)" >&2
  failure=1
else
  echo "Parallel identical Ask retries returned one durable result"
fi

"${psql_base[@]}" --command "delete from public.asks where organization_id = '$org_id'" >/dev/null

capacity_barrier=7123402
start_holder "$capacity_barrier"
run_create \
  "bridgecircle-help-capacity-one" \
  "$asker_one_user_id" "$asker_one_membership_id" \
  "81000000-0000-4000-8000-000000000211" \
  "$capacity_barrier" "$work_dir/capacity-one.out" &
capacity_one_pid=$!
run_create \
  "bridgecircle-help-capacity-two" \
  "$asker_two_user_id" "$asker_two_membership_id" \
  "81000000-0000-4000-8000-000000000212" \
  "$capacity_barrier" "$work_dir/capacity-two.out" &
capacity_two_pid=$!
wait_for_sql "both helper-capacity calls waiting on a lock" \
  "select count(*) = 2 from pg_stat_activity where application_name like 'bridgecircle-help-capacity-%' and wait_event_type = 'Lock'"
release_holder "$capacity_barrier"

capacity_failures=0
wait "$capacity_one_pid" || capacity_failures=$((capacity_failures + 1))
wait "$capacity_two_pid" || capacity_failures=$((capacity_failures + 1))
capacity_rows="$("${psql_base[@]}" --tuples-only --no-align --command "select count(*) from public.asks where organization_id = '$org_id' and recipient_membership_id = '$helper_membership_id' and status = 'waiting'")"
if (( capacity_failures != 0 )) || [[ "$capacity_rows" != "1" ]]; then
  echo "parallel helper capacity was not enforced atomically (failed callers=$capacity_failures waiting rows=$capacity_rows)" >&2
  failure=1
else
  echo "Parallel direct creates preserve the helper request limit"
fi

if (( failure != 0 )); then
  exit 1
fi

echo "Help concurrency contract passed"
