#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for the local School maintenance contract" >&2
  exit 127
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
psql_base=(psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet)
event_id="ccee0000-0000-4000-8000-000000000002"
organization_id="11111111-1111-4111-8111-111111111111"

cleanup() {
  "${psql_base[@]}" <<SQL >/dev/null 2>&1 || true
delete from private.outbox_jobs where payload->>'eventId' = '$event_id';
delete from public.events where id = '$event_id';
SQL
}
trap cleanup EXIT
cleanup

"${psql_base[@]}" <<SQL
insert into public.events (
  id, organization_id, created_by_membership_id, status, slug, category,
  title, summary, description, format, time_zone, campus, location,
  location_name, host_name, starts_at, ends_at, capacity, published_at
) values (
  '$event_id', '$organization_id',
  '20000000-0000-4000-8000-000000000001', 'published',
  'school-maintenance-fixture', 'Test', 'School maintenance fixture',
  'A disposable offer-expiry event.', 'A disposable offer-expiry event.',
  'in_person', 'America/Los_Angeles', 'palos_verdes', 'Main Court Patio',
  'Main Court Patio', 'the Alumni Office', now() + interval '30 days',
  now() + interval '30 days 2 hours', 1, now()
);
insert into public.event_rsvps (
  organization_id, event_id, organization_membership_id, status,
  responded_at, offered_at, offer_expires_at
) values
  ('$organization_id', '$event_id', '20000000-0000-4000-8000-000000000002',
   'offered', now() - interval '2 days', now() - interval '2 days', now() - interval '1 day'),
  ('$organization_id', '$event_id', '20000000-0000-4000-8000-000000000003',
   'waitlisted', now() - interval '1 day', null, null);
SQL

maintenance="$(${psql_base[@]} --tuples-only --no-align --field-separator '|' <<'SQL'
begin;
set local role service_role;
select expired_offers, opened_offers from api.run_school_maintenance(now(), 100);
commit;
SQL
)"
if [[ "$maintenance" != "1|1" ]]; then
  echo "School maintenance did not expire and advance exactly one offer: $maintenance" >&2
  exit 1
fi

state="$(${psql_base[@]} --tuples-only --no-align --field-separator '|' <<SQL
select
  (select status from public.event_rsvps where event_id = '$event_id'
    and organization_membership_id = '20000000-0000-4000-8000-000000000002'),
  (select status from public.event_rsvps where event_id = '$event_id'
    and organization_membership_id = '20000000-0000-4000-8000-000000000003'),
  (select count(*) from private.outbox_jobs where payload->>'eventId' = '$event_id'
    and payload->>'type' = 'event_waitlist_spot_opened');
SQL
)"
if [[ "$state" != "not_going|offered|1" ]]; then
  echo "School maintenance left an invalid offer chain: $state" >&2
  exit 1
fi

echo "School maintenance expires held offers, advances one waiter, and queues one durable notice"
