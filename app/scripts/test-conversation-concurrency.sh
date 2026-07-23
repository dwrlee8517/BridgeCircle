#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for the local Conversation concurrency contract" >&2
  exit 1
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/bridgecircle-conversation-concurrency.XXXXXX")"

richard_id="10000000-0000-4000-8000-000000000002"
mark_id="10000000-0000-4000-8000-000000000003"
mei_id="10000000-0000-4000-8000-000000000004"
seed_conversation_id="50000000-0000-4000-8000-000000000001"
origin_organization_id="11111111-1111-4111-8111-111111111111"

psql_base=(psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet)

cleanup() {
  exec 3>&- 2>/dev/null || true
  exec 4>&- 2>/dev/null || true
  "${psql_base[@]}" <<'SQL' >/dev/null 2>&1 || true
select pg_terminate_backend(a.pid)
from pg_stat_activity a
where a.pid <> pg_backend_pid()
  and a.application_name like 'bridgecircle-conversation-%';
begin;
drop trigger if exists conversation_test_message_barrier on public.messages;
drop trigger if exists conversation_test_block_barrier on public.member_blocks;
drop trigger if exists conversation_test_disconnect_barrier on public.connections;
drop function if exists private.conversation_test_barrier();

delete from private.outbox_jobs
where dedupe_key in (
  select 'message_received:' || m.id::text
  from public.messages m
  where m.client_nonce between
    '91000000-0000-4000-8000-000000000001'::uuid
    and '91000000-0000-4000-8000-000000000099'::uuid
);
delete from public.conversation_reads
where conversation_id = '50000000-0000-4000-8000-000000000001'
  and user_id = '10000000-0000-4000-8000-000000000002';
delete from public.messages
where client_nonce between
  '91000000-0000-4000-8000-000000000001'::uuid
  and '91000000-0000-4000-8000-000000000099'::uuid;
delete from public.member_blocks
where blocker_user_id = '10000000-0000-4000-8000-000000000002'
  and blocked_user_id = '10000000-0000-4000-8000-000000000004';
delete from private.outbox_jobs
where dedupe_key in (
  'offer_accepted:96000000-0000-4000-8000-000000000002',
  'offer_accepted:96000000-0000-4000-8000-000000000003'
);
delete from public.messages
where system_event_key = 'ask_accepted:96000000-0000-4000-8000-000000000001';
delete from public.asks
where id = '96000000-0000-4000-8000-000000000001';
delete from public.connections
where user_a_id = '10000000-0000-4000-8000-000000000002'
  and user_b_id = '10000000-0000-4000-8000-000000000003';
insert into public.connections (
  user_a_id, user_b_id, origin_organization_id
) values (
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000004',
  '11111111-1111-4111-8111-111111111111'
)
on conflict (user_a_id, user_b_id) do update
set origin_organization_id = excluded.origin_organization_id;
commit;
SQL
  find "$work_dir" -type f -delete 2>/dev/null || true
  rmdir "$work_dir" 2>/dev/null || true
}

trap cleanup EXIT

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

wait_for_output() {
  local description="$1"
  local file="$2"
  local pattern="$3"
  local attempts=0

  while (( attempts < 200 )); do
    if grep -Eq "$pattern" "$file" 2>/dev/null; then
      return 0
    fi
    attempts=$((attempts + 1))
    sleep 0.05
  done

  echo "timed out waiting for $description" >&2
  return 1
}

start_holder() {
  local name="$1"
  local key="$2"
  local output="$work_dir/holder-$name.out"
  local fifo="$work_dir/holder-$name.fifo"
  local application_name="bridgecircle-conversation-holder-$name"

  mkfifo "$fifo"
  PGAPPNAME="$application_name" "${psql_base[@]}" <"$fifo" >"$output" 2>&1 &
  holder_pid=$!
  exec 3>"$fifo"
  printf '%s\n' "select pg_advisory_lock($key);" >&3
  wait_for_sql "$name advisory holder" \
    "select exists (select 1 from pg_locks l join pg_stat_activity a on a.pid = l.pid where l.locktype = 'advisory' and l.objid = $key and l.mode = 'ExclusiveLock' and l.granted and a.application_name = '$application_name');"
}

