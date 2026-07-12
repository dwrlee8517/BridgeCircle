-- =============================================================================
-- Local/CI seed — the deterministic world for local development and E2E.
--
-- Applied automatically by `supabase db reset` (see [db.seed] in config.toml).
-- NEVER run against a remote project: this file assumes a freshly-migrated,
-- empty database and inserts directly into the auth schema. The remote
-- bridgecircle-dev project is seeded by scripts/seed-dev.ts instead.
--
-- The cast of personas mirrors scripts/seed-dev.ts so both worlds stay
-- recognizable. Every id is deterministic so specs can reference rows
-- directly:
--   users        1000000-...-00NN   memberships  20000000-...-00NN
--   asks         30000000-...-00NN  ask_threads  40000000-...-00NN
--   dm threads   50000000-...-00NN  events       eeee0000-...-000N
--
-- Passwords are devseed-password-<n> / devseed-password-<name>, same as
-- seed-dev.ts. Sign in as richard@example.com / devseed-password-richard
-- for the richest home feed.
--
-- Auth rows are inserted directly (not via the admin API), so the
-- on_auth_user_created trigger fires exactly as it does for real sign-ups
-- and creates the public.users shadow rows. The token columns are set to ''
-- (not null) — GoTrue scans them as strings and errors on null.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Organization
-- ---------------------------------------------------------------------------

insert into public.organizations (id, name, slug) values
  ('11111111-1111-1111-1111-111111111111', 'Chadwick School (Local)', 'chadwick-local');

-- ---------------------------------------------------------------------------
-- Auth users (+ identities). The trigger creates public.users rows.
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000',
  p.id, 'authenticated', 'authenticated', p.email,
  extensions.crypt(p.password, extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', p.full_name),
  now(), now(), '', '', '', ''
from (values
  ('10000000-0000-4000-8000-000000000001'::uuid, 'admin-amy@example.com',           'devseed-password-1',         'Amy Admin'),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'mentor-mark@example.com',         'devseed-password-2',         'Mark Mentor'),
  ('10000000-0000-4000-8000-000000000003'::uuid, 'mentor-mei@example.com',          'devseed-password-3',         'Mei Mentor'),
  ('10000000-0000-4000-8000-000000000004'::uuid, 'mentor-fully-booked@example.com', 'devseed-password-4',         'Felix Atcapacity'),
  ('10000000-0000-4000-8000-000000000005'::uuid, 'mentor-paused@example.com',       'devseed-password-5',         'Paula Paused'),
  ('10000000-0000-4000-8000-000000000006'::uuid, 'student-sam@example.com',         'devseed-password-6',         'Sam Student'),
  ('10000000-0000-4000-8000-000000000007'::uuid, 'recent-grad-ria@example.com',     'devseed-password-7',         'Ria Recent'),
  ('10000000-0000-4000-8000-000000000008'::uuid, 'recent-grad-rohan@example.com',   'devseed-password-8',         'Rohan Recent'),
  ('10000000-0000-4000-8000-000000000009'::uuid, 'incomplete-iris@example.com',     'devseed-password-9',         'Iris Incomplete'),
  ('10000000-0000-4000-8000-000000000010'::uuid, 'richard@example.com',             'devseed-password-richard',   'Richard Lee'),
  ('10000000-0000-4000-8000-000000000011'::uuid, 'alexander@example.com',           'devseed-password-alexander', 'Alexander Kim'),
  ('10000000-0000-4000-8000-000000000012'::uuid, 'iris@example.com',                'devseed-password-iris',      'Iris Okonkwo'),
  ('10000000-0000-4000-8000-000000000013'::uuid, 'dev@example.com',                 'devseed-password-dev',       'Dev Patel'),
  ('10000000-0000-4000-8000-000000000014'::uuid, 'sarah@example.com',               'devseed-password-sarah',     'Sarah Lee'),
  ('10000000-0000-4000-8000-000000000015'::uuid, 'jessica@example.com',             'devseed-password-jessica',   'Dr. Jessica Wong')
) as p(id, email, password, full_name);

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id::text, u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  'email', now(), now(), now()
from auth.users u;

-- Everyone in the seed is past onboarding.
update public.users set onboarding_completed_at = now();

-- ---------------------------------------------------------------------------
-- Base profiles
-- ---------------------------------------------------------------------------

insert into public.base_profiles
  (user_id, name, current_employer, current_title, city, university, major,
   linkedin_url, career_history, education_history, skills)
