-- Deterministic v2 seed for local/CI and an explicitly authorized disposable hosted development reset.
-- Production use is forbidden.

-- Two pilot schools. Chadwick International (Songdo) is the first pilot and
-- Chadwick School (Palos Verdes) follows, so both must carry real content and
-- the pair must exercise cross-organization fencing. The approval flag differs
-- deliberately: organization one covers the admin-reviewed join path and
-- organization two covers the auto-join onboarding path.
insert into public.organizations (
  id, slug, name, requires_admin_approval
) values (
  '11111111-1111-4111-8111-111111111111',
  'chadwick-local',
  'Chadwick School (Local)',
  true
), (
  '22222222-2222-4222-8222-222222222222',
  'chadwick-international-local',
  'Chadwick International (Local)',
  false
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
  ('10000000-0000-4000-8000-000000000006'::uuid, 'jordan@example.com', 'devseed-password-jordan', 'Jordan Kim'),
  ('10000000-0000-4000-8000-000000000007'::uuid, 'onboarding@example.com', 'devseed-password-onboarding', 'Alex Morgan'),
  ('10000000-0000-4000-8000-000000000008'::uuid, 'taylor@example.com', 'devseed-password-taylor', 'Taylor Reed'),
  -- Chadwick International cast. The school teaches in English and its alumni
  -- are spread across Asia, Europe, and the US, so the roster is deliberately
  -- global rather than Songdo-local.
  ('10000000-0000-4000-8000-000000000009'::uuid, 'nadia@example.com', 'devseed-password-nadia', 'Nadia Haddad'),
  ('10000000-0000-4000-8000-000000000010'::uuid, 'daniel@example.com', 'devseed-password-daniel', 'Daniel Okafor'),
  ('10000000-0000-4000-8000-000000000011'::uuid, 'sofia@example.com', 'devseed-password-sofia', 'Sofia Alvarez'),
  ('10000000-0000-4000-8000-000000000012'::uuid, 'wei@example.com', 'devseed-password-wei', 'Wei Zhang'),
  ('10000000-0000-4000-8000-000000000013'::uuid, 'elena@example.com', 'devseed-password-elena', 'Elena Castro'),
  ('10000000-0000-4000-8000-000000000014'::uuid, 'noah@example.com', 'devseed-password-noah', 'Noah Bennett'),
  ('10000000-0000-4000-8000-000000000015'::uuid, 'pending@example.com', 'devseed-password-pending', 'Priya Raman'),
  ('10000000-0000-4000-8000-000000000016'::uuid, 'rejected@example.com', 'devseed-password-rejected', 'Omar Farouk'),
  ('10000000-0000-4000-8000-000000000017'::uuid, 'revoked@example.com', 'devseed-password-revoked', 'Lucas Meyer'),
  ('10000000-0000-4000-8000-000000000018'::uuid, 'leaving@example.com', 'devseed-password-leaving', 'Grace Han')
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
  member.organization_id,
  'active',
  now()
from (values
  ('20000000-0000-4000-8000-000000000001'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, '11111111-1111-4111-8111-111111111111'::uuid),
  ('20000000-0000-4000-8000-000000000002'::uuid, '10000000-0000-4000-8000-000000000002'::uuid, '11111111-1111-4111-8111-111111111111'::uuid),
  ('20000000-0000-4000-8000-000000000003'::uuid, '10000000-0000-4000-8000-000000000003'::uuid, '11111111-1111-4111-8111-111111111111'::uuid),
  ('20000000-0000-4000-8000-000000000004'::uuid, '10000000-0000-4000-8000-000000000004'::uuid, '11111111-1111-4111-8111-111111111111'::uuid),
  ('20000000-0000-4000-8000-000000000005'::uuid, '10000000-0000-4000-8000-000000000005'::uuid, '11111111-1111-4111-8111-111111111111'::uuid),
  ('20000000-0000-4000-8000-000000000006'::uuid, '10000000-0000-4000-8000-000000000006'::uuid, '11111111-1111-4111-8111-111111111111'::uuid),
  ('20000000-0000-4000-8000-000000000007'::uuid, '10000000-0000-4000-8000-000000000007'::uuid, '22222222-2222-4222-8222-222222222222'::uuid),
  ('20000000-0000-4000-8000-000000000008'::uuid, '10000000-0000-4000-8000-000000000008'::uuid, '22222222-2222-4222-8222-222222222222'::uuid)
) as member(id, user_id, organization_id);

insert into public.profiles (
  user_id, display_name, headline, current_employer, current_title,
  industry, city, university, major
) values
  ('10000000-0000-4000-8000-000000000001', 'Amy Admin', 'Keeping the Chadwick circle connected', 'Chadwick School', 'Alumni Board Chair', 'Education', 'Palos Verdes, CA', 'Stanford University', 'Public Policy'),
  ('10000000-0000-4000-8000-000000000002', 'Richard Lee', 'Tech investing and early-stage company building', 'Common Capital', 'Investment Associate', 'Venture capital', 'San Francisco, CA', 'Stanford University', 'Computer Science'),
  ('10000000-0000-4000-8000-000000000003', 'Mark Chen', 'Strategy, consulting, and career transitions', 'Acme Consulting', 'Senior Partner', 'Management consulting', 'San Francisco, CA', 'University of Pennsylvania', 'Economics'),
  ('10000000-0000-4000-8000-000000000004', 'Mei Park', 'Product leadership across Seoul and San Francisco', 'Hyundai Motor', 'Product Director', 'Automotive', 'Seoul, South Korea', 'Yonsei University', 'Industrial Engineering'),
  ('10000000-0000-4000-8000-000000000005', 'Sam Rivera', 'Exploring product and engineering paths', 'UCLA', 'Student', 'Technology', 'Los Angeles, CA', 'UCLA', 'Computer Science'),
  ('10000000-0000-4000-8000-000000000006', 'Jordan Kim', 'Climate and infrastructure investing', 'Northstar Ventures', 'Principal', 'Climate investing', 'New York, NY', 'Harvard University', 'Economics'),
  ('10000000-0000-4000-8000-000000000007', 'Alex Morgan', null, null, null, null, null, null, null),
  ('10000000-0000-4000-8000-000000000008', 'Taylor Reed', 'Climate careers and community building', 'Greenline', 'Program Lead', 'Climate', 'Los Angeles, CA', 'UCLA', 'Public Policy');

insert into public.organization_profiles (
  organization_membership_id, organization_id, graduation_year, bio
) values
  ('20000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 2005, 'Alumni board chair and pilot administrator.'),
  ('20000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 2018, 'Happy to help with tech investing and early-stage career questions.'),
  ('20000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 2008, 'Open to consulting, business school, and career transition questions.'),
  ('20000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 2012, 'Product leader with experience moving between Korea and the US.'),
  ('20000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 2024, 'Recent graduate exploring what comes next.'),
  ('20000000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 2011, 'Climate and infrastructure investor.'),
  ('20000000-0000-4000-8000-000000000007', '22222222-2222-4222-8222-222222222222', 2018, null),
  ('20000000-0000-4000-8000-000000000008', '22222222-2222-4222-8222-222222222222', 2018, 'Open to helping classmates explore climate careers.');

update public.users
set onboarding_completed_at = null
where id = '10000000-0000-4000-8000-000000000007';

-- Deterministic review-first Fast Fill proposal. Browser tests exercise the
-- review and atomic apply without calling an external enrichment provider.
insert into private.profile_change_proposals (
  id, user_id, source, status, current_snapshot, proposed_snapshot,
  source_metadata, confidence, review_token_hash, expires_at
) values (
  '91000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000007',
  'resume',
  'pending',
  '{
    "name":"Alex Morgan","headline":null,"city":null,"currentEmployer":null,
    "currentTitle":null,"university":null,"major":null,"linkedinUrl":null,
    "careerHistory":[],"educationHistory":[],"skills":[]
  }'::jsonb,
  '{
    "name":"Alex Morgan","headline":"Climate programs and community partnerships",
    "city":"Los Angeles, CA","currentEmployer":"Civic Futures","currentTitle":"Program Associate",
    "university":"UCLA","major":"Public Policy",
    "careerHistory":[{
      "employer":"Civic Futures","title":"Program Associate","startDate":"2024-07",
      "endDate":null,"description":"Builds partnerships for climate career programs."
    }],
    "educationHistory":[{
      "school":"UCLA","degree":"B.A.","field":"Public Policy","startDate":"2018","endDate":"2022"
    }],
    "skills":["community partnerships","climate programs","program management"]
  }'::jsonb,
  '{"originalName":"alex-morgan-resume.pdf","mimeType":"application/pdf"}'::jsonb,
  0.91,
  extensions.digest('local-onboarding-import-review-token', 'sha256'),
  now() + interval '7 days'
);

insert into private.profile_import_requests (
  id, user_id, organization_membership_id, client_request_id, source,
  source_key_hash, status, proposal_id
) values (
  '92000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000007',
  '20000000-0000-4000-8000-000000000007',
  '93000000-0000-4000-8000-000000000001',
  'resume',
  extensions.digest('seed:alex-morgan-resume.pdf', 'sha256'),
  'ready',
  '91000000-0000-4000-8000-000000000001'
);

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
), (
  '30000000-0000-4000-8000-000000000006',
  '22222222-2222-4222-8222-222222222222',
  '20000000-0000-4000-8000-000000000008',
  'circle', 'open', null,
  'Who has experience planning a career pivot into climate work?',
  null,
  'matched', false,
  '30000000-0000-4000-8000-000000000106'
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
), (
  '30000000-0000-4000-8000-000000000006',
  '22222222-2222-4222-8222-222222222222',
  '20000000-0000-4000-8000-000000000007',
  1, 0.72,
  'New member cold-start match for the onboarding offer flow.',
  '{"sections":["graduation_year"]}',
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
  id, organization_id, created_by_membership_id, status, slug, category, title,
  summary, description, format, time_zone, campus, location, location_name,
  location_address, maps_url, join_url, host_name, starts_at, ends_at, capacity,
  published_at, cancelled_at, cancellation_note, changed_at, change_note
) values (
  'eeee0000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000001',
  'published',
  'summer-gathering', 'Social', 'Summer gathering on the Main Court Patio',
  'An easy evening on the patio — name tags, snacks, and no program.',
  E'No agenda and no speeches. Come as you are, find a name tag, and let the patio do the work.\n\nFirst time back in a while? These gatherings skew friendly and people rarely stay inside their class year.',
  'in_person', 'America/Los_Angeles', 'palos_verdes', 'Main Court Patio',
  'Main Court Patio', '26800 S Academy Dr, Palos Verdes Peninsula, CA',
  'https://maps.google.com/?q=Chadwick+School+Palos+Verdes', null,
  'the Alumni Office',
  now() + interval '30 days',
  now() + interval '30 days 3 hours',
  50, now(), null, null, null, null
), (
  'eeee0000-0000-4000-8000-000000000002',
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000001',
  'published',
  'founders-dinner', 'Dinner', 'Founders Dinner at The Riviera',
  'A small dinner for alumni building companies and teams.',
  'A seated dinner with a short welcome, then an unhurried conversation across the table.',
  'in_person', 'America/Los_Angeles', 'palos_verdes', 'The Riviera Country Club',
  'The Riviera Country Club', '1250 Capri Dr, Pacific Palisades, CA',
  'https://maps.google.com/?q=The+Riviera+Country+Club', null,
  'Amy and the Alumni Board',
  now() + interval '45 days', now() + interval '45 days 2 hours 30 minutes',
  1, now(), null, null, null, null
), (
  'eeee0000-0000-4000-8000-000000000003',
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000001',
  'published',
  'seoul-office-hours', 'Conversation', 'Seoul alumni office hours',
  'A short online room for anyone moving between Korea and the US.',
  'Drop in with a question or just listen. The room opens one hour before the start.',
  'online', 'Asia/Seoul', 'online', null, null, null, null,
  'https://meet.example.com/chadwick-office-hours', 'Mei Park',
  now() + interval '30 minutes', now() + interval '2 hours',
  null, now(), null, null, now() - interval '1 day',
  'The start moved thirty minutes later so more members in California can join.'
), (
  'eeee0000-0000-4000-8000-000000000004',
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000001',
  'cancelled',
  'campus-walk', 'Campus', 'A walk through the new campus spaces',
  'A quiet return to campus with the facilities team.',
  'The visit was cancelled because construction access changed.',
  'in_person', 'America/Los_Angeles', 'palos_verdes', 'Chadwick School',
  'Chadwick School', null, null, null, 'the Alumni Office',
  now() + interval '10 days', now() + interval '10 days 90 minutes',
  30, now() - interval '10 days', now() - interval '2 days',
  'Construction access changed, so this walk will be rescheduled.', null, null
), (
  'eeee0000-0000-4000-8000-000000000005',
  '11111111-1111-4111-8111-111111111111',
  '20000000-0000-4000-8000-000000000001',
  'published',
  'spring-career-panel', 'Panel', 'Spring career panel',
  'Alumni shared practical lessons from their first five years after Chadwick.',
  'A completed event retained as a calm record for members who attended.',
  'in_person', 'America/Los_Angeles', 'palos_verdes', 'Laverty Center',
  'Laverty Center', null, null, null, 'the Alumni Office',
  now() - interval '20 days', now() - interval '20 days' + interval '2 hours',
  80, now() - interval '60 days', null, null, null, null
);

insert into public.event_rsvps (
  organization_id, event_id, organization_membership_id, status
) values
(
  '11111111-1111-4111-8111-111111111111',
  'eeee0000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  'going'
),
('11111111-1111-4111-8111-111111111111', 'eeee0000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000004', 'going'),
('11111111-1111-4111-8111-111111111111', 'eeee0000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000006', 'going'),
('11111111-1111-4111-8111-111111111111', 'eeee0000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'going'),
('11111111-1111-4111-8111-111111111111', 'eeee0000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', 'going'),
('11111111-1111-4111-8111-111111111111', 'eeee0000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000002', 'going'),
('11111111-1111-4111-8111-111111111111', 'eeee0000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000003', 'going');

insert into public.event_schedule_items (organization_id, event_id, position, starts_at, label) values
('11111111-1111-4111-8111-111111111111', 'eeee0000-0000-4000-8000-000000000002', 0, now() + interval '45 days', 'Doors open and drinks'),
('11111111-1111-4111-8111-111111111111', 'eeee0000-0000-4000-8000-000000000002', 1, now() + interval '45 days 30 minutes', 'Dinner and table conversation'),
('11111111-1111-4111-8111-111111111111', 'eeee0000-0000-4000-8000-000000000002', 2, now() + interval '45 days 2 hours', 'A short closing note');

insert into public.event_facts (
  organization_id, event_id, position, label, value, link_label, link_url
) values
('11111111-1111-4111-8111-111111111111', 'eeee0000-0000-4000-8000-000000000001', 0, 'Parking', 'Lot B, off Academy Road', 'Directions', 'https://maps.google.com/?q=Chadwick+School+Palos+Verdes'),
('11111111-1111-4111-8111-111111111111', 'eeee0000-0000-4000-8000-000000000001', 1, 'Cost', 'Free — snacks and drinks covered', null, null),
('11111111-1111-4111-8111-111111111111', 'eeee0000-0000-4000-8000-000000000002', 0, 'Dress', 'Whatever you wore that day', null, null),
('11111111-1111-4111-8111-111111111111', 'eeee0000-0000-4000-8000-000000000002', 1, 'Guest', 'One guest is welcome', null, null);

insert into public.announcements (
  id, organization_id, author_membership_id, status, tag, title, summary,
  body, pinned, published_at
) values
('aaaa0000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '20000000-0000-4000-8000-000000000001', 'published', 'reunion', 'Reunion weekend dates are set', 'Save the first weekend in October for class gatherings and a return to campus.', E'Reunion weekend will begin Friday evening and continue through Sunday morning.\n\nClass volunteers will receive planning notes next week.', true, now() - interval '2 days'),
('aaaa0000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '20000000-0000-4000-8000-000000000001', 'published', 'mentorship', 'Career conversations for this summer', 'Alumni volunteers can host one short conversation with a recent graduate.', 'If you have twenty minutes to share what your first role actually felt like, open Help and tell the circle what you know.', false, now() - interval '5 days'),
('aaaa0000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', '20000000-0000-4000-8000-000000000001', 'published', 'hiring', 'Share a summer opportunity', 'The school can pass along internships and early-career roles.', 'Send the alumni office a role link and a short note about who would learn the most from it.', false, now() - interval '8 days'),
('aaaa0000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', '20000000-0000-4000-8000-000000000001', 'published', 'general', 'Library hours during campus work', 'The library entrance moves to the east walk for two weeks.', 'Construction near the main entrance changes the route, but the library remains open on its usual schedule.', false, now() - interval '12 days');

insert into public.announcement_reads (
  organization_id, announcement_id, organization_membership_id, read_at
) values (
  '11111111-1111-4111-8111-111111111111',
  'aaaa0000-0000-4000-8000-000000000004',
  '20000000-0000-4000-8000-000000000002',
  now() - interval '10 days'
);

insert into public.newsletter_issues (
  id, organization_id, slug, issue_number, status, title, summary, published_at
) values
('bbbb0000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'july-2026', 18, 'published', 'The Bridge · July 2026', 'Small updates from campus and the alumni circle.', now() - interval '3 days'),
('bbbb0000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'june-2026', 17, 'archived', 'The Bridge · June 2026', 'A look back at spring and what is next.', now() - interval '33 days');

insert into public.newsletter_sections (
  organization_id, issue_id, position, heading, body, link_label, link_url
) values
('11111111-1111-4111-8111-111111111111', 'bbbb0000-0000-4000-8000-000000000001', 0, 'A summer return to campus', 'The patio is open again, and the alumni office is planning a relaxed evening without a program or speeches.', null, null),
('11111111-1111-4111-8111-111111111111', 'bbbb0000-0000-4000-8000-000000000001', 1, 'One useful conversation', 'Recent graduates are asking for honest stories about first jobs, changing direction, and living in a new city.', 'See what the circle needs', 'https://bridgecircle.org/help'),
('11111111-1111-4111-8111-111111111111', 'bbbb0000-0000-4000-8000-000000000001', 2, 'From the archive', 'The oral history team added three interviews with alumni from the 1970s.', null, null),
('11111111-1111-4111-8111-111111111111', 'bbbb0000-0000-4000-8000-000000000002', 0, 'Spring, in a few lines', 'Students closed the year with performances, project exhibitions, and the usual mix of relief and pride.', null, null);

-- ---------------------------------------------------------------------------
-- Chadwick International and full state-machine coverage.
--
-- Everything above is the original single-organization fixture. Everything
-- below adds the second pilot school and fills the lifecycle states the fixture
-- never reached, so every status a constraint allows is renderable somewhere.
-- ---------------------------------------------------------------------------

-- Chadwick International memberships. Active, pending, rejected, and revoked
-- are all present so the admin review queue has real rows to work with.
insert into public.organization_memberships (
  id, user_id, organization_id, status, joined_at
) values
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000009', '22222222-2222-4222-8222-222222222222', 'active', now() - interval '400 days'),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000010', '22222222-2222-4222-8222-222222222222', 'active', now() - interval '320 days'),
  ('20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000011', '22222222-2222-4222-8222-222222222222', 'active', now() - interval '280 days'),
  ('20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000012', '22222222-2222-4222-8222-222222222222', 'active', now() - interval '210 days'),
  ('20000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000013', '22222222-2222-4222-8222-222222222222', 'active', now() - interval '180 days'),
  ('20000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000014', '22222222-2222-4222-8222-222222222222', 'active', now() - interval '45 days'),
  ('20000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000015', '22222222-2222-4222-8222-222222222222', 'pending', null),
  ('20000000-0000-4000-8000-000000000016', '10000000-0000-4000-8000-000000000016', '22222222-2222-4222-8222-222222222222', 'rejected', null),
  ('20000000-0000-4000-8000-000000000017', '10000000-0000-4000-8000-000000000017', '22222222-2222-4222-8222-222222222222', 'revoked', null),
  ('20000000-0000-4000-8000-000000000018', '10000000-0000-4000-8000-000000000018', '22222222-2222-4222-8222-222222222222', 'active', now() - interval '150 days');

-- Elena attended Chadwick International through middle school and finished at
-- Chadwick School, so she holds one membership per organization with a
-- different class year in each. Identity is user-scoped; everything else is
-- membership-scoped, and this is the row that proves it.
insert into public.organization_memberships (
  id, user_id, organization_id, status, joined_at
) values (
  '20000000-0000-4000-8000-000000000019',
  '10000000-0000-4000-8000-000000000013',
  '11111111-1111-4111-8111-111111111111',
  'active',
  now() - interval '175 days'
);

insert into public.profiles (
  user_id, display_name, headline, current_employer, current_title,
  industry, city, university, major
) values
  ('10000000-0000-4000-8000-000000000009', 'Nadia Haddad', 'Keeping the Songdo circle connected across time zones', 'Chadwick International', 'Alumni Relations Lead', 'Education', 'Songdo, South Korea', 'Seoul National University', 'Communications'),
  ('10000000-0000-4000-8000-000000000010', 'Daniel Okafor', 'Infrastructure finance across Europe and West Africa', 'Meridian Partners', 'Director', 'Infrastructure finance', 'London, United Kingdom', 'London School of Economics', 'Finance'),
  ('10000000-0000-4000-8000-000000000011', 'Sofia Alvarez', 'Reporting on climate, cities, and the people in them', 'The Atlantic Review', 'Staff Writer', 'Journalism', 'New York, NY', 'Columbia University', 'Journalism'),
  -- Deliberate long-text fixture. The UI truncates headlines at several
  -- thresholds and nothing in the original seed was long enough to reach them.
  ('10000000-0000-4000-8000-000000000012', 'Wei Zhang', 'Translational biology, assay development, and the slow unglamorous work of moving a promising result out of the lab and into something a clinician can actually use with patients', 'Helix Bio', 'Principal Scientist', 'Biotechnology', 'Singapore', 'National University of Singapore', 'Molecular Biology'),
  -- Deliberate long-name fixture for avatar initials and column layout.
  ('10000000-0000-4000-8000-000000000013', 'Elena Castro-Villanueva de la Fuente', 'Design systems and product design', 'Northwind', 'Design Lead', 'Design', 'Madrid, Spain', 'IE University', 'Design'),
  -- Deliberate short-text fixture. Real members often write almost nothing.
  ('10000000-0000-4000-8000-000000000014', 'Noah Bennett', 'Figuring it out', 'Yonsei University', 'Student', 'Technology', 'Songdo, South Korea', 'Yonsei University', 'Computer Science'),
  ('10000000-0000-4000-8000-000000000015', 'Priya Raman', null, null, null, null, 'Mumbai, India', null, null),
  ('10000000-0000-4000-8000-000000000016', 'Omar Farouk', null, null, null, null, null, null, null),
  ('10000000-0000-4000-8000-000000000017', 'Lucas Meyer', 'Formerly of the Berlin alumni chapter', null, null, null, 'Berlin, Germany', null, null),
  ('10000000-0000-4000-8000-000000000018', 'Grace Han', 'Community programs and volunteer coordination', 'Openfield', 'Programs Manager', 'Nonprofit', 'Vancouver, Canada', 'University of British Columbia', 'Sociology');

insert into public.organization_profiles (
  organization_membership_id, organization_id, graduation_year, bio
) values
  ('20000000-0000-4000-8000-000000000009', '22222222-2222-4222-8222-222222222222', 2013, 'Alumni relations lead for the Songdo campus and the global chapters.'),
  ('20000000-0000-4000-8000-000000000010', '22222222-2222-4222-8222-222222222222', 2014, 'Happy to talk about project finance, moving abroad, and building a career across two continents.'),
  ('20000000-0000-4000-8000-000000000011', '22222222-2222-4222-8222-222222222222', 2016, 'Open to questions about journalism, writing, and getting a first byline.'),
  ('20000000-0000-4000-8000-000000000012', '22222222-2222-4222-8222-222222222222', 2015, 'Research scientist. Currently heads-down and not taking new conversations.'),
  ('20000000-0000-4000-8000-000000000013', '22222222-2222-4222-8222-222222222222', 2015, 'Started at Songdo, finished at Palos Verdes. Glad to help with design questions from either circle.'),
  ('20000000-0000-4000-8000-000000000014', '22222222-2222-4222-8222-222222222222', 2025, null),
  ('20000000-0000-4000-8000-000000000015', '22222222-2222-4222-8222-222222222222', 2017, null),
  ('20000000-0000-4000-8000-000000000016', '22222222-2222-4222-8222-222222222222', null, null),
  ('20000000-0000-4000-8000-000000000017', '22222222-2222-4222-8222-222222222222', 2012, null),
  ('20000000-0000-4000-8000-000000000018', '22222222-2222-4222-8222-222222222222', 2018, 'Community programs and volunteer coordination.'),
  ('20000000-0000-4000-8000-000000000019', '11111111-1111-4111-8111-111111111111', 2019, 'Design lead. Songdo through middle school, then Palos Verdes.');

-- An approval audit trail on two of the active members.
update public.organization_memberships
set approved_by_membership_id = '20000000-0000-4000-8000-000000000009',
    approved_at = joined_at
where id in (
  '20000000-0000-4000-8000-000000000014',
  '20000000-0000-4000-8000-000000000018'
);

insert into private.membership_rejection_details (
  membership_id, organization_id, reason_code, private_note, decided_by_user_id
) values (
  '20000000-0000-4000-8000-000000000016',
  '22222222-2222-4222-8222-222222222222',
  'could_not_verify',
  'No matching record in the alumni roster. Asked the registrar to confirm before a second attempt.',
  '10000000-0000-4000-8000-000000000009'
);

-- A member who has scheduled account deletion but is still inside the grace
-- window, so the account remains readable until the worker runs.
update public.users
set account_state = 'deletion_scheduled',
    delete_scheduled_for = now() + interval '25 days',
    delete_reason = 'Stepping back from alumni channels for a while.'
where id = '10000000-0000-4000-8000-000000000018';

-- Every admin role in the schema is now held by someone. super_admin already
-- belongs to Amy in organization one; the rest sit in Chadwick International so
-- the original organization-one cast keeps its existing permissions.
insert into public.admin_role_assignments (
  organization_id, organization_membership_id, role, granted_by_membership_id
) values
  ('22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000009', 'admin', null),
  ('22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000010', 'event_moderator', '20000000-0000-4000-8000-000000000009'),
  ('22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000008', 'ambassador', '20000000-0000-4000-8000-000000000009');

-- Profile depth. The original seed left experiences, education, and skills
-- completely empty, so every profile rendered from the flat columns alone.
--
-- These rows stay on Chadwick International members on purpose. Organization
-- one is the fixture the pgTAP suite asserts against, and its Home recognition
-- and career-history projections are sensitive to how many roles a member has.
insert into public.profile_experiences (
  user_id, employer, title, start_year, end_year, description, sort_order
) values
  ('10000000-0000-4000-8000-000000000010', 'Meridian Partners', 'Director', 2021, null, 'Project finance for transport and energy assets.', 0),
  ('10000000-0000-4000-8000-000000000010', 'Standard Chartered', 'Associate', 2016, 2021, 'Infrastructure lending across West Africa.', 1),
  ('10000000-0000-4000-8000-000000000011', 'The Atlantic Review', 'Staff Writer', 2020, null, 'Climate and cities desk.', 0),
  ('10000000-0000-4000-8000-000000000011', 'Songdo Daily', 'Reporter', 2018, 2020, 'General assignment reporting.', 1),
  ('10000000-0000-4000-8000-000000000013', 'Northwind', 'Design Lead', 2022, null, 'Design systems and platform surfaces.', 0),
  ('10000000-0000-4000-8000-000000000009', 'Chadwick International', 'Alumni Relations Lead', 2019, null, 'Alumni programming across the global chapters.', 0);

insert into public.profile_education (
  user_id, school, degree, field, start_year, end_year, sort_order
) values
  ('10000000-0000-4000-8000-000000000009', 'Seoul National University', 'B.A.', 'Communications', 2009, 2013, 0),
  ('10000000-0000-4000-8000-000000000010', 'London School of Economics', 'B.Sc.', 'Finance', 2014, 2017, 0),
  ('10000000-0000-4000-8000-000000000011', 'Columbia University', 'B.A.', 'Journalism', 2016, 2020, 0),
  ('10000000-0000-4000-8000-000000000013', 'IE University', 'B.A.', 'Design', 2015, 2019, 0);

insert into public.profile_skills (user_id, name, normalized_name, sort_order) values
  ('10000000-0000-4000-8000-000000000010', 'Project finance', 'project finance', 0),
  ('10000000-0000-4000-8000-000000000010', 'Credit analysis', 'credit analysis', 1),
  ('10000000-0000-4000-8000-000000000011', 'Reporting', 'reporting', 0),
  ('10000000-0000-4000-8000-000000000013', 'Design systems', 'design systems', 0);

-- Helper availability, including the two pause paths the fixture never showed:
-- a manual pause and the three-strike unresponsive auto-pause.
insert into public.helper_preferences (
  organization_membership_id, organization_id, open_to_help,
  max_pending_requests, consecutive_timeouts, paused_at, pause_reason
) values
  ('20000000-0000-4000-8000-000000000010', '22222222-2222-4222-8222-222222222222', true, 5, 0, null, null),
  ('20000000-0000-4000-8000-000000000013', '22222222-2222-4222-8222-222222222222', true, 10, 1, null, null),
  ('20000000-0000-4000-8000-000000000011', '22222222-2222-4222-8222-222222222222', false, 5, 0, now() - interval '9 days', 'manual'),
  ('20000000-0000-4000-8000-000000000012', '22222222-2222-4222-8222-222222222222', false, 5, 3, now() - interval '3 days', 'unresponsive'),
  ('20000000-0000-4000-8000-000000000018', '22222222-2222-4222-8222-222222222222', false, 5, 0, now() - interval '30 days', 'admin');

insert into public.helper_topics (
  organization_membership_id, organization_id, name, normalized_name, sort_order
) values
  ('20000000-0000-4000-8000-000000000010', '22222222-2222-4222-8222-222222222222', 'Project finance', 'project finance', 0),
  ('20000000-0000-4000-8000-000000000010', '22222222-2222-4222-8222-222222222222', 'Working abroad', 'working abroad', 1),
  ('20000000-0000-4000-8000-000000000011', '22222222-2222-4222-8222-222222222222', 'Journalism', 'journalism', 0),
  ('20000000-0000-4000-8000-000000000012', '22222222-2222-4222-8222-222222222222', 'Research careers', 'research careers', 0),
  ('20000000-0000-4000-8000-000000000013', '22222222-2222-4222-8222-222222222222', 'Design', 'design', 0);

-- Rooms for the Ask states below that require a conversation. All three pairs
-- are Chadwick International members, so organization one's Messages graph is
-- untouched.
insert into public.conversations (id, user_a_id, user_b_id, created_at) values
  ('50000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000010', now() - interval '4 days'),
  ('50000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000013', now() - interval '18 days'),
  ('50000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000014', now() - interval '6 days');

-- Noah holds five active Asks, which is exactly the slot cap, so the sixth must
-- be refused by the command layer rather than silently accepted. The at-cap
-- member is a Chadwick International member on purpose: organization one's
-- askers are used by the idempotency tests, which need spare capacity.
insert into public.asks (
  id, organization_id, asker_membership_id, kind, status,
  recipient_membership_id, question, request_message, reach,
  anonymous_until_accepted, client_request_id, expires_at, created_at
) values
  ('30000000-0000-4000-8000-000000000018', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000014', 'direct', 'waiting', '20000000-0000-4000-8000-000000000010', 'How did you decide where to start after graduating abroad?', 'I am the first in my family to job hunt outside Korea and would value any footing.', null, false, '30000000-0000-4000-8000-000000000118', now() + interval '11 days', now() - interval '3 days'),
  ('30000000-0000-4000-8000-000000000021', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000014', 'direct', 'waiting', '20000000-0000-4000-8000-000000000009', 'Is there a chapter near Boston I should introduce myself to?', 'Moving there in September and would rather not arrive knowing nobody.', null, false, '30000000-0000-4000-8000-000000000121', now() + interval '12 days', now() - interval '2 days'),
  ('30000000-0000-4000-8000-000000000022', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000008', 'direct', 'waiting', '20000000-0000-4000-8000-000000000010', 'How do you keep a chapter going when everyone travels?', 'Any structure that survived contact with reality would help.', null, false, '30000000-0000-4000-8000-000000000122', now() + interval '13 days', now() - interval '1 day'),
  ('30000000-0000-4000-8000-000000000023', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000014', 'circle', 'open', null, 'Has anyone gone straight into research after graduating?', null, 'matched', false, '30000000-0000-4000-8000-000000000123', now() + interval '10 days', now() - interval '4 days'),
  ('30000000-0000-4000-8000-000000000024', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000014', 'direct', 'waiting', '20000000-0000-4000-8000-000000000008', 'Would you look at a one-page summary before I send it?', 'It is short. Ten minutes at most.', null, false, '30000000-0000-4000-8000-000000000124', now() + interval '9 days', now() - interval '6 hours');

insert into public.asks (
  id, organization_id, asker_membership_id, kind, status,
  recipient_membership_id, question, request_message, reach,
  anonymous_until_accepted, client_request_id, accepted_at, responded_at,
  conversation_id, expires_at, created_at
) values (
  '30000000-0000-4000-8000-000000000019',
  '22222222-2222-4222-8222-222222222222',
  '20000000-0000-4000-8000-000000000014',
  'direct', 'accepted',
  '20000000-0000-4000-8000-000000000013',
  'Could you look at my portfolio before I send it out?',
  'It is rough, but I would rather hear that now than later.',
  null, false,
  '30000000-0000-4000-8000-000000000119',
  now() - interval '6 days', now() - interval '6 days',
  '50000000-0000-4000-8000-000000000008',
  now() + interval '7 days', now() - interval '7 days'
);

-- The three direct terminal states the fixture never reached.
insert into public.asks (
  id, organization_id, asker_membership_id, kind, status,
  recipient_membership_id, question, request_message, reach,
  anonymous_until_accepted, client_request_id, decline_reason_code, decline_note,
  closure_reason, responded_at, ended_at, expires_at, created_at
) values
  ('30000000-0000-4000-8000-000000000010', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000008', 'direct', 'declined', '20000000-0000-4000-8000-000000000010', 'Could you look over how I am framing a market map?', 'A quick sanity check on the structure would help.', null, false, '30000000-0000-4000-8000-000000000110', 'unavailable', 'Travelling for the next few weeks — please do ask again in the spring.', null, now() - interval '9 days', now() - interval '9 days', now() + interval '5 days', now() - interval '11 days'),
  ('30000000-0000-4000-8000-000000000011', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000008', 'direct', 'retracted', '20000000-0000-4000-8000-000000000009', 'Who runs the alumni mentoring programme these days?', 'No rush at all on this one.', null, false, '30000000-0000-4000-8000-000000000111', null, null, null, null, now() - interval '13 days', now() + interval '1 day', now() - interval '15 days'),
  ('30000000-0000-4000-8000-000000000012', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000008', 'direct', 'closed', '20000000-0000-4000-8000-000000000013', 'Would you be open to a short conversation about design hiring?', 'Twenty minutes would be plenty.', null, false, '30000000-0000-4000-8000-000000000112', null, null, 'silence_timeout', null, now() - interval '1 day', now() - interval '15 days' + interval '14 days', now() - interval '15 days');

-- Circle Asks across accepted, resolved, retracted, closed, and the
-- organization-wide reach that no fixture row used before.
insert into public.asks (
  id, organization_id, asker_membership_id, kind, status,
  recipient_membership_id, question, request_message, reach,
  anonymous_until_accepted, client_request_id, closure_reason, accepted_at,
  responded_at, ended_at, outcome_note, conversation_id, expires_at, created_at
) values
  -- Asks 13 and 14 are inserted open and transitioned below. A circle Ask
  -- resolves its conversation counterpart through the accepted offer, so the
  -- offer has to exist before the Ask can carry a conversation.
  ('30000000-0000-4000-8000-000000000013', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000010', 'circle', 'open', null, 'Who has taken a team through its first infrastructure diligence?', null, 'matched', false, '30000000-0000-4000-8000-000000000113', null, null, null, null, null, null, now() + interval '9 days', now() - interval '5 days'),
  ('30000000-0000-4000-8000-000000000014', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000013', 'circle', 'open', null, 'Has anyone moved from consulting into an operating role?', null, 'matched', false, '30000000-0000-4000-8000-000000000114', null, null, null, null, null, null, now() - interval '6 days', now() - interval '20 days'),
  ('30000000-0000-4000-8000-000000000015', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000009', 'circle', 'retracted', null, 'Is anyone hiring a product designer in Seoul this quarter?', null, 'matched', true, '30000000-0000-4000-8000-000000000115', null, null, null, now() - interval '7 days', null, null, now() + interval '3 days', now() - interval '10 days'),
  -- Ask 16 is inserted open and closed below, because an offer can only be
  -- created against an open Ask. The timeout closes both together.
  ('30000000-0000-4000-8000-000000000016', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000009', 'circle', 'open', null, 'Would anyone review a programme plan before I send it to the board?', null, 'organization', false, '30000000-0000-4000-8000-000000000116', null, null, null, null, null, null, now() - interval '2 days', now() - interval '16 days'),
  ('30000000-0000-4000-8000-000000000017', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000011', 'circle', 'open', null, 'Has anyone here relocated a whole team between offices?', null, 'organization', false, '30000000-0000-4000-8000-000000000117', null, null, null, null, null, null, now() + interval '12 days', now() - interval '2 days');

-- Circle offers in all four states. The whole table was empty before, so the
-- offer inbox, the accept path, and both terminal paths had nothing to render.
insert into public.ask_offers (
  id, organization_id, ask_id, helper_membership_id, status, offer_note,
  decline_reason_code, decline_note, closure_reason, client_request_id,
  responded_at, closed_at, created_at
) values
  ('35000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', '30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000010', 'pending', 'I moved into climate finance from a standing start. Ask me anything.', null, null, null, '35000000-0000-4000-8000-000000000101', null, null, now() - interval '6 hours'),
  ('35000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', '30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000009', 'declined', 'I could introduce you to two people rather than answer this myself.', 'went_another_direction', 'Thank you — I ended up taking Daniel up on a longer conversation.', null, '35000000-0000-4000-8000-000000000102', now() - interval '4 hours', now() - interval '4 hours', now() - interval '8 hours'),
  ('35000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', '30000000-0000-4000-8000-000000000013', '20000000-0000-4000-8000-000000000009', 'accepted', 'I have taken two teams through a first diligence. Glad to compare notes.', null, null, null, '35000000-0000-4000-8000-000000000103', now() - interval '4 days', null, now() - interval '5 days'),
  ('35000000-0000-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', '30000000-0000-4000-8000-000000000014', '20000000-0000-4000-8000-000000000008', 'accepted', 'I made this exact move in 2021 and remember the messy parts well.', null, null, null, '35000000-0000-4000-8000-000000000104', now() - interval '18 days', null, now() - interval '19 days'),
  ('35000000-0000-4000-8000-000000000005', '22222222-2222-4222-8222-222222222222', '30000000-0000-4000-8000-000000000016', '20000000-0000-4000-8000-000000000010', 'pending', 'Happy to read it this week if that is still useful.', null, null, null, '35000000-0000-4000-8000-000000000105', null, null, now() - interval '12 days');

-- Now that the accepted offers exist, move the two circle Asks through the same
-- transitions the product would apply: open to accepted, then accepted to
-- resolved. Doing it in steps keeps each state legal on the way through.
update public.asks
set status = 'accepted',
    accepted_at = now() - interval '4 days',
    responded_at = now() - interval '4 days',
    conversation_id = '50000000-0000-4000-8000-000000000006'
where id = '30000000-0000-4000-8000-000000000013';

update public.asks
set status = 'accepted',
    accepted_at = now() - interval '18 days',
    responded_at = now() - interval '18 days',
    conversation_id = '50000000-0000-4000-8000-000000000007'
where id = '30000000-0000-4000-8000-000000000014';

update public.asks
set status = 'resolved',
    ended_at = now() - interval '15 days',
    outcome_note = 'A much clearer picture of what the first ninety days actually demand.'
where id = '30000000-0000-4000-8000-000000000014';

-- The silence timeout closes Ask 16 and takes its outstanding offer with it.
update public.asks
set status = 'closed',
    closure_reason = 'silence_timeout',
    ended_at = now() - interval '2 days'
where id = '30000000-0000-4000-8000-000000000016';

update public.ask_offers
set status = 'closed',
    closure_reason = 'ask_closed',
    closed_at = now() - interval '2 days'
where id = '35000000-0000-4000-8000-000000000005';

-- Invites in all four states, so the admin invite table is not an empty screen.
insert into public.invites (
  id, organization_id, email, email_normalized, token_hash, status, full_name,
  graduation_year, sent_by_membership_id, accepted_by_user_id, accepted_at,
  expires_at, created_at
) values
  ('36000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Rosa.Delgado@example.com', 'rosa.delgado@example.com', extensions.digest('seed:invite:pending:rosa', 'sha256'), 'pending', 'Rosa Delgado', 2016, '20000000-0000-4000-8000-000000000001', null, null, now() + interval '10 days', now() - interval '4 days'),
  ('36000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'taylor@example.com', 'taylor@example.com', extensions.digest('seed:invite:accepted:taylor', 'sha256'), 'accepted', 'Taylor Reed', 2018, '20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000008', now() - interval '90 days', now() - interval '76 days', now() - interval '95 days'),
  ('36000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 'jae.whitlock@example.com', 'jae.whitlock@example.com', extensions.digest('seed:invite:expired:jae', 'sha256'), 'expired', 'Jae Whitlock', 2014, '20000000-0000-4000-8000-000000000009', null, null, now() - interval '6 days', now() - interval '20 days'),
  ('36000000-0000-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', 'sent.in.error@example.com', 'sent.in.error@example.com', extensions.digest('seed:invite:revoked:error', 'sha256'), 'revoked', null, null, '20000000-0000-4000-8000-000000000009', null, null, now() + interval '3 days', now() - interval '8 days');

-- Chadwick International events. The alumni base is global, so the calendar is
-- deliberately spread across Songdo, New York, London, and online, and includes
-- the draft state the fixture never carried.
insert into public.events (
  id, organization_id, created_by_membership_id, status, slug, category, title,
  summary, description, format, time_zone, campus, location, location_name,
  location_address, maps_url, join_url, host_name, starts_at, ends_at, capacity,
  published_at, cancelled_at, cancellation_note, changed_at, change_note
) values
  ('eeee0000-0000-4000-8000-000000000006', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000009', 'published', 'songdo-homecoming', 'Reunion', 'Homecoming weekend on the Songdo campus', 'Two days back on campus for every class since the first.', E'The campus opens for the weekend with tours, a shared lunch, and time in the buildings that changed since you left.\n\nFamilies are welcome. Most people come for part of it rather than all of it.', 'in_person', 'Asia/Seoul', 'songdo', 'Chadwick International', 'Chadwick International', '45 Art center-daero, Yeonsu-gu, Incheon', 'https://maps.google.com/?q=Chadwick+International+Songdo', null, 'the Alumni Office', now() + interval '60 days', now() + interval '61 days', 200, now() - interval '5 days', null, null, null, null),
  ('eeee0000-0000-4000-8000-000000000007', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000009', 'published', 'new-york-dinner', 'Dinner', 'New York alumni dinner', 'A long table for the East Coast contingent.', 'One table, one room, and enough time to actually talk. The chapter has grown enough that this now fills up.', 'in_person', 'America/New_York', 'other', 'Bar Sixty', 'Bar Sixty', '60 Prince St, New York, NY', 'https://maps.google.com/?q=Prince+St+New+York', null, 'Sofia Alvarez', now() + interval '21 days', now() + interval '21 days 3 hours', 2, now() - interval '9 days', null, null, null, null),
  ('eeee0000-0000-4000-8000-000000000008', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000009', 'published', 'london-coffee', 'Social', 'London coffee morning', 'An informal Saturday morning for the UK and Europe group.', 'No programme. Someone brings a table number and the rest sorts itself out.', 'in_person', 'Europe/London', 'other', 'Rosemary Lane Coffee', 'Rosemary Lane Coffee', '18 Rosemary Ln, London', 'https://maps.google.com/?q=Rosemary+Lane+London', null, 'Daniel Okafor', now() + interval '14 days', now() + interval '14 days 2 hours', null, now() - interval '12 days', null, null, null, null),
  ('eeee0000-0000-4000-8000-000000000009', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000009', 'published', 'global-town-hall', 'Conversation', 'Global town hall', 'One online hour scheduled so Asia, Europe, and the US can all make it.', 'A short update from the school, then questions. The recording goes out afterwards for whoever could not make the hour work.', 'online', 'Asia/Seoul', 'online', null, null, null, null, 'https://meet.example.com/chadwick-international-town-hall', 'Nadia Haddad', now() + interval '7 days', now() + interval '7 days 1 hour', null, now() - interval '14 days', null, null, null, null),
  -- A draft still being planned. Note that the schema forces a venue even on a
  -- draft: events_format_location_check requires location_name for in_person,
  -- so "date and venue not chosen yet" is not actually representable.
  ('eeee0000-0000-4000-8000-000000000010', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000009', 'draft', 'singapore-meetup', 'Social', 'Singapore meetup', 'Being planned for the Southeast Asia group.', 'Still choosing between two dates. Not visible to members until it is published.', 'in_person', 'Asia/Singapore', 'other', 'Venue to be confirmed', 'Venue to be confirmed', null, null, null, 'Wei Zhang', now() + interval '75 days', now() + interval '75 days 3 hours', 30, null, null, null, null, null);

-- All four RSVP states. The New York dinner seats two and already has one
-- confirmed guest, so a waitlist and a live held offer are the realistic shape.
insert into public.event_rsvps (
  organization_id, event_id, organization_membership_id, status,
  offered_at, offer_expires_at
) values
  ('22222222-2222-4222-8222-222222222222', 'eeee0000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000013', 'going', null, null),
  ('22222222-2222-4222-8222-222222222222', 'eeee0000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000014', 'going', null, null),
  ('22222222-2222-4222-8222-222222222222', 'eeee0000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000011', 'going', null, null),
  ('22222222-2222-4222-8222-222222222222', 'eeee0000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000009', 'waitlisted', null, null),
  ('22222222-2222-4222-8222-222222222222', 'eeee0000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000013', 'offered', now() - interval '6 hours', now() + interval '18 hours'),
  ('22222222-2222-4222-8222-222222222222', 'eeee0000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000010', 'not_going', null, null),
  ('22222222-2222-4222-8222-222222222222', 'eeee0000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000010', 'going', null, null),
  ('22222222-2222-4222-8222-222222222222', 'eeee0000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000009', 'going', null, null),
  ('22222222-2222-4222-8222-222222222222', 'eeee0000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000012', 'not_going', null, null);

insert into public.event_schedule_items (organization_id, event_id, position, starts_at, label) values
  ('22222222-2222-4222-8222-222222222222', 'eeee0000-0000-4000-8000-000000000006', 0, now() + interval '60 days', 'Campus tours'),
  ('22222222-2222-4222-8222-222222222222', 'eeee0000-0000-4000-8000-000000000006', 1, now() + interval '60 days 3 hours', 'Shared lunch'),
  ('22222222-2222-4222-8222-222222222222', 'eeee0000-0000-4000-8000-000000000006', 2, now() + interval '61 days', 'Closing morning');

insert into public.event_facts (
  organization_id, event_id, position, label, value, link_label, link_url
) values
  ('22222222-2222-4222-8222-222222222222', 'eeee0000-0000-4000-8000-000000000006', 0, 'Travel', 'Incheon Airport is forty minutes by taxi', null, null),
  ('22222222-2222-4222-8222-222222222222', 'eeee0000-0000-4000-8000-000000000006', 1, 'Cost', 'Free for alumni, guests welcome', null, null),
  ('22222222-2222-4222-8222-222222222222', 'eeee0000-0000-4000-8000-000000000007', 0, 'Cost', 'Split the table, roughly $60 each', null, null);

-- Chadwick International announcements, including the draft and archived states.
insert into public.announcements (
  id, organization_id, author_membership_id, status, tag, title, summary,
  body, pinned, published_at
) values
  ('aaaa0000-0000-4000-8000-000000000005', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000009', 'published', 'reunion', 'Homecoming weekend is open for registration', 'Two days on the Songdo campus for every class since the first.', E'Registration is open and the campus is ours for the weekend.\n\nIf you are travelling from outside Korea, the alumni office can help with a letter for your visa application.', true, now() - interval '5 days'),
  ('aaaa0000-0000-4000-8000-000000000006', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000009', 'published', 'general', 'Chapter leads for New York and London', 'Two alumni have volunteered to host regular gatherings.', 'Sofia is hosting in New York and Daniel in London. Both are happy to hear from anyone passing through.', false, now() - interval '11 days'),
  ('aaaa0000-0000-4000-8000-000000000007', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000009', 'draft', 'hiring', 'Summer internship listings', 'Still gathering roles before this goes out.', 'A draft the alumni office has not published yet. Members must not see this.', false, null),
  ('aaaa0000-0000-4000-8000-000000000008', '22222222-2222-4222-8222-222222222222', '20000000-0000-4000-8000-000000000009', 'archived', 'general', 'Last year''s campus construction notice', 'Kept for the record after the work finished.', 'The east wing work finished in the spring. This notice is retained but no longer current.', false, now() - interval '300 days');

insert into public.announcement_reads (
  organization_id, announcement_id, organization_membership_id, read_at
) values
  ('22222222-2222-4222-8222-222222222222', 'aaaa0000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000013', now() - interval '10 days'),
  ('22222222-2222-4222-8222-222222222222', 'aaaa0000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000010', now() - interval '9 days');

insert into public.newsletter_issues (
  id, organization_id, slug, issue_number, status, title, summary, published_at
) values
  ('bbbb0000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 'international-july-2026', 6, 'published', 'The Songdo Letter · July 2026', 'Chapter news from four cities and one campus.', now() - interval '6 days'),
  ('bbbb0000-0000-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', 'international-august-2026', 7, 'draft', 'The Songdo Letter · August 2026', 'In progress, not yet sent.', null);

insert into public.newsletter_sections (
  organization_id, issue_id, position, heading, body, link_label, link_url
) values
  ('22222222-2222-4222-8222-222222222222', 'bbbb0000-0000-4000-8000-000000000003', 0, 'Four cities, one weekend', 'Chapters in New York, London, Singapore, and Seoul all met within the same fortnight, which has never happened before.', null, null),
  ('22222222-2222-4222-8222-222222222222', 'bbbb0000-0000-4000-8000-000000000003', 1, 'Homecoming is open', 'Registration for the Songdo weekend is live, and the alumni office can help with travel letters.', 'Register for homecoming', 'https://bridgecircle.org/school'),
  ('22222222-2222-4222-8222-222222222222', 'bbbb0000-0000-4000-8000-000000000004', 0, 'Draft opening', 'This issue is unfinished and must not appear on the member-facing archive.', null, null);

-- Notifications. The table was entirely empty, so the bell, the unread badge,
-- and the read and unread rows all had nothing behind them.
insert into public.notifications (
  recipient_user_id, organization_id, actor_user_id, type, target_type,
  target_id, payload, dedupe_key, read_at, created_at
) values
  ('10000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000000003', 'connection_requested', 'connection_request', '40000000-0000-4000-8000-000000000001', '{"actorName":"Mark Chen"}'::jsonb, 'seed:connection_requested:mark-richard', null, now() - interval '20 minutes'),
  ('10000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000000005', 'connection_requested', 'connection_request', '40000000-0000-4000-8000-000000000002', '{"actorName":"Sam Rivera"}'::jsonb, 'seed:connection_requested:sam-richard', null, now() - interval '10 minutes'),
  ('10000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000000006', 'message_received', 'conversation', '50000000-0000-4000-8000-000000000002', '{"actorName":"Jordan Kim"}'::jsonb, 'seed:message_received:jordan-richard', null, now() - interval '40 minutes'),
  ('10000000-0000-4000-8000-000000000008', '22222222-2222-4222-8222-222222222222', '10000000-0000-4000-8000-000000000010', 'offer_received', 'offer', '35000000-0000-4000-8000-000000000001', '{"actorName":"Daniel Okafor"}'::jsonb, 'seed:offer_received:daniel-taylor', null, now() - interval '6 hours'),
  ('10000000-0000-4000-8000-000000000008', '22222222-2222-4222-8222-222222222222', '10000000-0000-4000-8000-000000000010', 'ask_declined', 'ask', '30000000-0000-4000-8000-000000000010', '{"actorName":"Daniel Okafor"}'::jsonb, 'seed:ask_declined:daniel-taylor', now() - interval '8 days', now() - interval '9 days'),
  ('10000000-0000-4000-8000-000000000008', '22222222-2222-4222-8222-222222222222', null, 'ask_closed', 'ask', '30000000-0000-4000-8000-000000000012', '{"reason":"silence_timeout"}'::jsonb, 'seed:ask_closed:taylor-elena', null, now() - interval '1 day'),
  ('10000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000000001', 'announcement_published', 'announcement', 'aaaa0000-0000-4000-8000-000000000001', '{"title":"Reunion weekend dates are set"}'::jsonb, 'seed:announcement_published:reunion', now() - interval '1 day', now() - interval '2 days'),
  ('10000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', null, 'event_cancelled', 'event', 'eeee0000-0000-4000-8000-000000000004', '{"title":"A walk through the new campus spaces"}'::jsonb, 'seed:event_cancelled:campus-walk', null, now() - interval '2 days'),
  ('10000000-0000-4000-8000-000000000014', '22222222-2222-4222-8222-222222222222', '10000000-0000-4000-8000-000000000013', 'ask_accepted', 'ask', '30000000-0000-4000-8000-000000000019', '{"actorName":"Elena Castro-Villanueva de la Fuente"}'::jsonb, 'seed:ask_accepted:elena-noah', null, now() - interval '6 days'),
  ('10000000-0000-4000-8000-000000000010', '22222222-2222-4222-8222-222222222222', '10000000-0000-4000-8000-000000000014', 'ask_received', 'ask', '30000000-0000-4000-8000-000000000018', '{"actorName":"Noah Bennett"}'::jsonb, 'seed:ask_received:noah-daniel', null, now() - interval '3 days');

-- A member who has turned some email off but kept it in-app.
insert into public.notification_preferences (
  user_id, notification_type, in_app_enabled, email_enabled
) values
  ('10000000-0000-4000-8000-000000000002', 'message_received', true, false),
  ('10000000-0000-4000-8000-000000000002', 'announcement_published', true, false),
  ('10000000-0000-4000-8000-000000000002', 'ask_reminder', true, true),
  ('10000000-0000-4000-8000-000000000012', 'ask_received', false, false),
  ('10000000-0000-4000-8000-000000000012', 'circle_ask_match', false, false);