release_holder() {
  local key="$2"
  printf '%s\n' "select pg_advisory_unlock($key);" "\\q" >&3
  exec 3>&-
  wait "$holder_pid"
}

set_authenticated_sql() {
  local user_id="$1"
  local barrier_key="${2:-}"

  printf '%s\n' \
    "begin;" \
    "set local role authenticated;" \
    "set local \"request.jwt.claim.sub\" = '$user_id';"
  if [[ -n "$barrier_key" ]]; then
    printf '%s\n' \
      "set local \"bridgecircle.test_barrier\" = '$barrier_key';"
  fi
}

"${psql_base[@]}" <<'SQL' >/dev/null
create function private.conversation_test_barrier()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_key_text text := current_setting('bridgecircle.test_barrier', true);
begin
  if v_key_text is not null and v_key_text <> '' then
    perform pg_advisory_xact_lock_shared(v_key_text::bigint);
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger conversation_test_message_barrier
  before insert on public.messages
  for each row execute function private.conversation_test_barrier();
create trigger conversation_test_block_barrier
  before insert on public.member_blocks
  for each row execute function private.conversation_test_barrier();
create trigger conversation_test_disconnect_barrier
  before delete on public.connections
  for each row execute function private.conversation_test_barrier();

delete from public.member_blocks
where blocker_user_id = '10000000-0000-4000-8000-000000000002'
  and blocked_user_id = '10000000-0000-4000-8000-000000000004';
insert into public.connections (
  user_a_id, user_b_id, origin_organization_id
) values (
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '11111111-1111-4111-8111-111111111111'
)
on conflict (user_a_id, user_b_id) do nothing;
SQL

run_pair_lock_test() {
  local lock_fifo="$work_dir/pair-lock.fifo"

  mkfifo "$lock_fifo"
  PGAPPNAME="bridgecircle-conversation-pair-lock-first" \
    "${psql_base[@]}" <"$lock_fifo" >"$work_dir/pair-lock-first.out" 2>&1 &
  local first_pid=$!
  exec 4>"$lock_fifo"
  printf '%s\n' \
    "begin;" \
    "select private.lock_user_pair('$richard_id', '$mei_id');" \
    >&4

  wait_for_sql "first canonical pair lock" \
    "select count(*) >= 1 from pg_stat_activity where application_name = 'bridgecircle-conversation-pair-lock-first' and state = 'idle in transaction';"

  PGAPPNAME="bridgecircle-conversation-pair-lock-second" \
    "${psql_base[@]}" --command \
    "select private.lock_user_pair('$mei_id', '$richard_id');" \
    >"$work_dir/pair-lock-second.out" 2>&1 &
  local second_pid=$!

  if ! wait_for_sql "reversed caller waiting on the same canonical pair lock" \
    "select count(*) >= 1 from pg_stat_activity where application_name = 'bridgecircle-conversation-pair-lock-second' and wait_event_type = 'Lock';"; then
    printf '%s\n' "rollback;" "\\q" >&4
    exec 4>&-
    wait "$first_pid" || true
    wait "$second_pid" || true
    echo "reversed pair order did not serialize on one canonical lock" >&2
    return 1
  fi

  printf '%s\n' "commit;" "\\q" >&4
  exec 4>&-
  wait "$first_pid"
  wait "$second_pid"
  echo "Canonical pair lock serializes both caller orders"
}

