-- Deterministic v2 local/CI seed. Never run against a remote project.

insert into public.organizations (
  id, slug, name, requires_admin_approval
) values (
  '11111111-1111-1111-1111-111111111111',
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
  '11111111-1111-1111-1111-111111111111',
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
  city, university, major, linkedin_url
) values
  ('10000000-0000-4000-8000-000000000001', 'Amy Admin', 'Keeping the Chadwick circle connected', 'Chadwick School', 'Alumni Board Chair', 'Palos Verdes, CA', 'Stanford University', 'Public Policy', null),
  ('10000000-0000-4000-8000-000000000002', 'Richard Lee', 'Tech investing and early-stage company building', 'Common Capital', 'Investment Associate', 'San Francisco, CA', 'Stanford University', 'Computer Science', null),
  ('10000000-0000-4000-8000-000000000003', 'Mark Chen', 'Strategy, consulting, and career transitions', 'Acme Consulting', 'Senior Partner', 'San Francisco, CA', 'University of Pennsylvania', 'Economics', 'https://www.linkedin.com/in/mark-chen'),
  ('10000000-0000-4000-8000-000000000004', 'Mei Park', 'Product leadership across Seoul and San Francisco', 'Hyundai Motor', 'Product Director', 'Seoul, South Korea', 'Yonsei University', 'Industrial Engineering', 'https://www.linkedin.com/in/mei-park'),
  ('10000000-0000-4000-8000-000000000005', 'Sam Rivera', 'Exploring product and engineering paths', 'UCLA', 'Student', 'Los Angeles, CA', 'UCLA', 'Computer Science', null),
  ('10000000-0000-4000-8000-000000000006', 'Jordan Kim', 'Climate and infrastructure investing', 'Northstar Ventures', 'Principal', 'New York, NY', 'Harvard University', 'Economics', null);

insert into public.organization_profiles (
  organization_membership_id, organization_id, graduation_year, bio
) values
  ('20000000-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', 2005, 'Alumni board chair and pilot administrator.'),
  ('20000000-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', 2018, 'Happy to help with tech investing and early-stage career questions.'),
  ('20000000-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111', 2008, 'Open to consulting, business school, and career transition questions.'),
  ('20000000-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111', 2012, 'Product leader with experience moving between Korea and the US.'),
  ('20000000-0000-4000-8000-000000000005', '11111111-1111-1111-1111-111111111111', 2024, 'Recent graduate exploring what comes next.'),
  ('20000000-0000-4000-8000-000000000006', '11111111-1111-1111-1111-111111111111', 2011, 'Climate and infrastructure investor.');

insert into public.helper_preferences (
  organization_membership_id, organization_id, open_to_help,
  max_pending_requests
) values
  ('20000000-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', true, 5),
  ('20000000-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111', true, 10),
  ('20000000-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111', true, 10),
  ('20000000-0000-4000-8000-000000000006', '11111111-1111-1111-1111-111111111111', true, 5);

insert into public.helper_topics (
  organization_membership_id, organization_id, name, normalized_name, sort_order
) values
  ('20000000-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', 'Venture capital', 'venture capital', 0),
  ('20000000-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111', 'Consulting', 'consulting', 0),
  ('20000000-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111', 'Business school', 'business school', 1),
  ('20000000-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111', 'Product management', 'product management', 0),
  ('20000000-0000-4000-8000-000000000006', '11111111-1111-1111-1111-111111111111', 'Climate tech', 'climate tech', 0);

insert into public.admin_role_assignments (
  organization_id, organization_membership_id, role
) values (
  '11111111-1111-1111-1111-111111111111',
  '20000000-0000-4000-8000-000000000001',
  'super_admin'
);

insert into public.connections (
  user_a_id, user_b_id, origin_organization_id
) values (
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000004',
  '11111111-1111-1111-1111-111111111111'
);

insert into public.conversations (
  id, kind, user_a_id, user_b_id
) values (
  '50000000-0000-4000-8000-000000000001',
  'direct',
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
  '11111111-1111-1111-1111-111111111111',
  '20000000-0000-4000-8000-000000000005',
  'direct', 'waiting',
  '20000000-0000-4000-8000-000000000003',
  'How should I compare consulting and product roles?',
  'I would value your perspective on the first few years of each path.',
  null, false,
  '30000000-0000-4000-8000-000000000101'
), (
  '30000000-0000-4000-8000-000000000002',
  '11111111-1111-1111-1111-111111111111',
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
  '11111111-1111-1111-1111-111111111111',
  '20000000-0000-4000-8000-000000000006',
  1, 0.91,
  'Invests in climate and infrastructure companies.',
  '{"sections":["headline","helper_topics"]}',
  'seed',
  'v1'
);

insert into public.events (
  id, organization_id, created_by_membership_id, status, title,
  description, location, starts_at, ends_at, capacity, published_at
) values (
  'eeee0000-0000-4000-8000-000000000001',
  '11111111-1111-1111-1111-111111111111',
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
  '11111111-1111-1111-1111-111111111111',
  'eeee0000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  'going'
);
