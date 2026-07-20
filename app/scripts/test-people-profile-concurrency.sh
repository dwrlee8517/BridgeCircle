#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for the local People/Profile concurrency contract" >&2
  exit 127
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/bridgecircle-people-profile-concurrency.XXXXXX")"
psql_base=(psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet)
user_id="10000000-0000-4000-8000-000000000002"
membership_id="20000000-0000-4000-8000-000000000002"
organization_id="11111111-1111-4111-8111-111111111111"

cleanup() {
  exec 3>&- || true
  "${psql_base[@]}" <<SQL >/dev/null 2>&1 || true
select pg_terminate_backend(activity.pid)
from pg_stat_activity activity
where activity.pid <> pg_backend_pid()
  and activity.application_name like 'bridgecircle-people-profile-%';

delete from public.profile_contact_links
where organization_membership_id = '$membership_id';
insert into public.profile_contact_links (
  id, organization_membership_id, organization_id,
  kind, value, audience, sort_order
) values (
  '70000000-0000-4000-8000-000000000001',
  '$membership_id', '$organization_id',
  'linkedin', 'https://www.linkedin.com/in/richard-lee', 'self', 0
);
delete from public.profile_field_visibility
where organization_membership_id = '$membership_id';
delete from private.outbox_jobs
where job_type = 'index_profile'
  and payload ->> 'membershipId' = '$membership_id';
delete from private.profile_embedding_status
where organization_membership_id = '$membership_id';
delete from private.audit_log
where actor_user_id = '$user_id'
  and action in ('profile.links_saved', 'profile.visibility_saved');
SQL
  find "$work_dir" -type f -delete 2>/dev/null || true
  rmdir "$work_dir" 2>/dev/null || true
}
trap cleanup EXIT
cleanup
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/bridgecircle-people-profile-concurrency.XXXXXX")"
trap cleanup EXIT

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

start_membership_holder() {
  local fifo="$work_dir/holder.fifo"
  local output="$work_dir/holder.out"
  mkfifo "$fifo"
  PGAPPNAME="bridgecircle-people-profile-holder" \
    "${psql_base[@]}" <"$fifo" >"$output" 2>&1 &
  holder_pid=$!
  exec 3>"$fifo"
  printf '%s\n' \
    "begin;" \
    "select id from public.organization_memberships where id = '$membership_id' for update;" >&3
  wait_for_sql "membership holder" \
    "select exists (select 1 from pg_stat_activity where application_name = 'bridgecircle-people-profile-holder' and state = 'idle in transaction')"
}

release_membership_holder() {
  printf '%s\n' "commit;" "\\q" >&3
  exec 3>&-
  wait "$holder_pid"
  rm -f "$work_dir/holder.fifo"
}

run_links() {
  local app_name="$1" payload="$2" output="$3"
  PGAPPNAME="$app_name" "${psql_base[@]}" --tuples-only --no-align >"$output" 2>&1 <<SQL
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '$user_id';
select api.save_profile_links('$membership_id', '$payload'::jsonb);
commit;
SQL
}

run_visibility() {
  local app_name="$1" payload="$2" output="$3"
  PGAPPNAME="$app_name" "${psql_base[@]}" --tuples-only --no-align >"$output" 2>&1 <<SQL
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '$user_id';
select api.save_profile_visibility('$membership_id', '$payload'::jsonb);
commit;
SQL
}

links_a='[{"kind":"website","label":null,"value":"https://a.example.com/one","audience":"organization"},{"kind":"website","label":null,"value":"https://a.example.com/two","audience":"self"}]'
links_b='[{"kind":"portfolio","label":null,"value":"https://b.example.com/one","audience":"connections"},{"kind":"social","label":null,"value":"https://b.example.com/two","audience":"organization"}]'

start_membership_holder
run_links bridgecircle-people-profile-links-a "$links_a" "$work_dir/links-a.out" &
first_pid=$!
run_links bridgecircle-people-profile-links-b "$links_b" "$work_dir/links-b.out" &
second_pid=$!
wait_for_sql "both profile-link replacements" \
  "select count(*) = 2 from pg_stat_activity where application_name like 'bridgecircle-people-profile-links-%' and wait_event_type = 'Lock'"
release_membership_holder
wait "$first_pid"
wait "$second_pid"

if ! grep -q '^saved$' "$work_dir/links-a.out" || ! grep -q '^saved$' "$work_dir/links-b.out"; then
  echo "concurrent profile-link replacements did not both return saved" >&2
  exit 1
fi

links_result="$(${psql_base[@]} --tuples-only --no-align <<SQL
select string_agg(value, ',' order by sort_order)
from public.profile_contact_links
where organization_membership_id = '$membership_id';
SQL
)"
if [[ "$links_result" != "https://a.example.com/one,https://a.example.com/two" &&
      "$links_result" != "https://b.example.com/one,https://b.example.com/two" ]]; then
  echo "concurrent profile-link replacement left a partial or mixed child set: $links_result" >&2
  exit 1
fi

run_links bridgecircle-people-profile-links-retry "$links_a" "$work_dir/links-retry.out"
if ! grep -q '^saved$' "$work_dir/links-retry.out"; then
  echo "profile-link retry did not return saved" >&2
  exit 1
fi
if [[ "$(${psql_base[@]} --tuples-only --no-align --command "select count(*) from public.profile_contact_links where organization_membership_id = '$membership_id'")" != "2" ]]; then
  echo "profile-link retry duplicated or dropped children" >&2
  exit 1
fi

visibility_a='{"bio":"connections","career_history":"self"}'
visibility_b='{"education_history":"connections","skills":"self"}'
start_membership_holder
run_visibility bridgecircle-people-profile-visibility-a "$visibility_a" "$work_dir/visibility-a.out" &
first_pid=$!
run_visibility bridgecircle-people-profile-visibility-b "$visibility_b" "$work_dir/visibility-b.out" &
second_pid=$!
wait_for_sql "both profile-visibility replacements" \
  "select count(*) = 2 from pg_stat_activity where application_name like 'bridgecircle-people-profile-visibility-%' and wait_event_type = 'Lock'"
release_membership_holder
wait "$first_pid"
wait "$second_pid"

if ! grep -q '^saved$' "$work_dir/visibility-a.out" || ! grep -q '^saved$' "$work_dir/visibility-b.out"; then
  echo "concurrent profile-visibility replacements did not both return saved" >&2
  exit 1
fi

visibility_result="$(${psql_base[@]} --tuples-only --no-align <<SQL
select string_agg(field_key || ':' || audience, ',' order by field_key)
from public.profile_field_visibility
where organization_membership_id = '$membership_id';
SQL
)"
if [[ "$visibility_result" != "bio:connections,career_history:self" &&
      "$visibility_result" != "education_history:connections,skills:self" ]]; then
  echo "concurrent visibility replacement left a partial or mixed set: $visibility_result" >&2
  exit 1
fi

pending_jobs="$(${psql_base[@]} --tuples-only --no-align <<SQL
select count(*)
from private.outbox_jobs
where job_type = 'index_profile'
  and status = 'pending'
  and payload ->> 'membershipId' = '$membership_id';
SQL
)"
if [[ "$pending_jobs" != "1" ]]; then
  echo "profile races should converge on one pending index job; found $pending_jobs" >&2
  exit 1
fi

echo "People/Profile replacements serialize to whole child sets, retries stay idempotent, and indexing dedupes"
