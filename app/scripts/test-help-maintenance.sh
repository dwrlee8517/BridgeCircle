#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required for the local Help maintenance contract" >&2
  exit 1
fi

database_url="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

psql "$database_url" --no-psqlrc --set ON_ERROR_STOP=1 --quiet <<'SQL' >/dev/null
begin;

update public.helper_preferences
set consecutive_timeouts = 2, open_to_help = true, paused_at = null, pause_reason = null
where organization_membership_id = '20000000-0000-4000-8000-000000000003';

insert into public.asks (
  id, organization_id, asker_membership_id, kind, status,
  recipient_membership_id, question, request_message, reach,
  anonymous_until_accepted, client_request_id, created_at, expires_at,
  accepted_at, responded_at
) values
  (
    '83000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    '20000000-0000-4000-8000-000000000005',
    'direct', 'waiting', '20000000-0000-4000-8000-000000000003',
    'Expired direct fixture', 'Local maintenance fixture.', null, false,
    '83000000-0000-4000-8000-000000000101',
    '2026-06-30T00:00:00Z', '2026-07-14T00:00:00Z', null, null
  ),
  (
    '83000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    '20000000-0000-4000-8000-000000000005',
    'direct', 'waiting', '20000000-0000-4000-8000-000000000004',
    'Reminder direct fixture', 'Local maintenance fixture.', null, false,
    '83000000-0000-4000-8000-000000000102',
    '2026-07-09T00:00:00Z', '2026-07-23T00:00:00Z', null, null
  ),
  (
    '83000000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    '20000000-0000-4000-8000-000000000002',
    'circle', 'open', null,
    'Expired circle fixture', null, 'matched', true,
    '83000000-0000-4000-8000-000000000103',
    '2026-06-30T00:00:00Z', '2026-07-14T00:00:00Z', null, null
  ),
  (
    '83000000-0000-4000-8000-000000000004',
    '11111111-1111-4111-8111-111111111111',
    '20000000-0000-4000-8000-000000000005',
    'direct', 'accepted', '20000000-0000-4000-8000-000000000004',
    'Accepted fixture', 'Local maintenance fixture.', null, false,
    '83000000-0000-4000-8000-000000000104',
    '2026-06-20T00:00:00Z', '2026-07-04T00:00:00Z',
    '2026-07-01T00:00:00Z', '2026-07-01T00:00:00Z'
  );

insert into public.ask_offers (
  id, organization_id, ask_id, helper_membership_id, status,
  offer_note, client_request_id
) values (
  '84000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '83000000-0000-4000-8000-000000000003',
  '20000000-0000-4000-8000-000000000006',
  'pending', 'Local maintenance fixture.',
  '84000000-0000-4000-8000-000000000101'
);

insert into public.conversations (
  id, kind, user_a_id, user_b_id, organization_id, ask_id
) values (
  '85000000-0000-4000-8000-000000000001',
  'ask',
  '10000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000005',
  '11111111-1111-4111-8111-111111111111',
  '83000000-0000-4000-8000-000000000004'
);

set local role service_role;
create temporary table maintenance_first as
select * from api.run_help_maintenance('2026-07-15T00:00:00Z', 100);

do $$
begin
  if not exists (
    select 1 from maintenance_first
    where reminders_sent = 1 and asks_closed = 2
      and offers_closed = 1 and helpers_paused = 1
  ) then
    raise exception 'first maintenance sweep returned unexpected counts';
  end if;
  if not exists (
    select 1 from public.asks
    where id = '83000000-0000-4000-8000-000000000001'
      and status = 'closed' and closure_reason = 'silence_timeout'
  ) then
    raise exception 'expired direct Ask did not close';
  end if;
  if not exists (
    select 1 from public.asks
    where id = '83000000-0000-4000-8000-000000000002'
      and status = 'waiting' and reminder_sent_at = '2026-07-15T00:00:00Z'
  ) then
    raise exception 'day-5 reminder did not remain nonterminal';
  end if;
  if not exists (
    select 1 from public.ask_offers
    where id = '84000000-0000-4000-8000-000000000001'
      and status = 'closed' and closure_reason = 'ask_closed'
  ) then
    raise exception 'pending offer did not close with the Ask';
  end if;
  if not exists (
    select 1 from public.helper_preferences
    where organization_membership_id = '20000000-0000-4000-8000-000000000003'
      and consecutive_timeouts = 3 and open_to_help = false
      and pause_reason = 'unresponsive'
  ) then
    raise exception 'third direct timeout did not pause the helper';
  end if;
  if not exists (
    select 1 from public.asks
    where id = '83000000-0000-4000-8000-000000000004'
      and status = 'accepted' and ended_at is null
  ) then
    raise exception 'accepted Ask must keep its slot and ignore expiry';
  end if;
end;
$$;

create temporary table maintenance_second as
select * from api.run_help_maintenance('2026-07-15T00:00:00Z', 100);

do $$
begin
  if not exists (
    select 1 from maintenance_second
    where reminders_sent = 0 and asks_closed = 0
      and offers_closed = 0 and helpers_paused = 0
  ) then
    raise exception 'maintenance replay was not idempotent';
  end if;
end;
$$;

rollback;
SQL

echo "Help maintenance is catch-up safe, idempotent, and preserves accepted Asks"
