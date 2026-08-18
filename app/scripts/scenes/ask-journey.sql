-- Scene: ask-journey (namespace 99999999-7703)
--
-- Jamie's own asks in three states — the ask-for-help storyline: one waiting
-- (just sent), one accepted (with its room and an opening exchange), and one
-- declined with a warm note, so the Help history page shows the whole arc.
--
-- Counterparts are queried from disjoint row-number windows (11 / 16 / 21) so
-- composed scenes never grab the same member. Recipients of the waiting and
-- declined asks are open helpers — the shape the product's routing produces.

begin;

delete from public.asks where id::text like '99999999-7703-%';
delete from public.conversations where id::text like '99999999-7703-%';

-- Window 11 (headline + no room with Jamie): the accepted ask's counterpart.
create temporary table journey_accepted on commit drop as
select membership_id, user_id
from (
  select m.id as membership_id, m.user_id, row_number() over (order by m.id) as rn
  from public.organization_memberships m
  join public.profiles p on p.user_id = m.user_id
  where m.organization_id = :'org_id'
    and m.status = 'active'
    and m.id::text like 'dddddddd-1111-%'
    and p.headline is not null
    and not exists (
      select 1 from public.conversations c
      where c.user_a_id = least(m.user_id, :'jamie_user'::uuid)
        and c.user_b_id = greatest(m.user_id, :'jamie_user'::uuid))
) ranked
where rn = 11;

-- Windows 16 and 21 (open helpers): the waiting and declined recipients.
create temporary table journey_helper on commit drop as
select membership_id, rn
from (
  select m.id as membership_id, row_number() over (order by m.id) as rn
  from public.organization_memberships m
  join public.helper_preferences hp
    on hp.organization_membership_id = m.id and hp.open_to_help
  where m.organization_id = :'org_id'
    and m.status = 'active'
    and m.id::text like 'dddddddd-1111-%'
) ranked
where rn in (16, 21);

insert into public.conversations (id, user_a_id, user_b_id, created_at, last_message_at)
select
  '99999999-7703-4000-8000-000000000001'::uuid,
  least(user_id, :'jamie_user'::uuid),
  greatest(user_id, :'jamie_user'::uuid),
  now() - interval '3 days',
  now() - interval '1 day'
from journey_accepted;

-- The accepted ask, linked to its room.
insert into public.asks (
  id, organization_id, asker_membership_id, kind, status, recipient_membership_id,
  question, request_message, reach, anonymous_until_accepted, client_request_id,
  conversation_id, accepted_at, responded_at, expires_at, created_at
)
select
  '99999999-7703-4000-8000-000000000002'::uuid,
  :'org_id', :'jamie_membership', 'direct', 'accepted', membership_id,
  'How did you know it was time to move from a big company to something smaller?',
  'I am circling this decision and would value hearing how it felt from the inside.',
  null, false,
  '99999999-7703-4000-8000-000000000102'::uuid,
  '99999999-7703-4000-8000-000000000001'::uuid,
  now() - interval '3 days',
  now() - interval '3 days',
  now() + interval '10 days',
  now() - interval '4 days'
from journey_accepted;

-- The waiting ask, sent yesterday.
insert into public.asks (
  id, organization_id, asker_membership_id, kind, status, recipient_membership_id,
  question, request_message, reach, anonymous_until_accepted, client_request_id,
  expires_at, created_at
)
select
  '99999999-7703-4000-8000-000000000003'::uuid,
  :'org_id', :'jamie_membership', 'direct', 'waiting', membership_id,
  'Would you be open to a short conversation about hiring your first designer?',
  'Happy to work around your schedule.',
  null, false,
  '99999999-7703-4000-8000-000000000103'::uuid,
  now() + interval '13 days',
  now() - interval '1 day'
from journey_helper where rn = 16;

-- The declined ask — the decline-with-note shape, warm on both sides.
insert into public.asks (
  id, organization_id, asker_membership_id, kind, status, recipient_membership_id,
  question, request_message, reach, anonymous_until_accepted, client_request_id,
  decline_reason_code, decline_note, responded_at, ended_at, expires_at, created_at
)
select
  '99999999-7703-4000-8000-000000000004'::uuid,
  :'org_id', :'jamie_membership', 'direct', 'declined', membership_id,
  'Could I ask about your path into venture — and what you would skip in hindsight?',
  'Even a short written answer would be great.',
  null, false,
  '99999999-7703-4000-8000-000000000104'::uuid,
  'unavailable',
  'Stretched thin this month — please do ask again in a few weeks, I would genuinely like to help.',
  now() - interval '2 days',
  now() - interval '2 days',
  now() + interval '8 days',
  now() - interval '6 days'
from journey_helper where rn = 21;

-- Opening exchange in the accepted ask's room.
insert into public.messages (
  conversation_id, sender_user_id, kind, body, client_nonce,
  system_event_type, system_event_key, system_actor_user_id, created_at
)
select * from (
  select
    '99999999-7703-4000-8000-000000000001'::uuid,
    null::uuid, 'system', 'Ask accepted.', null::uuid,
    'ask_accepted', 'scene:ask-journey:accepted',
    (select user_id from journey_accepted),
    now() - interval '3 days'
  union all
  select
    '99999999-7703-4000-8000-000000000001'::uuid,
    (select user_id from journey_accepted), 'user',
    'Happy to talk this through. Short version: I waited a year too long.',
    '99999999-7703-4000-8000-900000000001'::uuid,
    null, null, null,
    now() - interval '2 days'
  union all
  select
    '99999999-7703-4000-8000-000000000001'::uuid,
    :'jamie_user'::uuid, 'user',
    'That is exactly the part I want to hear about. What made it feel too early at the time?',
    '99999999-7703-4000-8000-900000000002'::uuid,
    null, null, null,
    now() - interval '1 day'
) staged (conversation_id, sender_user_id, kind, body, client_nonce,
          system_event_type, system_event_key, system_actor_user_id, created_at)
order by created_at;

-- Both sides caught up — this scene is about the Help history, not unread state.
insert into public.conversation_reads (conversation_id, user_id, last_read_message_id, last_read_at)
values (
  '99999999-7703-4000-8000-000000000001'::uuid,
  :'jamie_user'::uuid,
  (select id from public.messages
   where conversation_id = '99999999-7703-4000-8000-000000000001'
     and client_nonce = '99999999-7703-4000-8000-900000000002'),
  now() - interval '1 day'
), (
  '99999999-7703-4000-8000-000000000001'::uuid,
  (select user_id from journey_accepted),
  (select id from public.messages
   where conversation_id = '99999999-7703-4000-8000-000000000001'
     and client_nonce = '99999999-7703-4000-8000-900000000002'),
  now() - interval '1 day'
);

commit;
