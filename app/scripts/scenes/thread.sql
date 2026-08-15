-- Scene: thread (namespace 99999999-7702)
--
-- An accepted-Ask conversation in mid-flow — the messaging storyline opener.
-- Jamie asked, the counterpart accepted, four messages exchanged, and the
-- latest incoming message is unread (Jamie's read pointer sits one message
-- behind), so Messages opens with a live thread and an unread badge.
--
-- The counterpart is queried, not hardcoded: the sixth active crowd member
-- with a headline and no existing room with Jamie (disjoint from the other
-- scenes' row-number windows; the no-room filter guards conversations_pair_key
-- against the bridge step's rooms).

begin;

delete from public.asks where id::text like '99999999-7702-%';
delete from public.conversations where id::text like '99999999-7702-%';

create temporary table scene_counterpart on commit drop as
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
where rn = 6;

insert into public.conversations (id, user_a_id, user_b_id, created_at, last_message_at)
select
  '99999999-7702-4000-8000-000000000001'::uuid,
  least(user_id, :'jamie_user'::uuid),
  greatest(user_id, :'jamie_user'::uuid),
  now() - interval '4 days',
  now() - interval '2 hours'
from scene_counterpart;

insert into public.asks (
  id, organization_id, asker_membership_id, kind, status, recipient_membership_id,
  question, request_message, reach, anonymous_until_accepted, client_request_id,
  conversation_id, accepted_at, responded_at, expires_at, created_at
)
select
  '99999999-7702-4000-8000-000000000002'::uuid,
  :'org_id',
  :'jamie_membership',
  'direct',
  'accepted',
  membership_id,
  'Would you be open to comparing notes on a rotation abroad versus holding out for the right Seoul role?',
  'I keep going back and forth and could use a read from someone who has done it.',
  null,
  false,
  '99999999-7702-4000-8000-000000000102'::uuid,
  '99999999-7702-4000-8000-000000000001'::uuid,
  now() - interval '4 days',
  now() - interval '4 days',
  now() + interval '9 days',
  now() - interval '5 days'
from scene_counterpart;

insert into public.messages (
  conversation_id, sender_user_id, kind, body, client_nonce,
  system_event_type, system_event_key, system_actor_user_id, created_at
)
select * from (
  select
    '99999999-7702-4000-8000-000000000001'::uuid,
    null::uuid,
    'system',
    'Ask accepted.',
    null::uuid,
    'ask_accepted',
    'scene:thread:accepted',
    (select user_id from scene_counterpart),
    now() - interval '4 days'
  union all
  select
    '99999999-7702-4000-8000-000000000001'::uuid,
    :'jamie_user'::uuid,
    'user',
    'Thank you for taking this — I know it is a busy season.',
    '99999999-7702-4000-8000-900000000001'::uuid,
    null, null, null,
    now() - interval '4 days' + interval '5 minutes'
  union all
  select
    '99999999-7702-4000-8000-000000000001'::uuid,
    (select user_id from scene_counterpart),
    'user',
    'Glad to. Tell me where you are stuck and we can go from there.',
    '99999999-7702-4000-8000-900000000002'::uuid,
    null, null, null,
    now() - interval '3 days'
  union all
  select
    '99999999-7702-4000-8000-000000000001'::uuid,
    :'jamie_user'::uuid,
    'user',
    'Mostly whether the Singapore rotation is worth leaving a team I like. The role itself is a step up either way.',
    '99999999-7702-4000-8000-900000000003'::uuid,
    null, null, null,
    now() - interval '1 day'
  union all
  select
    '99999999-7702-4000-8000-000000000001'::uuid,
    (select user_id from scene_counterpart),
    'user',
    'That is the right question to be asking. A few thoughts — and happy to get on a call this week if that is easier.',
    '99999999-7702-4000-8000-900000000004'::uuid,
    null, null, null,
    now() - interval '2 hours'
) staged (conversation_id, sender_user_id, kind, body, client_nonce,
          system_event_type, system_event_key, system_actor_user_id, created_at)
order by created_at;

-- Jamie has read through her own last message; the counterpart's newest reply
-- stays unread so Messages opens with a badge. The counterpart is caught up.
insert into public.conversation_reads (conversation_id, user_id, last_read_message_id, last_read_at)
values (
  '99999999-7702-4000-8000-000000000001'::uuid,
  :'jamie_user'::uuid,
  (select id from public.messages
   where conversation_id = '99999999-7702-4000-8000-000000000001'
     and client_nonce = '99999999-7702-4000-8000-900000000003'),
  now() - interval '1 day'
), (
  '99999999-7702-4000-8000-000000000001'::uuid,
  (select user_id from scene_counterpart),
  (select id from public.messages
   where conversation_id = '99999999-7702-4000-8000-000000000001'
     and client_nonce = '99999999-7702-4000-8000-900000000004'),
  now() - interval '2 hours'
);

commit;