values
  ('10000000-0000-4000-8000-000000000001', 'Amy Admin', 'Chadwick School', 'Alumni Board Chair', 'Palos Verdes, CA', 'Stanford University', 'Public Policy',
   'https://linkedin.com/in/amy-admin-chadwick',
   '[{"employer":"Chadwick School","title":"Alumni Board Chair","start_date":"2020","end_date":null,"description":"Volunteer role coordinating alumni engagement and the annual giving campaign."},
     {"employer":"Bain & Company","title":"Senior Manager","start_date":"2010","end_date":"2020","description":"Public sector and education practice."}]'::jsonb,
   '[{"school":"Stanford University","degree":"AB","field":"Public Policy","start_date":"2001","end_date":"2005"}]'::jsonb,
   array['nonprofit governance','fundraising','public policy','community organizing']),
  ('10000000-0000-4000-8000-000000000002', 'Mark Mentor', 'Acme Consulting', 'Senior Partner', 'San Francisco, CA', 'University of Pennsylvania', 'Economics',
   'https://linkedin.com/in/mark-mentor-acme',
   '[{"employer":"Acme Consulting","title":"Senior Partner","start_date":"2018","end_date":null,"description":"Lead the financial services practice; advising on growth strategy and M&A."},
     {"employer":"McKinsey & Company","title":"Engagement Manager","start_date":"2014","end_date":"2018","description":"Strategy projects across consumer and financial services clients."},
     {"employer":"McKinsey & Company","title":"Business Analyst","start_date":"2008","end_date":"2010","description":"Pre-MBA generalist role."}]'::jsonb,
   '[{"school":"Harvard Business School","degree":"MBA","field":null,"start_date":"2012","end_date":"2014"},
     {"school":"University of Pennsylvania","degree":"BA","field":"Economics","start_date":"2004","end_date":"2008"}]'::jsonb,
   array['strategy','consulting','financial modeling','M&A','business school']),
  ('10000000-0000-4000-8000-000000000003', 'Mei Mentor', 'Hyundai Motor', 'Product Director', 'Seoul, South Korea', 'Yonsei University', 'Industrial Engineering',
   'https://linkedin.com/in/mei-mentor-hyundai',
   -- Mei's past creative roles are the NL-search demo target ("photography
   -- mentor" should surface her despite the current PM title).
   '[{"employer":"Hyundai Motor","title":"Product Director","start_date":"2021","end_date":null,"description":"Lead the in-vehicle infotainment product team across global markets."},
     {"employer":"Kakao","title":"Senior Product Manager","start_date":"2018","end_date":"2021","description":"Owned the visual search and image-recognition product line."},
     {"employer":"Naver","title":"Product Designer","start_date":"2014","end_date":"2018","description":"Visual design and user research for Naver Photos and the camera app."},
     {"employer":"Vogue Korea","title":"Photo Editor","start_date":"2012","end_date":"2014","description":"Editorial photo selection and on-set art direction for fashion shoots."}]'::jsonb,
   '[{"school":"Yonsei University","degree":"BS","field":"Industrial Engineering","start_date":"2008","end_date":"2012"}]'::jsonb,
   array['product management','design systems','photo editing','art direction','visual search','Korean']),
  ('10000000-0000-4000-8000-000000000004', 'Felix Atcapacity', 'Goldman Sachs', 'VP, Equity Research', 'New York, NY', 'Harvard University', 'Mathematics',
   'https://linkedin.com/in/felix-atcapacity-gs',
   '[{"employer":"Goldman Sachs","title":"VP, Equity Research","start_date":"2018","end_date":null,"description":"Cover the US semiconductors sector."},
     {"employer":"Goldman Sachs","title":"Associate, Equity Research","start_date":"2014","end_date":"2018","description":null},
     {"employer":"JPMorgan Chase","title":"Investment Banking Analyst","start_date":"2010","end_date":"2012","description":"TMT coverage group."}]'::jsonb,
   '[{"school":"Columbia Business School","degree":"MBA","field":null,"start_date":"2012","end_date":"2014"},
     {"school":"Harvard University","degree":"AB","field":"Mathematics","start_date":"2006","end_date":"2010"}]'::jsonb,
   array['equity research','capital markets','semiconductors','financial modeling']),
  ('10000000-0000-4000-8000-000000000005', 'Paula Paused', 'Mass General Hospital', 'Attending Physician', 'Boston, MA', 'Johns Hopkins University', 'Biology',
   'https://linkedin.com/in/paula-paused-mgh',
   '[{"employer":"Mass General Hospital","title":"Attending Physician","start_date":"2017","end_date":null,"description":"Internal medicine, hospitalist track."},
     {"employer":"Johns Hopkins Hospital","title":"Resident Physician","start_date":"2014","end_date":"2017","description":null}]'::jsonb,
   '[{"school":"Johns Hopkins School of Medicine","degree":"MD","field":null,"start_date":"2010","end_date":"2014"},
     {"school":"Johns Hopkins University","degree":"BS","field":"Biology","start_date":"2005","end_date":"2009"}]'::jsonb,
   array['internal medicine','med school applications','clinical research']),
  ('10000000-0000-4000-8000-000000000006', 'Sam Student', 'UCLA', 'Senior, Computer Science', 'Los Angeles, CA', 'UCLA', 'Computer Science',
   'https://linkedin.com/in/sam-student-ucla', null,
   '[{"school":"UCLA","degree":"BS","field":"Computer Science","start_date":"2020","end_date":"2024"}]'::jsonb,
   array['python','data analysis','machine learning']),
  ('10000000-0000-4000-8000-000000000007', 'Ria Recent', 'Stripe', 'Software Engineer', 'San Francisco, CA', 'UC Berkeley', 'Computer Science',
   'https://linkedin.com/in/ria-recent-stripe',
   '[{"employer":"Stripe","title":"Software Engineer","start_date":"2022","end_date":null,"description":"Backend engineering on the payments platform."}]'::jsonb,
   '[{"school":"UC Berkeley","degree":"BS","field":"Computer Science","start_date":"2018","end_date":"2022"}]'::jsonb,
   array['typescript','distributed systems','payments']),
  ('10000000-0000-4000-8000-000000000008', 'Rohan Recent', 'Microsoft', 'Product Manager', 'Seattle, WA', 'University of Washington', 'Business Administration',
   'https://linkedin.com/in/rohan-recent-msft',
   '[{"employer":"Microsoft","title":"Product Manager","start_date":"2021","end_date":null,"description":"PM on Azure developer experience."}]'::jsonb,
   '[{"school":"University of Washington","degree":"BBA","field":"Business Administration","start_date":"2017","end_date":"2021"}]'::jsonb,
   array['product management','developer tools','cloud']),
  ('10000000-0000-4000-8000-000000000009', 'Iris Incomplete', null, null, null, null, null, null, null, null, null),
  ('10000000-0000-4000-8000-000000000010', 'Richard Lee', 'Common Capital', 'Investment Associate', 'San Francisco, CA', 'Stanford University', 'Computer Science',
   null, null, null, null),
  ('10000000-0000-4000-8000-000000000011', 'Alexander Kim', 'Toss', 'Financial Analyst', 'Seoul, Korea', 'Yonsei University', 'Business Administration',
   null, null, null, null),
  ('10000000-0000-4000-8000-000000000012', 'Iris Okonkwo', 'Common Capital', 'VP Investments', 'Brooklyn, NY', 'Harvard University', 'Economics',
   null, null, null, null),
  ('10000000-0000-4000-8000-000000000013', 'Dev Patel', 'Stripe', 'Data Scientist', 'San Francisco, CA', 'UC Berkeley', 'Data Science',
   null, null, null, null),
  ('10000000-0000-4000-8000-000000000014', 'Sarah Lee', 'Airbnb', 'Product Director', 'San Francisco, CA', 'Stanford University', 'Product Design',
   null, null, null, null),
  ('10000000-0000-4000-8000-000000000015', 'Dr. Jessica Wong', 'Mayo Clinic', 'Cardiologist', 'Chicago, IL', 'Harvard Medical School', 'Medicine',
   null, null, null, null);