run_parallel_nonce_test() {
  local barrier_key=99124001
  local nonce="91000000-0000-4000-8000-000000000001"
  local pids=()
  local failures=0

  start_holder "nonce" "$barrier_key"
  for index in $(seq 1 20); do
    {
      set_authenticated_sql "$richard_id" "$barrier_key"
      printf '%s\n' \
        "select * from api.send_message('$seed_conversation_id', 'Concurrency-safe retry', '$nonce');" \
        "reset role;" \
        "commit;"
    } | PGAPPNAME="bridgecircle-conversation-nonce-$index" \
      "${psql_base[@]}" --tuples-only --no-align --field-separator='|' \
      >"$work_dir/nonce-$index.out" 2>&1 &
    pids+=("$!")
  done

  wait_for_sql "20 nonce senders at the insert barrier" \
    "select count(*) >= 20 from pg_stat_activity where query like '%api.send_message%' and wait_event_type = 'Lock';"
  release_holder "nonce" "$barrier_key"

  for pid in "${pids[@]}"; do
    wait "$pid" || failures=$((failures + 1))
  done
  if (( failures != 0 )); then
    echo "parallel nonce retry failed: $failures of 20 callers raised instead of returning one durable result" >&2
    sed -n '1,12p' "$work_dir/nonce-1.out" >&2
    return 1
  fi

  if [[ "$(sed '/^$/d' "$work_dir"/nonce-*.out | cut -d'|' -f2 | sort -u | wc -l | tr -d ' ')" != "1" ]]; then
    echo "parallel nonce retry returned more than one message ID" >&2
    return 1
  fi
  if [[ "$(sed '/^$/d' "$work_dir"/nonce-*.out | cut -d'|' -f1 | sort | uniq -c | tr -s ' ')" != *"1 sent"* ]]; then
    echo "parallel nonce retry did not identify exactly one winning insert" >&2
    return 1
  fi

  echo "Parallel nonce retry returned one message and one durable side effect"
}

run_parallel_direct_create_test() {
  local pids=()
  local failures=0

  for index in $(seq 1 20); do
    {
      set_authenticated_sql "$richard_id"
      printf '%s\n' \
        "select * from api.get_or_create_direct_conversation('$mark_id');" \
        "reset role;" \
        "commit;"
    } | PGAPPNAME="bridgecircle-conversation-direct-$index" \
      "${psql_base[@]}" --tuples-only --no-align --field-separator='|' \
      >"$work_dir/direct-$index.out" 2>&1 &
    pids+=("$!")
  done

  for pid in "${pids[@]}"; do
    wait "$pid" || failures=$((failures + 1))
  done
  if (( failures != 0 )); then
    echo "parallel direct creation failed for $failures callers" >&2
    return 1
  fi
  if [[ "$(sed '/^$/d' "$work_dir"/direct-*.out | cut -d'|' -f2 | sort -u | wc -l | tr -d ' ')" != "1" ]]; then
    echo "parallel direct creation returned more than one conversation ID" >&2
    return 1
  fi
  if [[ "$("${psql_base[@]}" --tuples-only --no-align --command \
    "select count(*) from public.conversations where user_a_id = '$richard_id' and user_b_id = '$mark_id';")" != "1" ]]; then
    echo "parallel direct creation persisted more than one conversation" >&2
    return 1
  fi

  echo "Parallel direct creation returned one conversation"
}

