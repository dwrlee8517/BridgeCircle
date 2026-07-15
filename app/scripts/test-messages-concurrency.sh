#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for the local Messages concurrency contract" >&2
  exit 127
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/bridgecircle-messages-concurrency.XXXXXX")"
psql_base=(psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet)

user_a="10000000-0000-4000-8000-000000000003"
user_b="10000000-0000-4000-8000-000000000005"
user_c="10000000-0000-4000-8000-000000000006"
organization_id="11111111-1111-1111-1111-111111111111"
decision_request_id="a1000000-0000-4000-8000-000000000001"
block_request_id="a1000000-0000-4000-8000-000000000002"
read_conversation_id="a1000000-0000-4000-8000-000000000003"

cleanup() {
  exec 3>&- || true
  "${psql_base[@]}" <<SQL >/dev/null 2>&1 || true
select pg_terminate_backend(a.pid)
from pg_stat_activity a
where a.pid <> pg_backend_pid()
  and a.application_name like 'bridgecircle-messages-%';

delete from private.outbox_jobs
where dedupe_key in (
  select 'connection_requested:' || r.id::text
  from public.connection_requests r
  where r.id in ('$decision_request_id', '$block_request_id')
     or r.client_request_id between
       'a1000000-0000-4000-8000-000000000101'::uuid and
       'a1000000-0000-4000-8000-000000000199'::uuid
  union all
  select 'connection_accepted:' || r.id::text
  from public.connection_requests r
  where r.id in ('$decision_request_id', '$block_request_id')
     or r.client_request_id between
       'a1000000-0000-4000-8000-000000000101'::uuid and
       'a1000000-0000-4000-8000-000000000199'::uuid
  union all
  select 'message_received:' || m.id::text
  from public.messages m
  where m.client_nonce between
    'a1000000-0000-4000-8000-000000000201'::uuid and
    'a1000000-0000-4000-8000-000000000299'::uuid
);
delete from public.conversation_reads where conversation_id = '$read_conversation_id';
delete from public.messages where conversation_id = '$read_conversation_id';
delete from public.conversations
where id = '$read_conversation_id'
   or (kind = 'direct' and user_a_id in ('$user_a', '$user_b') and user_b_id in ('$user_b', '$user_c'));
delete from public.connections
where (user_a_id = least('$user_a'::uuid, '$user_b'::uuid)
       and user_b_id = greatest('$user_a'::uuid, '$user_b'::uuid))
   or (user_a_id = least('$user_a'::uuid, '$user_c'::uuid)
       and user_b_id = greatest('$user_a'::uuid, '$user_c'::uuid))
   or (user_a_id = least('$user_b'::uuid, '$user_c'::uuid)
       and user_b_id = greatest('$user_b'::uuid, '$user_c'::uuid));
delete from public.connection_requests
where id in ('$decision_request_id', '$block_request_id')
   or client_request_id between
     'a1000000-0000-4000-8000-000000000101'::uuid and
     'a1000000-0000-4000-8000-000000000199'::uuid;
delete from public.member_blocks
where blocker_user_id in ('$user_a', '$user_b', '$user_c')
  and blocked_user_id in ('$user_a', '$user_b', '$user_c');
SQL
  find "$work_dir" -type f -delete 2>/dev/null || true
  rmdir "$work_dir" 2>/dev/null || true
}
trap cleanup EXIT
cleanup
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/bridgecircle-messages-concurrency.XXXXXX")"
trap cleanup EXIT

missing_contracts="$(${psql_base[@]} --tuples-only --no-align <<'SQL'
select string_agg(contract_name, ', ' order by contract_name)
from (
  values
    ('block result row', pg_get_function_result(to_regprocedure('api.block_member(uuid)')) = 'TABLE(result_code text)'),
    ('canonical counts', to_regprocedure('api.get_messages_counts()') is not null),
    ('Connection decision result row', pg_get_function_result(to_regprocedure('api.respond_to_connection_request(uuid,text)')) = 'TABLE(result_code text, connection_id uuid, conversation_id uuid)'),
    ('Connection request result row', pg_get_function_result(to_regprocedure('api.send_connection_request(uuid,uuid,text,uuid)')) = 'TABLE(result_code text, request_id uuid)')
) required(contract_name, present)
where not coalesce(present, false);
SQL
)"
if [[ -n "$missing_contracts" ]]; then
  echo "Messages race fixtures are ready; planned database contracts are still red: $missing_contracts" >&2
  exit 1
fi

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

start_pair_holder() {
  local name="$1"
  local first_user="$2"
  local second_user="$3"
  local fifo="$work_dir/holder-$name.fifo"
  local output="$work_dir/holder-$name.out"
  mkfifo "$fifo"
  PGAPPNAME="bridgecircle-messages-holder-$name" \
    "${psql_base[@]}" <"$fifo" >"$output" 2>&1 &
  holder_pid=$!
  exec 3>"$fifo"
  printf '%s\n' \
    "begin;" \
    "select id from public.users where id in ('$first_user', '$second_user') order by id for update;" >&3
  wait_for_sql "$name pair holder" \
    "select exists (select 1 from pg_stat_activity where application_name = 'bridgecircle-messages-holder-$name' and state = 'idle in transaction')"
}