-- ---------------------------------------------------------------------------
-- Memberships + org profiles
-- ---------------------------------------------------------------------------

insert into public.organization_memberships (id, user_id, organization_id, status, joined_at)
select m.id, m.user_id, '11111111-1111-1111-1111-111111111111', 'active', now()
from (values
  ('20000000-0000-4000-8000-000000000001'::uuid, '10000000-0000-4000-8000-000000000001'::uuid),
  ('20000000-0000-4000-8000-000000000002'::uuid, '10000000-0000-4000-8000-000000000002'::uuid),
  ('20000000-0000-4000-8000-000000000003'::uuid, '10000000-0000-4000-8000-000000000003'::uuid),
  ('20000000-0000-4000-8000-000000000004'::uuid, '10000000-0000-4000-8000-000000000004'::uuid),
  ('20000000-0000-4000-8000-000000000005'::uuid, '10000000-0000-4000-8000-000000000005'::uuid),
  ('20000000-0000-4000-8000-000000000006'::uuid, '10000000-0000-4000-8000-000000000006'::uuid),
  ('20000000-0000-4000-8000-000000000007'::uuid, '10000000-0000-4000-8000-000000000007'::uuid),
  ('20000000-0000-4000-8000-000000000008'::uuid, '10000000-0000-4000-8000-000000000008'::uuid),
  ('20000000-0000-4000-8000-000000000009'::uuid, '10000000-0000-4000-8000-000000000009'::uuid),
  ('20000000-0000-4000-8000-000000000010'::uuid, '10000000-0000-4000-8000-000000000010'::uuid),
  ('20000000-0000-4000-8000-000000000011'::uuid, '10000000-0000-4000-8000-000000000011'::uuid),
  ('20000000-0000-4000-8000-000000000012'::uuid, '10000000-0000-4000-8000-000000000012'::uuid),
  ('20000000-0000-4000-8000-000000000013'::uuid, '10000000-0000-4000-8000-000000000013'::uuid),
  ('20000000-0000-4000-8000-000000000014'::uuid, '10000000-0000-4000-8000-000000000014'::uuid),
  ('20000000-0000-4000-8000-000000000015'::uuid, '10000000-0000-4000-8000-000000000015'::uuid)
) as m(id, user_id);