run_block_before_send_test() {
  local barrier_key=99124002
  local nonce="91000000-0000-4000-8000-000000000002"

  start_holder "block" "$barrier_key"
  {
    set_authenticated_sql "$richard_id" "$barrier_key"
    printf '%s\n' \
      "select api.block_member('$mei_id');" \
      "reset role;" \
      "commit;"
  } | PGAPPNAME="bridgecircle-conversation-block" \
    "${psql_base[@]}" >"$work_dir/block.out" 2>&1 &
  local block_pid=$!

  wait_for_sql "block transaction at its mutation barrier" \
    "select count(*) >= 1 from pg_stat_activity where query like '%api.block_member%' and wait_event_type = 'Lock';"

  {
    set_authenticated_sql "$mei_id"
    printf '%s\n' \
      "select * from api.send_message('$seed_conversation_id', 'Must wait for block', '$nonce');" \
      "reset role;" \
      "commit;"
  } | PGAPPNAME="bridgecircle-conversation-block-send" \
    "${psql_base[@]}" --tuples-only --no-align --field-separator='|' \
    >"$work_dir/block-send.out" 2>&1 &
  local send_pid=$!

  if ! wait_for_sql "send waiting behind the pair lock held by block" \
    "select count(*) >= 1 from pg_stat_activity where query like '%Must wait for block%' and wait_event_type = 'Lock';"; then
    release_holder "block" "$barrier_key"
    wait "$block_pid" || true
    wait "$send_pid" || true
    echo "send did not wait for the in-flight block transaction" >&2
    return 1
  fi

  release_holder "block" "$barrier_key"
  wait "$block_pid"
  wait "$send_pid"
  if [[ "$(sed '/^$/d' "$work_dir/block-send.out" | cut -d'|' -f1)" != "not_available" ]]; then
    echo "send did not collapse the completed block to not_available" >&2
    return 1
  fi

  "${psql_base[@]}" --command \
    "delete from public.member_blocks where blocker_user_id = '$richard_id' and blocked_user_id = '$mei_id';" >/dev/null
  "${psql_base[@]}" --command \
    "insert into public.connections (user_a_id, user_b_id, origin_organization_id) values ('$richard_id', '$mei_id', '$origin_organization_id') on conflict (user_a_id, user_b_id) do nothing;" >/dev/null
  echo "Block and send share one deterministic pair-lock order"
}

run_disconnect_before_send_test() {
  local barrier_key=99124003
  local nonce="91000000-0000-4000-8000-000000000003"

  start_holder "disconnect" "$barrier_key"
  {
    set_authenticated_sql "$richard_id" "$barrier_key"
    printf '%s\n' \
      "select api.disconnect('$mei_id');" \
      "reset role;" \
      "commit;"
  } | PGAPPNAME="bridgecircle-conversation-disconnect" \
    "${psql_base[@]}" >"$work_dir/disconnect.out" 2>&1 &
  local disconnect_pid=$!

  wait_for_sql "disconnect transaction at its mutation barrier" \
    "select count(*) >= 1 from pg_stat_activity where query like '%api.disconnect%' and wait_event_type = 'Lock';"

  {
    set_authenticated_sql "$mei_id"
    printf '%s\n' \
      "select * from api.send_message('$seed_conversation_id', 'Must wait for disconnect', '$nonce');" \
      "reset role;" \
      "commit;"
  } | PGAPPNAME="bridgecircle-conversation-disconnect-send" \
    "${psql_base[@]}" --tuples-only --no-align --field-separator='|' \
    >"$work_dir/disconnect-send.out" 2>&1 &
  local send_pid=$!

  if ! wait_for_sql "send waiting behind the pair lock held by disconnect" \
    "select count(*) >= 1 from pg_stat_activity where query like '%Must wait for disconnect%' and wait_event_type = 'Lock';"; then
    release_holder "disconnect" "$barrier_key"
    wait "$disconnect_pid" || true
    wait "$send_pid" || true
    echo "send did not wait for the in-flight disconnect transaction" >&2
    return 1
  fi

  release_holder "disconnect" "$barrier_key"
  wait "$disconnect_pid"
  wait "$send_pid"
  if [[ "$(sed '/^$/d' "$work_dir/disconnect-send.out" | cut -d'|' -f1)" != "connection_required" ]]; then
    echo "send did not return connection_required after disconnect" >&2
    return 1
  fi

  "${psql_base[@]}" --command \
    "insert into public.connections (user_a_id, user_b_id, origin_organization_id) values ('$richard_id', '$mei_id', '$origin_organization_id') on conflict (user_a_id, user_b_id) do nothing;" >/dev/null
  echo "Disconnect and send share one deterministic pair-lock order"
}