release_pair_holder() {
  printf '%s\n' "commit;" "\\q" >&3
  exec 3>&-
  wait "$holder_pid"
}

run_request() {
  local app_name="$1" caller="$2" recipient="$3" request_key="$4" output="$5"
  PGAPPNAME="$app_name" "${psql_base[@]}" --tuples-only --no-align --field-separator='|' >"$output" 2>&1 <<SQL
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '$caller';
select result_code, request_id from api.send_connection_request(
  '$recipient', '$organization_id', 'A concurrency-safe hello.', '$request_key'
);
commit;
SQL
}

run_decision() {
  local app_name="$1" caller="$2" request_id="$3" decision="$4" output="$5"
  PGAPPNAME="$app_name" "${psql_base[@]}" --tuples-only --no-align --field-separator='|' >"$output" 2>&1 <<SQL
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '$caller';
select result_code, connection_id, conversation_id
from api.respond_to_connection_request('$request_id', '$decision');
commit;
SQL
}

run_block() {
  local app_name="$1" caller="$2" target="$3" output="$4"
  PGAPPNAME="$app_name" "${psql_base[@]}" --tuples-only --no-align >"$output" 2>&1 <<SQL
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '$caller';
select result_code from api.block_member('$target');
commit;
SQL
}

run_send() {
  local app_name="$1" caller="$2" nonce="$3" output="$4"
  PGAPPNAME="$app_name" "${psql_base[@]}" --tuples-only --no-align >"$output" 2>&1 <<SQL
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '$caller';
select result_code from api.send_message(
  '$read_conversation_id', 'A message racing a read.', '$nonce'
);
commit;
SQL
}

run_read() {
  local app_name="$1" caller="$2" message_id="$3" output="$4"
  PGAPPNAME="$app_name" "${psql_base[@]}" --tuples-only --no-align >"$output" 2>&1 <<SQL
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '$caller';
select result_code from api.mark_conversation_read('$read_conversation_id', '$message_id');
commit;
SQL
}

failure=0

start_pair_holder opposite "$user_a" "$user_b"
run_request bridgecircle-messages-opposite-a "$user_a" "$user_b" \
  a1000000-0000-4000-8000-000000000101 "$work_dir/opposite-a.out" &
first_pid=$!
run_request bridgecircle-messages-opposite-b "$user_b" "$user_a" \
  a1000000-0000-4000-8000-000000000102 "$work_dir/opposite-b.out" &
second_pid=$!
wait_for_sql "both opposite Connection requests" \
  "select count(*) = 2 from pg_stat_activity where application_name like 'bridgecircle-messages-opposite-%' and wait_event_type = 'Lock'"
release_pair_holder
wait "$first_pid" || failure=1
wait "$second_pid" || failure=1
if ! grep -q '^created|' "$work_dir"/opposite-*.out ||
   ! grep -q '^incoming_pending|' "$work_dir"/opposite-*.out; then
  echo "opposite Connection requests did not converge to created + incoming_pending" >&2
  failure=1
else
  echo "Opposite Connection requests converge without a unique error"
fi

"${psql_base[@]}" <<SQL >/dev/null
delete from private.outbox_jobs where dedupe_key in (
  select 'connection_requested:' || id::text from public.connection_requests
  where client_request_id in (
    'a1000000-0000-4000-8000-000000000101',
    'a1000000-0000-4000-8000-000000000102'
  )
);
delete from public.connection_requests where client_request_id in (
  'a1000000-0000-4000-8000-000000000101',
  'a1000000-0000-4000-8000-000000000102'
);
insert into public.connection_requests (
  id, requester_user_id, recipient_user_id, origin_organization_id,
  intro_message, client_request_id
) values (
  '$decision_request_id', '$user_a', '$user_b', '$organization_id',
  'Keep this intro exactly once.', 'a1000000-0000-4000-8000-000000000111'
);
SQL

start_pair_holder decision "$user_a" "$user_b"
run_decision bridgecircle-messages-decision-accept "$user_b" \
  "$decision_request_id" accept "$work_dir/decision-accept.out" &
first_pid=$!
run_decision bridgecircle-messages-decision-decline "$user_b" \
  "$decision_request_id" decline "$work_dir/decision-decline.out" &
second_pid=$!
wait_for_sql "both competing Connection decisions" \
  "select count(*) = 2 from pg_stat_activity where application_name like 'bridgecircle-messages-decision-%' and wait_event_type = 'Lock'"
release_pair_holder
wait "$first_pid" || failure=1
wait "$second_pid" || failure=1
terminal_count="$("${psql_base[@]}" --tuples-only --no-align --command \
  "select count(*) from public.connection_requests where id = '$decision_request_id' and status in ('accepted','declined')")"
if [[ "$terminal_count" != "1" ]] ||
   ! grep -Eq '^(accepted|declined)\|' "$work_dir"/decision-*.out ||
   ! grep -q '^already_decided|' "$work_dir"/decision-*.out; then
  echo "accept/decline race did not return one terminal result and one stable replay" >&2
  failure=1