insert into public.organization_profiles
  (organization_membership_id, graduation_year, bio, mentoring_topics, open_to_mentor)
values
  ('20000000-0000-4000-8000-000000000001', 2005, null, null, false),
  ('20000000-0000-4000-8000-000000000002', 2008, 'Open to ~30min calls with current students or recent grads.', array['consulting','career change','business school'], true),
  ('20000000-0000-4000-8000-000000000003', 2012, 'Happy to chat about the PM transition, relocating to Asia, or pivoting from creative roles into product.', array['product management','returning to Korea','engineering to PM'], true),
  ('20000000-0000-4000-8000-000000000004', 2010, 'Currently at max mentee capacity.', array['finance','investment banking'], true),
  ('20000000-0000-4000-8000-000000000005', 2009, 'Paused while away.', array['medicine','med school applications'], true),
  ('20000000-0000-4000-8000-000000000006', 2024, null, null, false),
  ('20000000-0000-4000-8000-000000000007', 2022, null, null, false),
  ('20000000-0000-4000-8000-000000000008', 2021, null, null, false),
  ('20000000-0000-4000-8000-000000000009', 2023, 'Profile intentionally left incomplete to test profile-completion prompts.', null, false),
  ('20000000-0000-4000-8000-000000000010', 2018, 'Alumnus Class of 2018. Focused on tech investing.', array['venture capital','tech careers'], true),
  ('20000000-0000-4000-8000-000000000011', 2022, 'Recent graduate interested in fintech strategy and banking transition paths.', null, false),
  ('20000000-0000-4000-8000-000000000012', 2011, 'Focusing on climate tech and seed-stage infrastructure underwriting.', array['Climate Tech','Fundraising'], true),
  ('20000000-0000-4000-8000-000000000013', 2021, 'Interested in machine learning and data engineering.', null, false),
  ('20000000-0000-4000-8000-000000000014', 2012, 'Leading product teams in hospitality and travel space.', null, false),
  ('20000000-0000-4000-8000-000000000015', 2008, 'Cardiologist interested in helping pre-med students.', array['medicine','cardiology'], true);

-- Helper availability (mirrors seed-dev: felix intentionally at capacity,
-- paula open-but-paused for the "paused while away" state).
insert into public.helper_preferences
  (organization_membership_id, open_to_advice, open_to_mentorship, topics,
   max_pending_requests, max_active_mentees, paused_at)
values
  ('20000000-0000-4000-8000-000000000002', true, true, array['consulting','career change','business school'], 5, 3, null),
  ('20000000-0000-4000-8000-000000000003', true, true, array['product management','returning to Korea','engineering to PM'], 10, 5, null),
  ('20000000-0000-4000-8000-000000000004', true, true, array['finance','investment banking'], 1, 1, null),
  ('20000000-0000-4000-8000-000000000005', true, true, array['medicine','med school applications'], 10, 5, now()),
  ('20000000-0000-4000-8000-000000000010', true, true, array['venture capital','tech careers'], 5, 3, null),
  ('20000000-0000-4000-8000-000000000012', true, true, array['Climate Tech','Fundraising'], 3, 5, null),
  ('20000000-0000-4000-8000-000000000015', true, true, array['medicine','cardiology'], 10, 5, null);