run_competing_offer_accept_test() {
  local barrier_key=99124005
  local pids=()
  local successes=0
  local failures=0
  local result_codes=""

  "${psql_base[@]}" <<'SQL' >/dev/null
insert into public.asks (
  id, organization_id, asker_membership_id, kind, status,
  question, reach, anonymous_until_accepted, client_request_id
) values (
  '96000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000002',
  'circle', 'open', 'Which competing offer wins?', 'matched', false,
  '96000000-0000-4000-8000-000000000010'
);
insert into public.ask_offers (
  id, organization_id, ask_id, helper_membership_id,
  offer_note, client_request_id
) values
  (
    '96000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    '96000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000003',
    'Competing offer one.',
    '96000000-0000-4000-8000-000000000011'
  ),
  (
    '96000000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    '96000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000006',
    'Competing offer two.',
    '96000000-0000-4000-8000-000000000012'
  );
SQL

  start_holder "offer-start" "$barrier_key"
  for index in 2 3; do
    {
      set_authenticated_sql "$richard_id"
      printf '%s\n' \
        "set local statement_timeout = '10s';" \
        "select pg_advisory_xact_lock_shared($barrier_key);" \
        "select result_code, ask_id, offer_id, conversation_id from api.decide_offer('96000000-0000-4000-8000-00000000000$index', 'accept', 'Winning opening $index', null, null, '96000000-0000-4000-8000-00000000002$index');" \
        "reset role;" \
        "commit;"
    } | PGAPPNAME="bridgecircle-conversation-offer-$index" \
      "${psql_base[@]}" --tuples-only --no-align \
      >"$work_dir/offer-$index.out" 2>&1 &
    pids+=("$!")
  done

  wait_for_sql "both offer callers at the explicit start barrier" \
    "select count(*) >= 2 from pg_stat_activity where application_name like 'bridgecircle-conversation-offer-%' and wait_event_type = 'Lock';"
  release_holder "offer-start" "$barrier_key"

  for pid in "${pids[@]}"; do
    if wait "$pid"; then
      successes=$((successes + 1))
    else
      failures=$((failures + 1))
    fi
  done
  if (( successes != 2 || failures != 0 )); then
    echo "competing offer acceptance callers did not both receive stable result rows" >&2
    return 1
  fi

  result_codes="$(sed '/^$/d' "$work_dir/offer-2.out" "$work_dir/offer-3.out" | cut -d'|' -f1 | sort | tr '\n' ' ')"
  if [[ "$result_codes" != "accepted already_decided " ]]; then
    echo "competing offer acceptance expected accepted + already_decided, got: $result_codes" >&2
    return 1
  fi

  if [[ "$("${psql_base[@]}" --tuples-only --no-align --command \
    "select (select count(*) from public.ask_offers where ask_id = '96000000-0000-4000-8000-000000000001' and status = 'accepted') = 1 and (select count(*) from public.ask_offers where ask_id = '96000000-0000-4000-8000-000000000001' and status = 'closed') = 1 and (select count(*) from public.asks where id = '96000000-0000-4000-8000-000000000001' and conversation_id is not null) = 1 and (select count(*) from public.messages m join public.asks a on a.conversation_id = m.conversation_id where a.id = '96000000-0000-4000-8000-000000000001' and m.system_event_key = 'ask_accepted:96000000-0000-4000-8000-000000000001') = 1;")" != "t" ]]; then
    echo "competing offer acceptance did not preserve one accepted aggregate" >&2
    return 1
  fi

  echo "Competing offer accepts produce one winner without deadlock"
}

