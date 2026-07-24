begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(11);

-- Contract surface -----------------------------------------------------------

select extensions.has_function(
  'api', 'admin_overview', array['uuid'],
  'the overview is read through the fixed api projection'
);

-- Fixtures (rolled back with the transaction) --------------------------------

-- A pending invite that has sat for 20 days.
insert into public.invites (organization_id, email, email_normalized, token_hash, status, expires_at, created_at)
values (
  '11111111-1111-4111-8111-111111111111',
  'overview-stale@example.com', 'overview-stale@example.com',
  convert_to(gen_random_uuid()::text, 'UTF8'),
  'pending', now() + interval '10 days', now() - interval '20 days'
);

-- A direct ask that has waited 5 days with no reply. Content stays private —
-- the overview must only ever count it.
insert into public.asks (
  organization_id, asker_membership_id, kind, status, recipient_membership_id,
  question, request_message, client_request_id, created_at, expires_at
) values (
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000005',
  'direct', 'waiting',
  '20000000-0000-4000-8000-000000000003',
  'Overview fixture: still waiting', 'Overview fixture request',
  gen_random_uuid(), now() - interval '5 days', now() + interval '9 days'
);

-- A circle ask with a pending offer: no responded_at yet, but the asker has
-- heard back — the pulse must count it.
insert into public.asks (
  id, organization_id, asker_membership_id, kind, status, question, reach,
  client_request_id, created_at, expires_at
) values (
  'aa000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000005',
  'circle', 'open', 'Overview fixture circle ask', 'organization',
  gen_random_uuid(), now() - interval '2 days', now() + interval '12 days'
);
insert into public.ask_offers (
  organization_id, ask_id, helper_membership_id, status, offer_note, client_request_id
) values (
  '11111111-1111-4111-8111-111111111111',
  'aa000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  'pending', 'Overview fixture offer', gen_random_uuid()
);

-- An open report.
insert into private.reports (
  organization_id, reason, target_type, target_id, profile_user_id, evidence_snapshot, status
) values (
  '11111111-1111-4111-8111-111111111111',
  'spam', 'profile', '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000003', '{}'::jsonb, 'open'
);

-- The next upcoming event, starting almost immediately so it sorts first.
insert into public.events (
  id, organization_id, status, title, slug, category, format, time_zone, campus,
  location_name, host_name, starts_at, published_at
) values (
  'ee000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'published', 'Overview fixture mixer', 'overview-fixture-mixer', 'Social',
  'in_person', 'America/Los_Angeles', 'other',
  'Fixture Hall', 'the Alumni Office', now() + interval '5 minutes', now()
);
insert into public.event_rsvps (organization_id, event_id, organization_membership_id, status)
values (
  '11111111-1111-4111-8111-111111111111',
  'ee000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002', 'going'
);

-- An ordinary member is denied -----------------------------------------------

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select extensions.is(
  api.admin_overview('20000000-0000-4000-8000-000000000002')->>'resultCode',
  'not_available',
  'an ordinary member cannot read the overview'
);

-- The super_admin reads the overview -----------------------------------------

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
set local role authenticated;

select extensions.is(
  api.admin_overview('20000000-0000-4000-8000-000000000001')->>'resultCode',
  'ok',
  'the super_admin reads the overview'
);

select extensions.ok(
  (
    select (result->'attention'->'staleInvites'->>'count')::int >= 1
      and result->'attention'->'staleInvites'->>'oldestAt' is not null
    from api.admin_overview('20000000-0000-4000-8000-000000000001') as result
  ),
  'a 20-day-old pending invite surfaces as stale'
);

select extensions.ok(
  (
    select (result->'attention'->'quietAsks'->>'count')::int >= 1
    from api.admin_overview('20000000-0000-4000-8000-000000000001') as result
  ),
  'an ask waiting past three days is counted'
);

select extensions.ok(
  (
    select result->'attention'->'quietAsks' ?| array['question', 'requestMessage', 'items']
      is distinct from true
    from api.admin_overview('20000000-0000-4000-8000-000000000001') as result
  ),
  'the quiet-asks signal carries no ask content'
);

select extensions.ok(
  (
    select (result->'attention'->'reports'->>'count')::int >= 1
    from api.admin_overview('20000000-0000-4000-8000-000000000001') as result
  ),
  'an open report is counted'
);

select extensions.ok(
  (
    select result->'pulse'->'nextEvent'->>'title' = 'Overview fixture mixer'
      and (result->'pulse'->'nextEvent'->>'goingCount')::int = 1
    from api.admin_overview('20000000-0000-4000-8000-000000000001') as result
  ),
  'the next upcoming event appears with its going count'
);

select extensions.ok(
  (
    select (result->'pulse'->>'activeMembers')::int >= 1
      and (result->'pulse'->>'openToHelp')::int >= 1
      and (result->'pulse'->>'asksLast30')::int >= 1
    from api.admin_overview('20000000-0000-4000-8000-000000000001') as result
  ),
  'the pulse counts active members, helpers, and recent asks'
);

select extensions.ok(
  (
    select (result->'pulse'->>'heardBackLast30')::int >= 1
    from api.admin_overview('20000000-0000-4000-8000-000000000001') as result
  ),
  'a circle ask with a pending offer counts as heard back'
);

select extensions.ok(
  (
    select (result->'attention'->'quietNewMembers'->>'count')::int >= 0
    from api.admin_overview('20000000-0000-4000-8000-000000000001') as result
  ),
  'the quiet-new-members signal is always a count'
);

select * from extensions.finish();
rollback;