insert into public.admin_role_assignments (user_id, organization_id, role) values
  ('10000000-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', 'super_admin');

-- ---------------------------------------------------------------------------
-- Asks (incoming for the mentors + Richard's varied outgoing trio)
-- ---------------------------------------------------------------------------

insert into public.asks
  (id, organization_id, ask_type, asker_id, helper_id, reason, help_needed,
   status, created_at, responded_at)
values
  ('30000000-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', 'mentorship',
   '10000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002',
   'Trying to decide between consulting and product roles after graduation.',
   'Looking for a 30-min call about how to evaluate the two paths.',
   'pending', now(), null),
  ('30000000-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', 'mentorship',
   '10000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000003',
   'Considering a move from Stripe SF to a PM role in Korea.',
   'Want to talk about engineering -> PM transition and Seoul tech scene.',
   'accepted', now(), now()),
  ('30000000-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111', 'mentorship',
   '10000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000004',
   'Curious about transitioning from PM to investment banking.',
   'Open to a quick chat about whether the move makes sense.',
   'declined', now(), now()),
  ('30000000-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111', 'advice',
   '10000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000002',
   'Preparing for consulting interviews and need feedback on my resume format.',
   'Looking for a quick review of my consulting resume to make sure it highlights the right things.',
   'accepted', now(), now()),
  ('30000000-0000-4000-8000-000000000005', '11111111-1111-1111-1111-111111111111', 'advice',
   '10000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002',
   'How do you think about MBA programs for software engineers?',
   'Hoping to get advice on whether business school makes sense for tech.',
   'pending', now(), null),
  ('30000000-0000-4000-8000-000000000006', '11111111-1111-1111-1111-111111111111', 'mentorship',
   '10000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000010',
   'Hey Richard, I''m looking for a mentor to guide me through my transition from engineering to product management. I saw you made a similar move and would love to learn from your experience.',
   'Career transition advice',
   'pending', now() - interval '2 hours', null),
  ('30000000-0000-4000-8000-000000000007', '11111111-1111-1111-1111-111111111111', 'mentorship',
   '10000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000015',
   'Hi Dr. Wong, I''m a pre-med student at Cornell and would love to ask you a couple of questions about choosing cardiology as a specialty.',
   'Pre-med guidance',
   'pending', now() - interval '4 days', null),
  ('30000000-0000-4000-8000-000000000008', '11111111-1111-1111-1111-111111111111', 'advice',
   '10000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000002',
   'Sanity-checking my jump from engineering into product management.',
   'Would value 20 minutes on how to frame the transition for hiring managers.',
   'accepted', now() - interval '6 days', now() - interval '5 days'),
  ('30000000-0000-4000-8000-000000000009', '11111111-1111-1111-1111-111111111111', 'mentorship',
   '10000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000004',
   'Hoping to learn how you scaled a startup engineering team.',
   'Looking for an ongoing mentor as I move into a lead role.',
   'declined', now() - interval '9 days', now() - interval '8 days'),
  ('30000000-0000-4000-8000-000000000010', '11111111-1111-1111-1111-111111111111', 'advice',
   '10000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000010',
   'Portfolio Review & Framing',
   'Review my design critique slide deck outline',
   'accepted', now() - interval '24 hours', now() - interval '23 hours');

-- Threads for the accepted asks; thread NN matches its ask NN.
insert into public.ask_threads (id, ask_id, helper_id, asker_id, last_message_at)
values
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000007', now() - interval '12 hours'),
  ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000004',
   '10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000008', now() - interval '36 hours'),
  ('40000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000008',
   '10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000010', now() - interval '4 days'),
  ('40000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000010',
   '10000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000012', now() - interval '22 hours');

