#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for the local School concurrency contract" >&2
  exit 127
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
psql_base=(psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet)
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/bridgecircle-school-concurrency.XXXXXX")"
event_id="ccee0000-0000-4000-8000-000000000001"
organization_id="11111111-1111-4111-8111-111111111111"
first_user="10000000-0000-4000-8000-000000000002"
first_membership="20000000-0000-4000-8000-000000000002"
second_user="10000000-0000-4000-8000-000000000003"
second_membership="20000000-0000-4000-8000-000000000003"

cleanup() {
  "${psql_base[@]}" <<SQL >/dev/null 2>&1 || true
delete from private.outbox_jobs where payload->>'eventId' = '$event_id';
delete from public.events where id = '$event_id';
SQL
  find "$work_dir" -type f -delete 2>/dev/null || true
  rmdir "$work_dir" 2>/dev/null || true
}
trap cleanup EXIT
cleanup
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/bridgecircle-school-concurrency.XXXXXX")"
trap cleanup EXIT

"${psql_base[@]}" <<SQL
insert into public.events (
  id, organization_id, created_by_membership_id, status, slug, category,
  title, summary, description, format, time_zone, campus, location,
  location_name, host_name, starts_at, ends_at, capacity, published_at
) values (
  '$event_id', '$organization_id',
  '20000000-0000-4000-8000-000000000001', 'published',
  'school-concurrency-fixture', 'Test', 'School concurrency fixture',
  'A disposable capacity-one event.', 'A disposable capacity-one event.',
  'in_person', 'America/Los_Angeles', 'palos_verdes', 'Main Court Patio',
  'Main Court Patio', 'the Alumni Office', now() + interval '30 days',
  now() + interval '30 days 2 hours', 1, now()
);
SQL

respond() {
  local app_name="$1" user_id="$2" membership_id="$3" intent="$4" output="$5"
  PGAPPNAME="$app_name" "${psql_base[@]}" --tuples-only --no-align >"$output" 2>&1 <<SQL
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '$user_id';
select api.respond_school_event('$membership_id', '$event_id', '$intent');
commit;
SQL
}

respond bridgecircle-school-rsvp-first "$first_user" "$first_membership" going "$work_dir/first.out" &
first_pid=$!
respond bridgecircle-school-rsvp-second "$second_user" "$second_membership" going "$work_dir/second.out" &
second_pid=$!
wait "$first_pid"
wait "$second_pid"

results="$(sort "$work_dir/first.out" "$work_dir/second.out" | tr '\n' ',')"
if [[ "$results" != "going,waitlisted," ]]; then
  echo "capacity race did not converge on one going and one waitlisted response: $results" >&2
  exit 1
fi

state="$(${psql_base[@]} --tuples-only --no-align --field-separator '|' <<SQL
select count(*) filter (where status = 'going'), count(*) filter (where status = 'waitlisted')
from public.event_rsvps where event_id = '$event_id';
SQL
)"
if [[ "$state" != "1|1" ]]; then
  echo "capacity race overbooked or dropped a response: $state" >&2
  exit 1
fi

going_identity="$(${psql_base[@]} --tuples-only --no-align --field-separator '|' <<SQL
select m.user_id, r.organization_membership_id
from public.event_rsvps r
join public.organization_memberships m on m.id = r.organization_membership_id
where r.event_id = '$event_id' and r.status = 'going';
SQL
)"
waitlisted_identity="$(${psql_base[@]} --tuples-only --no-align --field-separator '|' <<SQL
select m.user_id, r.organization_membership_id
from public.event_rsvps r
join public.organization_memberships m on m.id = r.organization_membership_id
where r.event_id = '$event_id' and r.status = 'waitlisted';
SQL
)"
IFS='|' read -r going_user going_membership <<<"$going_identity"
IFS='|' read -r waiting_user waiting_membership <<<"$waitlisted_identity"

respond bridgecircle-school-release "$going_user" "$going_membership" not_going "$work_dir/release.out"
if ! grep -qx 'not_going' "$work_dir/release.out"; then
  echo "confirmed attendee could not release the slot" >&2
  exit 1
fi

offered_state="$(${psql_base[@]} --tuples-only --no-align --field-separator '|' <<SQL
select status, offer_expires_at > now(), offer_expires_at <= now() + interval '1 day'
from public.event_rsvps
where event_id = '$event_id' and organization_membership_id = '$waiting_membership';
SQL
)"
if [[ "$offered_state" != "offered|t|t" ]]; then
  echo "released capacity did not become a bounded held offer: $offered_state" >&2
  exit 1
fi

respond bridgecircle-school-accept "$waiting_user" "$waiting_membership" accept_offer "$work_dir/accept.out"
if ! grep -qx 'going' "$work_dir/accept.out"; then
  echo "offered member could not explicitly accept the held slot" >&2
  exit 1
fi

final_state="$(${psql_base[@]} --tuples-only --no-align <<SQL
select count(*) from public.event_rsvps where event_id = '$event_id' and status = 'going';
SQL
)"
if [[ "$final_state" != "1" ]]; then
  echo "held-offer acceptance violated capacity: $final_state confirmed attendees" >&2
  exit 1
fi

echo "School capacity races serialize, waitlists become held offers, and explicit acceptance never overbooks"