run_read_cursor_test() {
  local low_nonce="91000000-0000-4000-8000-000000000010"
  local high_nonce="91000000-0000-4000-8000-000000000011"
  local high_fifo="$work_dir/read-high.fifo"
  local high_timestamp=""
  local low_id=""
  local high_id=""

  "${psql_base[@]}" --command \
    "insert into public.messages (conversation_id, sender_user_id, kind, body, client_nonce) values ('$seed_conversation_id', '$mei_id', 'user', 'Read cursor low', '$low_nonce'), ('$seed_conversation_id', '$mei_id', 'user', 'Read cursor high', '$high_nonce');" >/dev/null
  low_id="$("${psql_base[@]}" --tuples-only --no-align --command \
    "select id from public.messages where client_nonce = '$low_nonce';")"
  high_id="$("${psql_base[@]}" --tuples-only --no-align --command \
    "select id from public.messages where client_nonce = '$high_nonce';")"

  mkfifo "$high_fifo"
  PGAPPNAME="bridgecircle-conversation-read-high" \
    "${psql_base[@]}" --tuples-only --no-align --field-separator='|' \
    <"$high_fifo" >"$work_dir/read-high.out" 2>&1 &
  local high_pid=$!
  exec 4>"$high_fifo"
  set_authenticated_sql "$richard_id" >&4
  printf '%s\n' \
    "select * from api.mark_conversation_read('$seed_conversation_id', $high_id);" \
    >&4

  wait_for_sql "high read cursor transaction" \
    "select count(*) >= 1 from pg_stat_activity where application_name = 'bridgecircle-conversation-read-high' and state = 'idle in transaction';"
  if ! wait_for_output \
    "high read cursor result" \
    "$work_dir/read-high.out" \
    '^advanced\|[0-9]+\|'; then
    printf '%s\n' "rollback;" "\\q" >&4
    exec 4>&-
    wait "$high_pid" || true
    return 1
  fi
  high_timestamp="$(grep -E '^advanced\|[0-9]+\|' "$work_dir/read-high.out" | tail -1 | cut -d'|' -f3 || true)"
  if [[ -z "$high_timestamp" ]]; then
    printf '%s\n' "rollback;" "\\q" >&4
    exec 4>&-
    wait "$high_pid" || true
    echo "high read cursor did not return its durable timestamp" >&2
    return 1
  fi

  {
    set_authenticated_sql "$richard_id"
    printf '%s\n' \
      "select * from api.mark_conversation_read('$seed_conversation_id', $low_id);" \
      "reset role;" \
      "commit;"
  } | PGAPPNAME="bridgecircle-conversation-read-low" \
    "${psql_base[@]}" --tuples-only --no-align --field-separator='|' \
    >"$work_dir/read-low.out" 2>&1 &
  local low_pid=$!

  if ! wait_for_sql "low cursor waiting on the high cursor transaction" \
    "select count(*) >= 1 from pg_stat_activity where application_name = 'bridgecircle-conversation-read-low' and wait_event_type = 'Lock';"; then
    printf '%s\n' "rollback;" "\\q" >&4
    exec 4>&-
    wait "$high_pid" || true
    wait "$low_pid" || true
    echo "lower read cursor did not serialize behind the higher cursor" >&2
    return 1
  fi

  printf '%s\n' "reset role;" "commit;" "\\q" >&4
  exec 4>&-
  wait "$high_pid"
  wait "$low_pid"

  if [[ "$(grep -E '^(advanced|unchanged)\|[0-9]+\|' "$work_dir/read-low.out" | head -1 | cut -d'|' -f1 || true)" != "unchanged" ]]; then
    echo "lower read cursor did not return unchanged" >&2
    return 1
  fi
  if [[ "$("${psql_base[@]}" --tuples-only --no-align --command \
    "select cr.last_read_message_id = m.id and cr.last_read_at = '$high_timestamp'::timestamptz from public.conversation_reads cr join public.messages m on m.client_nonce = '$high_nonce' where cr.conversation_id = '$seed_conversation_id' and cr.user_id = '$richard_id';")" != "t" ]]; then
    echo "lower read cursor rewrote the high cursor or its timestamp" >&2
    return 1
  fi

  echo "Concurrent read cursors remain monotonic and write-free on a lower retry"
}

run_pair_lock_test
run_parallel_nonce_test
run_parallel_direct_create_test
run_block_before_send_test
run_disconnect_before_send_test
run_competing_offer_accept_test
run_read_cursor_test

echo "Conversation concurrency contract passed"