insert into public.messages (thread_id, thread_type, sender_id, body, created_at, read_at)
values
  -- Ria <> Mei (last message unread by Mei)
  ('40000000-0000-4000-8000-000000000002', 'ask', '10000000-0000-4000-8000-000000000007',
   'Hi Mei! Thank you so much for accepting my request. I''d love to talk about transitioning to product roles in Seoul.',
   now() - interval '36 hours', now() - interval '36 hours'),
  ('40000000-0000-4000-8000-000000000002', 'ask', '10000000-0000-4000-8000-000000000003',
   'Hi Ria! Yes, it''s a big move but super rewarding. I transitioned from photo editing at Vogue into product at Hyundai and Kakao. What questions do you have?',
   now() - interval '24 hours', now() - interval '24 hours'),
  ('40000000-0000-4000-8000-000000000002', 'ask', '10000000-0000-4000-8000-000000000007',
   'I''m curious about the work culture differences and if it''s necessary to speak fluent Korean in PM roles there.',
   now() - interval '12 hours', null),
  -- Rohan <> Mark
  ('40000000-0000-4000-8000-000000000004', 'ask', '10000000-0000-4000-8000-000000000008',
   'Hi Mark! Thanks for accepting my advice request. Here is a brief snippet of my background in tech.',
   now() - interval '48 hours', now() - interval '48 hours'),
  ('40000000-0000-4000-8000-000000000004', 'ask', '10000000-0000-4000-8000-000000000002',
   'Hey Rohan, happy to help. Send over a link to your resume or paste the key points here and I will take a look.',
   now() - interval '36 hours', now() - interval '36 hours'),
  -- Richard <> Mark
  ('40000000-0000-4000-8000-000000000008', 'ask', '10000000-0000-4000-8000-000000000002',
   'Hi Richard — glad to help with the PM move. Hiring managers mostly want evidence you can drive outcomes without owning the code. Want to walk through a couple of your projects?',
   now() - interval '5 days', now() - interval '5 days'),
  ('40000000-0000-4000-8000-000000000008', 'ask', '10000000-0000-4000-8000-000000000010',
   'That would be perfect. I will put together two examples and send them over before our call.',
   now() - interval '4 days', now() - interval '4 days'),
  -- Iris <> Richard
  ('40000000-0000-4000-8000-000000000010', 'ask', '10000000-0000-4000-8000-000000000012',
   'Hi Richard, hope you''re doing well! I''m prepping a presentation for our design critique next week. Would you have 15 minutes to review my slide deck outline?',
   now() - interval '24 hours', now() - interval '24 hours'),
  ('40000000-0000-4000-8000-000000000010', 'ask', '10000000-0000-4000-8000-000000000010',
   'Hi Iris! Absolutely, I''d love to help. Feel free to drop a link to the deck or upload it here.',
   now() - interval '23 hours', now() - interval '23 hours'),
  ('40000000-0000-4000-8000-000000000010', 'ask', '10000000-0000-4000-8000-000000000012',
   'Awesome! Here''s the link. Let me know if the problem framing reads clearly.',
   now() - interval '22 hours', now() - interval '22 hours');

-- ---------------------------------------------------------------------------
-- Friendships, friend requests, direct messages
-- ---------------------------------------------------------------------------

-- user_a_id < user_b_id is enforced by a check constraint; the deterministic
-- ids make the ordering readable here.
insert into public.friendships (user_a_id, user_b_id) values
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003'), -- mark <> mei
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000007'), -- mark <> ria
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000008'), -- mark <> rohan
  ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002'), -- amy <> mark
  ('10000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000007'), -- sam <> ria
  ('10000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000008'), -- ria <> rohan
  ('10000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000014'); -- richard <> sarah

insert into public.friend_requests (sender_id, receiver_id, status, message) values
  ('10000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', 'pending',
   'Hey Mark, would love to connect and follow your consulting journey at Acme.'),
  ('10000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000002', 'pending',
   'Hello Mark! Hoping to connect and learn more about management consulting.'),
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000005', 'pending',
   'Hi Paula, let''s connect and catch up when you are back in town.'),
  ('10000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000003', 'pending',
   'Hi Mei, I''m a PM in Seattle. Saw you are in product at Hyundai in Seoul. Let''s connect!'),
  ('10000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000010', 'pending',
   'Met at the Chadwick Alumni Dinner last week! Let''s connect here.');

insert into public.direct_message_threads (id, user_a_id, user_b_id) values
  ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003'), -- mark <> mei
  ('50000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000007'), -- mark <> ria
  ('50000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002'), -- amy <> mark
  ('50000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000014'); -- richard <> sarah