else
  echo "Competing Connection decisions converge on one terminal state"
fi

"${psql_base[@]}" <<SQL >/dev/null
delete from public.conversation_reads where conversation_id in (
  select id from public.conversations where kind = 'direct'
    and user_a_id = least('$user_a'::uuid, '$user_b'::uuid)
    and user_b_id = greatest('$user_a'::uuid, '$user_b'::uuid)
);
delete from public.messages where conversation_id in (
  select id from public.conversations where kind = 'direct'
    and user_a_id = least('$user_a'::uuid, '$user_b'::uuid)
    and user_b_id = greatest('$user_a'::uuid, '$user_b'::uuid)
);
delete from public.conversations where kind = 'direct'
  and user_a_id = least('$user_a'::uuid, '$user_b'::uuid)
  and user_b_id = greatest('$user_a'::uuid, '$user_b'::uuid);
delete from public.connections where user_a_id = least('$user_a'::uuid, '$user_b'::uuid)
  and user_b_id = greatest('$user_a'::uuid, '$user_b'::uuid);
delete from private.outbox_jobs where dedupe_key in (
  'connection_requested:$decision_request_id',
  'connection_accepted:$decision_request_id'
);
delete from public.connection_requests where id = '$decision_request_id';
insert into public.connection_requests (
  id, requester_user_id, recipient_user_id, origin_organization_id,
  intro_message, client_request_id
) values (
  '$block_request_id', '$user_a', '$user_c', '$organization_id',
  'This request may race a block.', 'a1000000-0000-4000-8000-000000000112'
);
SQL

start_pair_holder block "$user_a" "$user_c"
run_decision bridgecircle-messages-block-accept "$user_c" \
  "$block_request_id" accept "$work_dir/block-accept.out" &
first_pid=$!
run_block bridgecircle-messages-block-command "$user_c" "$user_a" \
  "$work_dir/block-command.out" &
second_pid=$!
wait_for_sql "block and Connection accept" \
  "select count(*) = 2 from pg_stat_activity where application_name like 'bridgecircle-messages-block-%' and wait_event_type = 'Lock'"
release_pair_holder
wait "$first_pid" || failure=1
wait "$second_pid" || failure=1
blocked_without_connection="$("${psql_base[@]}" --tuples-only --no-align --command \
  "select private.is_blocked('$user_a','$user_c') and not private.is_connected('$user_a','$user_c')")"
if [[ "$blocked_without_connection" != "t" ]] ||
   ! grep -Eq '^(blocked|unchanged)$' "$work_dir/block-command.out"; then
  echo "block/accept race did not end blocked with no sendable Connection" >&2
  failure=1
else
  echo "Block and Connection accept serialize to a safely revoked pair"
fi

"${psql_base[@]}" <<SQL >/dev/null
delete from public.member_blocks where blocker_user_id = '$user_c' and blocked_user_id = '$user_a';
insert into public.connections (user_a_id, user_b_id, origin_organization_id)
values (least('$user_b'::uuid, '$user_c'::uuid), greatest('$user_b'::uuid, '$user_c'::uuid), '$organization_id');
insert into public.conversations (id, kind, user_a_id, user_b_id)
values ('$read_conversation_id', 'direct', least('$user_b'::uuid, '$user_c'::uuid), greatest('$user_b'::uuid, '$user_c'::uuid));
insert into public.messages (conversation_id, sender_user_id, kind, body, client_nonce)
values ('$read_conversation_id', '$user_c', 'user', 'Initial read target.', 'a1000000-0000-4000-8000-000000000201');
SQL
initial_message_id="$("${psql_base[@]}" --tuples-only --no-align --command \
  "select id from public.messages where conversation_id = '$read_conversation_id' order by id desc limit 1")"

start_pair_holder read "$user_b" "$user_c"
run_send bridgecircle-messages-read-send "$user_c" \
  a1000000-0000-4000-8000-000000000202 "$work_dir/read-send.out" &
first_pid=$!
run_read bridgecircle-messages-read-advance "$user_b" \
  "$initial_message_id" "$work_dir/read-advance.out" &
second_pid=$!
wait_for_sql "message send and lower read advance" \
  "select count(*) = 2 from pg_stat_activity where application_name like 'bridgecircle-messages-read-%' and wait_event_type = 'Lock'"
release_pair_holder
wait "$first_pid" || failure=1
wait "$second_pid" || failure=1
unread_count="$("${psql_base[@]}" --tuples-only --no-align <<SQL
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '$user_b';
select unread_count from api.get_messages_counts();
rollback;
SQL
)"
if [[ "$unread_count" != "1" ]]; then
  echo "send/read race did not converge on one unread conversation (got $unread_count)" >&2
  failure=1
else
  echo "Concurrent send and read preserve canonical unread-conversation counts"
fi

if (( failure != 0 )); then
  exit 1
fi

echo "Messages Connection, block, send, and read concurrency contract passed"
