-- Deterministic v2 local/CI seed. Never run against a remote project.

insert into public.organizations (
  id, slug, name, requires_admin_approval
) values (
  '11111111-1111-4111-8111-111111111111',
  'chadwick-local',
  'Chadwick School (Local)',
  true
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000',
  person.id,
  'authenticated',
  'authenticated',
  person.email,
  extensions.crypt(person.password, extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', person.display_name),
  now(), now(), '', '', '', ''
from (values
  ('10000000-0000-4000-8000-000000000001'::uuid, 'admin-amy@example.com', 'devseed-password-amy', 'Amy Admin'),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'richard@example.com', 'devseed-password-richard', 'Richard Lee'),
  ('10000000-0000-4000-8000-000000000003'::uuid, 'mark@example.com', 'devseed-password-mark', 'Mark Chen'),
  ('10000000-0000-4000-8000-000000000004'::uuid, 'mei@example.com', 'devseed-password-mei', 'Mei Park'),
  ('10000000-0000-4000-8000-000000000005'::uuid, 'sam@example.com', 'devseed-password-sam', 'Sam Rivera'),
  ('10000000-0000-4000-8000-000000000006'::uuid, 'jordan@example.com', 'devseed-password-jordan', 'Jordan Kim')
) as person(id, email, password, display_name);

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  u.id::text,
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email', now(), now(), now()
from auth.users u
where u.id::text like '10000000-0000-4000-8000-%';

update public.users
set onboarding_completed_at = now();

insert into public.organization_memberships (
  id, user_id, organization_id, status, joined_at
)
select
  member.id,
  member.user_id,
  '11111111-1111-4111-8111-111111111111',
  'active',
  now()
from (values
  ('20000000-0000-4000-8000-000000000001'::uuid, '10000000-0000-4000-8000-000000000001'::uuid),
  ('20000000-0000-4000-8000-000000000002'::uuid, '10000000-0000-4000-8000-000000000002'::uuid),
  ('20000000-0000-4000-8000-000000000003'::uuid, '10000000-0000-4000-8000-000000000003'::uuid),
  ('20000000-0000-4000-8000-000000000004'::uuid, '10000000-0000-4000-8000-000000000004'::uuid),
  ('20000000-0000-4000-8000-000000000005'::uuid, '10000000-0000-4000-8000-000000000005'::uuid),
  ('20000000-0000-4000-8000-000000000006'::uuid, '10000000-0000-4000-8000-000000000006'::uuid)
) as member(id, user_id);

insert into public.profiles (
  user_id, display_name, headline, current_employer, current_title,
  industry, city, university, major
) values
  ('10000000-0000-4000-8000-000000000001', 'Amy Admin', 'Keeping the Chadwick circle connected', 'Chadwick School', 'Alumni Board Chair', 'Education', 'Palos Verdes, CA', 'Stanford University', 'Public Policy'),
  ('10000000-0000-4000-8000-000000000002', 'Richard Lee', 'Tech investing and early-stage company building', 'Common Capital', 'Investment Associate', 'Venture capital', 'San Francisco, CA', 'Stanford University', 'Computer Science'),
  ('10000000-0000-4000-8000-000000000003', 'Mark Chen', 'Strategy, consulting, and career transitions', 'Acme Consulting', 'Senior Partner', 'Management consulting', 'San Francisco, CA', 'University of Pennsylvania', 'Economics'),
  ('10000000-0000-4000-8000-000000000004', 'Mei Park', 'Product leadership across Seoul and San Francisco', 'Hyundai Motor', 'Product Director', 'Automotive', 'Seoul, South Korea', 'Yonsei University', 'Industrial Engineering'),
  ('10000000-0000-4000-8000-000000000005', 'Sam Rivera', 'Exploring product and engineering paths', 'UCLA', 'Student', 'Technology', 'Los Angeles, CA', 'UCLA', 'Computer Science'),
  ('10000000-0000-4000-8000-000000000006', 'Jordan Kim', 'Climate and infrastructure investing', 'Northstar Ventures', 'Principal', 'Climate investing', 'New York, NY', 'Harvard University', 'Economics');

insert into public.organization_profiles (
  organization_membership_id, organization_id, graduation_year, bio
) values
  ('20000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 2005, 'Alumni board chair and pilot administrator.'),
  ('20000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 2018, 'Happy to help with tech investing and early-stage career questions.'),
  ('20000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 2008, 'Open to consulting, business school, and career transition questions.'),
  ('20000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 2012, 'Product leader with experience moving between Korea and the US.'),
  ('20000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 2024, 'Recent graduate exploring what comes next.'),
  ('20000000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 2011, 'Climate and infrastructure investor.');

insert into public.profile_contact_links (
  id, organization_membership_id, organization_id,
  kind, label, value, audience, sort_order
) values
  ('70000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'linkedin', null, 'https://www.linkedin.com/in/richard-lee', 'self', 0),
  ('70000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'linkedin', null, 'https://www.linkedin.com/in/mark-chen', 'organization', 0),
  ('70000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'linkedin', null, 'https://www.linkedin.com/in/mei-park', 'connections', 0),
  ('70000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'website', null, 'https://northstar.example.com/climate', 'organization', 0);

insert into public.helper_preferences (
  organization_membership_id, organization_id, open_to_help,
  max_pending_requests
) values
  ('20000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', true, 5),
  ('20000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', true, 10),
  ('20000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', true, 10),
  ('20000000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', true, 5);

insert into public.helper_topics (
  organization_membership_id, organization_id, name, normalized_name, sort_order
) values
  ('20000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Venture capital', 'venture capital', 0),
  ('20000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Consulting', 'consulting', 0),
  ('20000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Business school', 'business school', 1),
  ('20000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Product management', 'product management', 0),
  ('20000000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'Climate tech', 'climate tech', 0);

insert into public.admin_role_assignments (
  organization_id, organization_membership_id, role
) values (
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000001',
  'super_admin'
);

insert into public.connections (
  user_a_id, user_b_id, origin_organization_id
) values (
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000004',
  '11111111-1111-4111-8111-111111111111'
);

insert into public.conversations (
  id, user_a_id, user_b_id
) values (
  '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000004'
);

insert into public.messages (
  conversation_id, kind, body, system_event_type, system_event_key,
  system_actor_user_id
) values (
  '50000000-0000-4000-8000-000000000001',
  'system',
  'Connection accepted.',
  'connection_accepted',
  'connection_accepted:seed-richard-mei',
  '10000000-0000-4000-8000-000000000004'
);

insert into public.messages (
  conversation_id, sender_user_id, kind, body, client_nonce
) values (
  '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000004',
  'user',
  'Happy to compare notes on product work in Seoul.',
  '50000000-0000-4000-8000-000000000101'
);

insert into public.asks (
  id, organization_id, asker_membership_id, kind, status,
  recipient_membership_id, question, request_message, reach,
  anonymous_until_accepted, client_request_id
) values (
  '30000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000005',
  'direct', 'waiting',
  '20000000-0000-4000-8000-000000000003',
  'How should I compare consulting and product roles?',
  'I would value your perspective on the first few years of each path.',
  null, false,
  '30000000-0000-4000-8000-000000000101'
), (
  '30000000-0000-4000-8000-000000000002',
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000002',
  'circle', 'open', null,
  'Who has experience evaluating climate infrastructure investments?',
  null,
  'matched', true,
  '30000000-0000-4000-8000-000000000102'
);

insert into private.ask_matches (
  ask_id, organization_id, helper_membership_id, rank, score,
  reason, evidence, model, model_version
) values (
  '30000000-0000-4000-8000-000000000002',
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000006',
  1, 0.91,
  'Invests in climate and infrastructure companies.',
  '{"sections":["headline","helper_topics"]}',
  'seed',
  'v1'
);

-- Messages v2 acceptance matrix for Richard:
-- pending direct Ask + incoming Connections, unread accepted Ask, resolved
-- Ask, disconnected history, and a blocked conversation that must stay hidden.
-- Each unordered user pair owns exactly one room; Ask history links to it.
insert into public.conversations (
  id, user_a_id, user_b_id, created_at
) values (
  '50000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000006',
  now() - interval '2 days'
), (
  '50000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000005',
  now() - interval '5 days'
), (
  '50000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  now() - interval '14 days'
), (
  '50000000-0000-4000-8000-000000000005',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  now() - interval '21 days'
);

insert into public.asks (
  id, organization_id, asker_membership_id, kind, status,
  recipient_membership_id, question, request_message, reach,
  anonymous_until_accepted, client_request_id, accepted_at,
  responded_at, ended_at, outcome_note, conversation_id, created_at
) values (
  '30000000-0000-4000-8000-000000000003',
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000002',
  'direct', 'accepted',
  '20000000-0000-4000-8000-000000000006',
  'How do investors evaluate climate infrastructure opportunities?',
  'I would value a practical framework and a few questions to ask first.',
  null, false,
  '30000000-0000-4000-8000-000000000103',
  now() - interval '2 days', now() - interval '2 days', null, null,
  '50000000-0000-4000-8000-000000000002',
  now() - interval '3 days'
), (
  '30000000-0000-4000-8000-000000000004',
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000005',
  'direct', 'resolved',
  '20000000-0000-4000-8000-000000000002',
  'How can I choose a first product role with room to grow?',
  'I am comparing two teams and would appreciate a grounded outside view.',
  null, false,
  '30000000-0000-4000-8000-000000000104',
  now() - interval '5 days', now() - interval '5 days', now() - interval '1 day',
  'A clearer way to compare the manager, scope, and learning curve.',
  '50000000-0000-4000-8000-000000000003',
  now() - interval '6 days'
), (
  '30000000-0000-4000-8000-000000000005',
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000005',
  'direct', 'waiting',
  '20000000-0000-4000-8000-000000000002',
  'Could you help me prepare for a product case interview?',
  'A short review of how I structure the problem would be a huge help.',
  null, false,
  '30000000-0000-4000-8000-000000000105',
  null, null, null, null,
  null,
  now() - interval '30 minutes'
);

insert into public.connection_requests (
  id, requester_user_id, recipient_user_id, origin_organization_id,
  status, intro_message, client_request_id, created_at
) values (
  '40000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000002',
  '11111111-1111-4111-8111-111111111111',
  'pending',
  'I enjoyed our earlier conversation and would be glad to stay in touch.',
  '40000000-0000-4000-8000-000000000101',
  now() - interval '20 minutes'
), (
  '40000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000005',
  '10000000-0000-4000-8000-000000000002',
  '11111111-1111-4111-8111-111111111111',
  'pending',
  'It would be nice to keep learning from each other.',
  '40000000-0000-4000-8000-000000000102',
  now() - interval '10 minutes'
);

-- Historical direct messages must pass the same sender guard as production.
-- Create the old Connections for insertion, then remove them below to leave
-- retained read-only history.
insert into public.connections (
  user_a_id, user_b_id, origin_organization_id
) values
  ('10000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000003',
   '11111111-1111-4111-8111-111111111111'),
  ('10000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000002',
   '11111111-1111-4111-8111-111111111111');

insert into public.messages (
  conversation_id, kind, body, system_event_type, system_event_key,
  system_actor_user_id, created_at
) values
  ('50000000-0000-4000-8000-000000000002', 'system', 'Ask accepted.',
   'ask_accepted', 'ask_accepted:seed-richard-jordan',
   '10000000-0000-4000-8000-000000000006', now() - interval '2 days'),
  ('50000000-0000-4000-8000-000000000003', 'system', 'Ask accepted.',
   'ask_accepted', 'ask_accepted:seed-sam-richard',
   '10000000-0000-4000-8000-000000000002', now() - interval '5 days'),
  ('50000000-0000-4000-8000-000000000003', 'system', 'Ask resolved.',
   'ask_resolved', 'ask_resolved:seed-sam-richard',
   '10000000-0000-4000-8000-000000000005', now() - interval '1 day'),
  ('50000000-0000-4000-8000-000000000004', 'system', 'Connection accepted.',
   'connection_accepted', 'connection_accepted:seed-richard-mark',
   '10000000-0000-4000-8000-000000000003', now() - interval '14 days'),
  ('50000000-0000-4000-8000-000000000005', 'system', 'Connection accepted.',
   'connection_accepted', 'connection_accepted:seed-amy-richard',
   '10000000-0000-4000-8000-000000000001', now() - interval '21 days');

insert into public.messages (
  conversation_id, sender_user_id, kind, body, client_nonce, created_at
) values
  ('50000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000002', 'user',
   'I am weighing contracted revenue against regulatory and construction risk.',
   '50000000-0000-4000-8000-000000000102', now() - interval '1 day 2 hours'),
  ('50000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000006', 'user',
   'Start with who bears completion risk, then test the durability of the off-take agreement.',
   '50000000-0000-4000-8000-000000000103', now() - interval '40 minutes'),
  ('50000000-0000-4000-8000-000000000003',
   '10000000-0000-4000-8000-000000000005', 'user',
   'The manager and learning curve comparison made the decision much clearer.',
   '50000000-0000-4000-8000-000000000104', now() - interval '2 days'),
  ('50000000-0000-4000-8000-000000000003',
   '10000000-0000-4000-8000-000000000002', 'user',
   'I am glad it helped. Keep me posted as the role takes shape.',
   '50000000-0000-4000-8000-000000000105', now() - interval '1 day 1 hour'),
  ('50000000-0000-4000-8000-000000000004',
   '10000000-0000-4000-8000-000000000003', 'user',
   'I still think about our conversation on choosing the right consulting team.',
   '50000000-0000-4000-8000-000000000106', now() - interval '12 days'),
  ('50000000-0000-4000-8000-000000000005',
   '10000000-0000-4000-8000-000000000001', 'user',
   'This blocked conversation must never appear in Richard’s Messages list.',
   '50000000-0000-4000-8000-000000000107', now() - interval '20 days');

insert into public.conversation_reads (
  conversation_id, user_id, last_read_message_id, last_read_at
)
select message.conversation_id,
       '10000000-0000-4000-8000-000000000002',
       max(message.id), max(message.created_at)
from public.messages message
where message.conversation_id in (
  '50000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000003',
  '50000000-0000-4000-8000-000000000004'
)
group by message.conversation_id;

insert into public.conversation_reads (
  conversation_id, user_id, last_read_message_id, last_read_at
)
select message.conversation_id,
       '10000000-0000-4000-8000-000000000006',
       max(message.id), max(message.created_at)
from public.messages message
where message.conversation_id = '50000000-0000-4000-8000-000000000002'
  and message.sender_user_id = '10000000-0000-4000-8000-000000000002'
group by message.conversation_id;

delete from public.connections
where (user_a_id, user_b_id) in (
  ('10000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000003'),
  ('10000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000002')
);

insert into public.member_blocks (blocker_user_id, blocked_user_id)
values (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002'
);

-- Retained Ask history verifies that many Ask records between the same two
-- people remain attached to their one canonical room.
insert into public.asks (
  id, organization_id, asker_membership_id, kind, status,
  recipient_membership_id, question, request_message, reach,
  anonymous_until_accepted, client_request_id, accepted_at,
  responded_at, ended_at, outcome_note, conversation_id, created_at
)
select
  format('60000000-0000-4000-8000-%s', lpad(sequence::text, 12, '0'))::uuid,
  '11111111-1111-4111-8111-111111111111'::uuid,
  '20000000-0000-4000-8000-000000000002'::uuid,
  'direct', 'resolved',
  '20000000-0000-4000-8000-000000000006'::uuid,
  format('Historical risk discussion %s', lpad(sequence::text, 2, '0')),
  'A retained resolved ask used to verify Messages ordering and pagination.',
  null, false,
  format('61000000-0000-4000-8000-%s', lpad(sequence::text, 12, '0'))::uuid,
  activity_at + interval '1 hour',
  activity_at + interval '1 hour',
  activity_at + interval '2 hours',
  'The conversation produced a useful framework.',
  '50000000-0000-4000-8000-000000000002'::uuid,
  activity_at
from (
  select
    sequence,
    case
      when sequence in (26, 27) then now() - interval '100 days'
      else now() - interval '60 days' - make_interval(days => sequence)
    end as activity_at
  from generate_series(1, 27) as sequence
) historical;

-- Account deletion retains an anonymized user tombstone and conversation
-- history. No auth identity or profile survives, so the UI must render the
-- leak-safe Deleted member fallback and a read-only thread.
insert into public.users (id, account_state, deleted_at)
values (
  'f7000000-0000-4000-8000-000000000001',
  'deleted',
  now() - interval '200 days'
);

insert into public.conversations (
  id, user_a_id, user_b_id, created_at
) values (
  '62000000-0000-4000-8000-000000000999',
  '10000000-0000-4000-8000-000000000002',
  'f7000000-0000-4000-8000-000000000001',
  now() - interval '200 days'
);

insert into public.events (
  id, organization_id, created_by_membership_id, status, title,
  description, location, starts_at, ends_at, capacity, published_at
) values (
  'eeee0000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000001',
  'published',
  'Chadwick alumni summer gathering',
  'A relaxed evening to reconnect across class years.',
  'Palos Verdes, CA',
  now() + interval '30 days',
  now() + interval '30 days 3 hours',
  3,
  now()
);

insert into public.event_rsvps (
  organization_id, event_id, organization_membership_id, status
) values (
  '11111111-1111-4111-8111-111111111111',
  'eeee0000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  'going'
);