insert into public.messages (thread_id, thread_type, sender_id, body, created_at, read_at)
values
  -- Mark <> Mei (last unread by Mei)
  ('50000000-0000-4000-8000-000000000001', 'direct', '10000000-0000-4000-8000-000000000002',
   'Hey Mei! How''s Songdo? I saw the pictures from Onion Cafe, looks incredible.',
   now() - interval '24 hours', now() - interval '24 hours'),
  ('50000000-0000-4000-8000-000000000001', 'direct', '10000000-0000-4000-8000-000000000003',
   'Hey Mark! Onion is fantastic, very cozy. Work is busy with the infotainment launch, but we should definitely catch up.',
   now() - interval '18 hours', now() - interval '18 hours'),
  ('50000000-0000-4000-8000-000000000001', 'direct', '10000000-0000-4000-8000-000000000002',
   'Absolutely! I will be free next Thursday evening your time. Let''s do a quick call.',
   now() - interval '2 hours', null),
  -- Mark <> Ria (last unread by Ria)
  ('50000000-0000-4000-8000-000000000002', 'direct', '10000000-0000-4000-8000-000000000007',
   'Hi Mark! Thanks for connecting. I''m a software engineer at Stripe in SF. Let me know if you are ever in the area!',
   now() - interval '2 days', now() - interval '2 days'),
  ('50000000-0000-4000-8000-000000000002', 'direct', '10000000-0000-4000-8000-000000000002',
   'Hi Ria, great to meet you! I''m in SF quite often for consulting projects. Will let you know next time I visit.',
   now() - interval '24 hours', null),
  -- Amy <> Mark
  ('50000000-0000-4000-8000-000000000003', 'direct', '10000000-0000-4000-8000-000000000001',
   'Hi Mark, did you see the announcement for the Tech & Product Roundtable?',
   now() - interval '3 days', now() - interval '3 days'),
  ('50000000-0000-4000-8000-000000000003', 'direct', '10000000-0000-4000-8000-000000000002',
   'Yes Amy, looks like a great panel. I will be attending for sure.',
   now() - interval '3 days', now() - interval '3 days'),
  -- Richard <> Sarah (last unread by Richard)
  ('50000000-0000-4000-8000-000000000004', 'direct', '10000000-0000-4000-8000-000000000010',
   'Hey Sarah, are you attending the upcoming networking event in SF?',
   now() - interval '5 days', now() - interval '5 days'),
  ('50000000-0000-4000-8000-000000000004', 'direct', '10000000-0000-4000-8000-000000000014',
   'Yes, I''m planning to go! We should grab coffee before it starts.',
   now() - interval '5 days', now() - interval '5 days'),
  ('50000000-0000-4000-8000-000000000004', 'direct', '10000000-0000-4000-8000-000000000010',
   'Sounds perfect, let''s meet at Blue Bottle near the venue around 6 PM.',
   now() - interval '4 days', now() - interval '4 days'),
  ('50000000-0000-4000-8000-000000000004', 'direct', '10000000-0000-4000-8000-000000000014',
   'Perfect, see you there!',
   now() - interval '4 days', null);

-- ---------------------------------------------------------------------------
-- Events + RSVPs (3 upcoming, 2 past)
-- ---------------------------------------------------------------------------

insert into public.events
  (id, organization_id, title, description, location, starts_at, capacity, published_at)
values
  ('eeee0000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Spring Alumni Mixer (Palos Verdes)',
   'Casual evening drinks at the Palos Verdes campus. Join your fellow Chadwick graduates for structured advisory discussions and local mentorship matching.',
   'Chadwick School Main Campus', now() + interval '14 days', 50, now()),
  ('eeee0000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'Songdo Alumni Coffee',
   'Saturday morning coffee meetup for Chadwick International alumni in Seoul.',
   'Cafe Onion, Songdo', now() + interval '21 days', 15, now()),
  ('eeee0000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   'Tech & Product Roundtable',
   'A focused roundtable for alumni working across product, engineering, and design.',
   'The Hartwood Library & Terrace, SF', now() + interval '5 days', 100, now()),
  ('eeee0000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111',
   'Winter Holiday Dinner',
   'Our annual end-of-year dinner celebration for local alumni.',
   'The Athenaeum, Pasadena', now() - interval '30 days', 40, now()),
  ('eeee0000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111',
   'Creative Careers Panel',
   'A moderated conversation with Chadwick alumni in media, art direction, photography, and design.',
   'Soho House, West Hollywood', now() - interval '45 days', 25, now());

