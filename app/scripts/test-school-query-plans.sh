#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for local School query-plan checks" >&2
  exit 127
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
psql_base=(psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet)
required=(
  "api.get_school_home(uuid)"
  "api.get_school_event(uuid,uuid)"
  "api.list_school_event_attendees(uuid,uuid,integer)"
  "api.list_school_announcements(uuid,text,integer)"
  "api.list_newsletter_issues(uuid,integer)"
)
missing=()
for signature in "${required[@]}"; do
  if [[ "$("${psql_base[@]}" --tuples-only --no-align --command "select to_regprocedure('$signature') is not null")" != "t" ]]; then
    missing+=("$signature")
  fi
done
if (( ${#missing[@]} > 0 )); then
  printf 'School query-plan target is missing: %s\n' "${missing[@]}" >&2
  exit 1
fi

plan_output="$("${psql_base[@]}" <<'SQL'
begin;

insert into public.events (
  id, organization_id, created_by_membership_id, status, slug, category,
  title, summary, description, format, time_zone, campus, location,
  location_name, host_name, starts_at, ends_at, capacity, published_at
)
select
  md5('school-plan-event-' || fixture)::uuid,
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000001',
  'published', 'school-plan-' || fixture, 'Plan',
  'School plan event ' || fixture, 'Representative School event',
  'Representative School event', 'in_person', 'America/Los_Angeles',
  'palos_verdes', 'Main Court Patio', 'Main Court Patio', 'the Alumni Office',
  now() + fixture * interval '1 hour', now() + fixture * interval '1 hour' + interval '2 hours',
  50, now()
from generate_series(1, 1200) fixture;

insert into public.event_rsvps (
  organization_id, event_id, organization_membership_id, status,
  responded_at, offered_at, offer_expires_at
)
select
  '11111111-1111-4111-8111-111111111111',
  md5('school-plan-event-' || fixture)::uuid,
  '20000000-0000-4000-8000-000000000002',
  'offered', now() - interval '2 hours', now() - interval '2 hours',
  now() - interval '1 hour'
from generate_series(1, 1200) fixture;

insert into public.announcements (
  id, organization_id, author_membership_id, status, tag, title,
  summary, body, pinned, published_at
)
select
  md5('school-plan-announcement-' || fixture)::uuid,
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000001',
  'published', case when fixture % 2 = 0 then 'general' else 'mentorship' end,
  'School plan announcement ' || fixture, 'Representative announcement',
  'Representative announcement body', fixture % 50 = 0,
  now() - fixture * interval '1 minute'
from generate_series(1, 1200) fixture;

insert into public.newsletter_issues (
  id, organization_id, slug, issue_number, status, title, summary, published_at
)
select
  md5('school-plan-newsletter-' || fixture)::uuid,
  '11111111-1111-4111-8111-111111111111',
  'school-plan-issue-' || fixture, 1000 + fixture, 'published',
  'School plan issue ' || fixture, 'Representative newsletter issue',
  now() - fixture * interval '1 day'
from generate_series(1, 500) fixture;

analyze public.events;
analyze public.event_rsvps;
analyze public.announcements;
analyze public.newsletter_issues;

set local enable_seqscan = off;
explain (analyze, buffers, costs off)
select e.id from public.events e
where e.organization_id = '11111111-1111-4111-8111-111111111111'
  and e.status in ('published', 'cancelled')
order by e.starts_at, e.id limit 50;

explain (analyze, buffers, costs off)
select r.event_id, r.organization_membership_id
from public.event_rsvps r
where r.status = 'offered' and r.offer_expires_at <= now()
order by r.offer_expires_at, r.event_id, r.organization_membership_id
limit 100;

explain (analyze, buffers, costs off)
select a.id from public.announcements a
where a.organization_id = '11111111-1111-4111-8111-111111111111'
  and a.status = 'published'
order by a.pinned desc, a.published_at desc, a.id desc limit 50;

explain (analyze, buffers, costs off)
select n.id from public.newsletter_issues n
where n.organization_id = '11111111-1111-4111-8111-111111111111'
  and n.status in ('published', 'archived')
order by n.published_at desc, n.id desc limit 50;
reset enable_seqscan;

set local role authenticated;
set local "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000002';
select case
  when jsonb_array_length(api.get_school_home('20000000-0000-4000-8000-000000000002')->'events') = 1203
    then 'bounded-school-home-ok'
  else 'bounded-school-home-failed'
end;
reset role;

rollback;
SQL
)"

required_indexes=(
  events_school_hub_idx
  event_rsvps_open_offer_idx
  announcements_org_feed_idx
  newsletter_issues_archive_idx
)
for index_name in "${required_indexes[@]}"; do
  if [[ "$plan_output" != *"$index_name"* ]]; then
    echo "representative School plan did not use expected index: $index_name" >&2
    echo "$plan_output" >&2
    exit 1
  fi
done
if [[ "$plan_output" != *"bounded-school-home-ok"* ]]; then
  echo "School home projection did not return the complete upcoming product snapshot" >&2
  echo "$plan_output" >&2
  exit 1
fi

echo "School event, offer, announcement, and newsletter plans use their intended indexes"