insert into public.event_rsvps (event_id, user_id, status) values
  ('eeee0000-0000-0000-0000-000000000001', '10000000-0000-4000-8000-000000000007', 'going'),
  ('eeee0000-0000-0000-0000-000000000001', '10000000-0000-4000-8000-000000000008', 'going'),
  ('eeee0000-0000-0000-0000-000000000001', '10000000-0000-4000-8000-000000000006', 'going'),
  ('eeee0000-0000-0000-0000-000000000001', '10000000-0000-4000-8000-000000000002', 'going'),
  ('eeee0000-0000-0000-0000-000000000001', '10000000-0000-4000-8000-000000000010', 'going'),
  ('eeee0000-0000-0000-0000-000000000002', '10000000-0000-4000-8000-000000000003', 'going'),
  ('eeee0000-0000-0000-0000-000000000002', '10000000-0000-4000-8000-000000000008', 'going'),
  ('eeee0000-0000-0000-0000-000000000003', '10000000-0000-4000-8000-000000000007', 'going'),
  ('eeee0000-0000-0000-0000-000000000003', '10000000-0000-4000-8000-000000000008', 'going'),
  ('eeee0000-0000-0000-0000-000000000003', '10000000-0000-4000-8000-000000000006', 'going'),
  ('eeee0000-0000-0000-0000-000000000003', '10000000-0000-4000-8000-000000000002', 'going'),
  ('eeee0000-0000-0000-0000-000000000003', '10000000-0000-4000-8000-000000000003', 'going'),
  ('eeee0000-0000-0000-0000-000000000003', '10000000-0000-4000-8000-000000000004', 'going'),
  ('eeee0000-0000-0000-0000-000000000003', '10000000-0000-4000-8000-000000000010', 'going'),
  ('eeee0000-0000-0000-0000-000000000004', '10000000-0000-4000-8000-000000000007', 'going'),
  ('eeee0000-0000-0000-0000-000000000004', '10000000-0000-4000-8000-000000000006', 'going'),
  ('eeee0000-0000-0000-0000-000000000004', '10000000-0000-4000-8000-000000000002', 'going'),
  ('eeee0000-0000-0000-0000-000000000005', '10000000-0000-4000-8000-000000000003', 'going'),
  ('eeee0000-0000-0000-0000-000000000005', '10000000-0000-4000-8000-000000000007', 'going');

-- ---------------------------------------------------------------------------
-- Announcements + notifications
-- ---------------------------------------------------------------------------

insert into public.announcements (organization_id, created_by, title, body, published_at) values
  ('11111111-1111-1111-1111-111111111111', '10000000-0000-4000-8000-000000000001',
   'Spring Career Panel — register by May 30',
   'Join alumni from product, finance, and medicine for a candid evening on early-career pivots. Doors at 6:30pm in the PV commons; remote link for Songdo. Bring a question.',
   now() - interval '2 days'),
  ('11111111-1111-1111-1111-111111111111', '10000000-0000-4000-8000-000000000001',
   '2026 Mentorship Awards — nominate by Jun 12',
   'Know an alum who showed up for you this year? Nominate them for the annual mentorship awards. A few sentences is all it takes.',
   now() - interval '5 days'),
  ('11111111-1111-1111-1111-111111111111', '10000000-0000-4000-8000-000000000001',
   'Summer in Seoul — alumni meetups forming now',
   'Heading to Korea this summer? A handful of classmates are organizing casual coffee meetups near Songdo and Gangnam. Reply in the circle to be looped in.',
   now() - interval '9 days');

-- Payload shape mirrors src/lib/notifications/types.ts (renderer reads
-- payload.actor_name / ask_type / title). target_id null → clicks fall back
-- to /inbox or /announcements.
insert into public.notifications (user_id, organization_id, type, payload, read_at, created_at) values
  ('10000000-0000-4000-8000-000000000010', '11111111-1111-1111-1111-111111111111',
   'ask_received', '{"actor_name":"Alexander Kim","ask_type":"mentorship"}'::jsonb, null, now() - interval '2 hours'),
  ('10000000-0000-4000-8000-000000000010', '11111111-1111-1111-1111-111111111111',
   'friend_request_received', '{"actor_name":"Dev Patel"}'::jsonb, null, now() - interval '5 hours'),
  ('10000000-0000-4000-8000-000000000010', '11111111-1111-1111-1111-111111111111',
   'ask_message', '{"actor_name":"Iris Okonkwo"}'::jsonb, null, now() - interval '22 hours'),
  ('10000000-0000-4000-8000-000000000010', '11111111-1111-1111-1111-111111111111',
   'ask_accepted', '{"actor_name":"Mark Mentor","ask_type":"advice"}'::jsonb, now() - interval '4 days', now() - interval '5 days'),
  ('10000000-0000-4000-8000-000000000010', '11111111-1111-1111-1111-111111111111',
   'announcement', '{"title":"Spring Career Panel — register by May 30"}'::jsonb, now() - interval '1 day', now() - interval '2 days');
