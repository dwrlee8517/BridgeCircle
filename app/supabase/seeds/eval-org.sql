-- =============================================================================
-- Evalfield School — the Help-search evaluation corpus (local-only seed).
--
-- This org exists for exactly one purpose: measuring Help candidate search
-- against a corpus we fully author. It is the data half of the golden dataset;
-- the question half lives in app/src/lib/help/__fixtures__/golden-search.json.
-- Initiative: engineering-spec-obsidian-vault/Initiatives/help-search-golden-baseline/
--
-- Design rules (do not casually edit — labels in the golden fixture depend on
-- this file; any edit here requires re-running the fixture's counter-candidate
-- sweep and `pnpm eval:search --capture`):
--   * Everything lives in the ee… UUID namespace. Users are
--     ee000000-0000-4000-8000-<n padded to 12>, memberships are
--     ee111111-1111-4111-8111-<n padded to 12>, with one shared integer n.
--   * n 1-3 are viewers (viewer-N@eval.test), n 10-129 the hand-authored core
--     (helper-NNN@eval.test), n 1000-2079 the generated crowd
--     (member-NNNN@eval.test). All passwords are 'eval-password'.
--   * Deterministic: no random(), no unstamped now() in anything that affects
--     ranking. Profile updated_at and joined_at are fixed or hash-derived from
--     a fixed base date, because profile recency is a ranking tiebreak.
--   * Every hand-authored member's comment names the trap/case group it
--     serves. The generated crowd shares the same topic vocabulary so that
--     crowding is real (>=30 holders of the designated crowded topics:
--     Negotiating an offer, Managing people, Career changes).
-- =============================================================================

insert into public.organizations (id, slug, name, requires_admin_approval)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'eval', 'Evalfield School', false);

-- ---------------------------------------------------------------------------
-- Staging table. Populated in commented groups below, then fanned out into
-- auth.users / memberships / profiles / helper tables. Dropped at the end.
--
-- Everything below runs inside one DO block: the Supabase seed runner prepares
-- a file's statements as a batch, so a temp table created mid-file is not
-- visible to later statements unless they are planned at runtime (plpgsql).
-- ---------------------------------------------------------------------------
do $eval$
begin

create temp table eval_member (
  n integer primary key,
  display_name text not null,
  headline text,
  employer text,
  title text,
  industry text,
  city text,
  university text,
  major text,
  bio text,
  grad_year smallint not null,
  is_helper boolean not null default false,
  open_to_help boolean not null default true,
  max_pending smallint not null default 10,
  paused boolean not null default false,
  topics text[] not null default '{}',
  profile_updated date not null default '2026-08-01'
);

-- ---------------------------------------------------------------------------
-- Viewers (n 1-3). viewer-1 is the default asker: no helper row, no blocks.
-- viewer-2 blocks helper-089 (block-eligibility case). viewer-3 is themselves
-- the org's only 'Actuarial science' helper (self-exclusion case).
-- ---------------------------------------------------------------------------
insert into eval_member
  (n, display_name, headline, employer, title, industry, city, university, major, bio, grad_year, is_helper, topics) values
  (1, 'Vera Osei', 'Figuring out what comes after graduation', null, null, null, 'Los Angeles, CA', 'UCLA', 'Sociology', null, 2022, false, '{}'),
  (2, 'Victor Nakamura', 'Analyst, still exploring', 'Brightwater Group', 'Analyst', 'Finance', 'New York, NY', 'NYU', 'Finance', null, 2019, false, '{}'),
  (3, 'Vale Fontaine', 'Actuary; pensions and longevity risk', 'Ledger Mutual', 'Senior Actuary', 'Insurance', 'Hartford, CT', 'UConn', 'Mathematics', 'Happy to talk actuarial exams and insurance careers.', 2010, true, '{Actuarial science}');

-- ---------------------------------------------------------------------------
-- Group A (n 10-27): rich anchors — one strong, fully-filled helper per major
-- topic. These are the expected top answers for keyword/sentence cases.
-- ---------------------------------------------------------------------------
insert into eval_member
  (n, display_name, headline, employer, title, industry, city, university, major, bio, grad_year, is_helper, topics) values
  (10, 'Ana Ferreira', 'Strategy consulting; generalist problem-solving careers', 'McKinsey & Company', 'Engagement Manager', 'Management consulting', 'Chicago, IL', 'Northwestern University', 'Economics', 'Six years in consulting across retail and healthcare. Glad to walk through recruiting, casing, and what the job is actually like.', 2014, true, '{Consulting}'),
  (11, 'Ben Okonkwo', 'MBA admissions and what business school is for', 'Solara Brands', 'Director of Strategy', 'Consumer goods', 'Atlanta, GA', 'University of Pennsylvania', 'Marketing', 'Wharton MBA. Happy to read essays and talk through whether an MBA makes sense at all.', 2011, true, '{Business school}'),
  (12, 'Chloe Zhang', 'Early-stage investing and founder support', 'Meridian Ventures', 'Partner', 'Venture capital', 'San Francisco, CA', 'Stanford University', 'Computer Science', 'Invest at seed and Series A. Former operator. Can speak to breaking into venture capital and evaluating startups.', 2009, true, '{Venture capital}'),
  (13, 'Dev Anand', 'Product management in platform teams', 'Nimbus Software', 'Group Product Manager', 'Technology', 'Seattle, WA', 'University of Washington', 'Information Systems', 'A decade in product management. Roadmaps, stakeholder wrangling, and PM interviews.', 2012, true, '{Product management}'),
  (14, 'Elsa Lindqvist', 'Software engineering careers and staff+ growth', 'Fjord Systems', 'Staff Engineer', 'Technology', 'Austin, TX', 'UT Austin', 'Computer Science', 'Backend and infrastructure. Happy to talk software engineering interviews, promotions, and switching stacks.', 2013, true, '{Software engineering}'),
  (15, 'Farid Karimi', 'Data science and analytics leadership', 'Helix Analytics', 'Principal Data Scientist', 'Technology', 'Denver, CO', 'University of Michigan', 'Statistics', 'From analyst to principal. Data science portfolios, interviews, and stakeholder work.', 2012, true, '{Data science}'),
  (16, 'Gloria Mensah', 'Investment banking, coverage and deals', 'Ashford & Co', 'Vice President', 'Investment banking', 'New York, NY', 'Georgetown University', 'Finance', 'IB analyst to VP. Recruiting timelines, technicals, and surviving year one.', 2013, true, '{Investment banking}'),
  (17, 'Hana Sato', 'Medicine: residency and attending life', 'St. Vincent Hospital', 'Attending Physician', 'Healthcare', 'Boston, MA', 'Johns Hopkins University', 'Biology', 'Internal medicine attending. Med school applications, residency match, and clinical careers.', 2006, true, '{Medicine}'),
  (18, 'Ian Petrov', 'Law school and early legal careers', 'Calder LLP', 'Associate', 'Law', 'Washington, DC', 'Georgetown University', 'Political Science', 'JD, big-law associate. LSAT, applications, and what firm life is like.', 2015, true, '{Law school}'),
  (19, 'Julia Romero', 'Research careers in and out of academia', 'UC Berkeley', 'Postdoctoral Researcher', 'Research', 'Berkeley, CA', 'UC Berkeley', 'Neuroscience', 'PhD and postdoc. Grad school decisions, advisors, and leaving or staying in academia.', 2013, true, '{Graduate school,Research careers}'),
  (20, 'Kwame Boateng', 'Design leadership and craft', 'Loop Studio', 'Design Lead', 'Design', 'Portland, OR', 'RISD', 'Graphic Design', 'Brand and product design. Portfolios, critique, and moving from IC to lead.', 2011, true, '{Design}'),
  (21, 'Lena Fischer', 'Reporting and newsroom careers', 'The Ledger', 'Senior Reporter', 'Media', 'New York, NY', 'University of Missouri', 'Journalism', 'Ten years in newsrooms. Pitching, beats, and journalism job markets.', 2010, true, '{Journalism}'),
  (22, 'Marco Rossi', 'Teaching and school leadership', 'Lincoln High School', 'History Teacher', 'Education', 'San Diego, CA', 'San Diego State', 'History', 'Classroom teacher and department chair. Credentialing and first-year survival.', 2008, true, '{Teaching}'),
  (23, 'Nora Haddad', 'Public policy and government careers', 'Civic Institute', 'Policy Analyst', 'Public policy', 'Washington, DC', 'Harvard University', 'Government', 'Think tank and Hill experience. Policy writing and fellowship applications.', 2016, true, '{Public policy}'),
  (24, 'Owen Gallagher', 'Nonprofit work and mission-driven careers', 'Harbor Foundation', 'Program Director', 'Nonprofit', 'Chicago, IL', 'Notre Dame', 'Sociology', 'Fifteen years in nonprofits. Fundraising, program design, and pay realities.', 2005, true, '{Nonprofit work}'),
  (25, 'Priya Nair', 'Founding and early startup life', 'Solstice Labs', 'Founder & CEO', 'Technology', 'San Francisco, CA', 'MIT', 'Mechanical Engineering', 'Second-time founder. Zero-to-one, fundraising, and early hires at startups.', 2010, true, '{Startups}'),
  (26, 'Quinn Adebayo', 'Climate tech commercialization', 'Verdant Energy', 'Head of Partnerships', 'Climate', 'Oakland, CA', 'UC Davis', 'Environmental Science', 'Utility-scale solar and storage. Breaking into climate tech from adjacent fields.', 2009, true, '{Climate tech}'),
  (27, 'Rosa Delgado', 'Working abroad and global careers', 'Meridian Logistics', 'Regional Manager', 'Logistics', 'Singapore', 'University of Texas', 'International Business', 'Three countries, two visas. Relocation, expat packages, and working abroad.', 2007, true, '{Working abroad}');

-- ---------------------------------------------------------------------------
-- Group B (n 30-41): second anchors at lower completeness tiers. The
-- sparse-with-topics members are the "right answer with the least text" class:
-- topic opt-in only, empty headline/bio. Cases: sparse-vs-rich regime.
-- ---------------------------------------------------------------------------
insert into eval_member
  (n, display_name, headline, employer, title, industry, city, university, major, bio, grad_year, is_helper, topics) values
  (30, 'Sam Whitaker', null, null, null, null, null, null, null, null, 2017, true, '{Consulting}'),
  (31, 'Tara Iwu', null, null, null, null, null, null, null, null, 2019, true, '{Software engineering}'),
  (32, 'Umar Aziz', null, null, null, null, null, null, null, null, 2004, true, '{Medicine}'),
  (33, 'Uma Krishnan', 'Product manager, consumer apps', 'Brightside Apps', 'Product Manager', 'Technology', 'Los Angeles, CA', null, null, null, 2016, true, '{Product management}'),
  (34, 'Wes Morrow', 'Early-stage investor', 'Foothill Capital', 'Principal', 'Venture capital', 'Palo Alto, CA', null, null, null, 2012, true, '{Venture capital}'),
  (35, 'Ximena Vargas', 'HR leader; compensation and offers', 'Northgate Health', 'HR Director', 'Healthcare', 'Phoenix, AZ', null, null, null, 2008, true, '{Negotiating an offer}'),
  (36, 'Yusuf Demir', 'Engineering manager, distributed teams', 'Cobalt Works', 'Engineering Manager', 'Technology', 'Remote', null, null, null, 2011, true, '{Managing people}'),
  (37, 'Zoe Laurent', 'Career coach for mid-career pivots', 'Independent', 'Coach', 'Coaching', 'Chicago, IL', null, null, null, 2006, true, '{Career changes}'),
  (38, 'Abel Girma', null, null, null, null, null, null, null, null, 2015, true, '{Negotiating an offer}'),
  (39, 'Bianca Moretti', null, null, null, null, null, null, null, null, 2018, true, '{Interviewing}'),
  (40, 'Caleb Duran', 'Mentoring new grads through the first job hunt', 'Stateside Insurance', 'Team Lead', 'Insurance', 'Columbus, OH', null, null, null, 2013, true, '{First jobs}'),
  (41, 'Dina Petros', null, null, null, null, null, null, null, null, 2014, true, '{Business school}');

-- ---------------------------------------------------------------------------
-- Group C (n 45-52): single-field signal loci. Each member's ONLY strong
-- signal for their case sits in one field, to isolate field weighting.
-- ---------------------------------------------------------------------------
insert into eval_member
  (n, display_name, headline, employer, title, industry, city, university, major, bio, grad_year, is_helper, topics) values
  -- headline-only McKinsey signal; a teacher now. Trap for "consulting"-type
  -- queries (must not beat active consultants), legitimate for "McKinsey".
  (45, 'Elias Vance', 'Ex-McKinsey; now teaching high school science', 'Roosevelt High School', 'Science Teacher', 'Education', 'Sacramento, CA', 'UC Davis', 'Chemistry', null, 2009, true, '{Teaching}'),
  -- employer-only McKinsey signal (C-weight), topics unrelated.
  (46, 'Freya Nilsen', null, 'McKinsey & Company', 'Operations Coordinator', 'Management consulting', 'Chicago, IL', null, null, null, 2018, true, '{Managing people}'),
  -- city signal: the Seoul PM. Case: "product management in Seoul".
  (47, 'Gita Prasetyo', 'Product manager, mobility apps', 'Hanguk Mobility', 'Product Manager', 'Technology', 'Seoul, South Korea', null, null, null, 2015, true, '{Product management}'),
  -- university-only signal (C-weight).
  (48, 'Hugo Marchand', null, 'Atlas Group', 'Manager', 'Consumer goods', 'Miami, FL', 'INSEAD', 'Business Administration', null, 2012, true, '{Business school}'),
  -- experience-description-only signal (D-weight): career changer whose story
  -- lives in profile_experiences rows (seeded below), not headline/bio.
  (49, 'Ivy Cheng', 'From bedside to boardroom', null, null, 'Healthcare technology', 'Minneapolis, MN', null, null, null, 2011, true, '{Career changes}'),
  -- reserve city-collision member (city that could read as a name). No case yet.
  (50, 'Jonas Weber', 'Coverage banking', 'Piedmont Securities', 'Associate', 'Investment banking', 'Charlotte, NC', null, null, null, 2016, true, '{Investment banking}'),
  -- employer-collision trap #1: 'Capital One' tokenizes to capit+one and
  -- collides with "venture capital" queries. Must not beat real VC helpers.
  (51, 'Kira Volkov', null, 'Capital One', 'Risk Analyst', 'Banking', 'Richmond, VA', null, null, null, 2017, true, '{Interviewing}'),
  -- employer-collision trap #2: 'People Management Group' collides with
  -- "managing people" queries at C-weight. A recruiter, not a manager.
  (52, 'Liam O''Sullivan', 'Technical recruiting', 'People Management Group', 'Recruiter', 'Staffing', 'Boston, MA', null, null, null, 2014, true, '{Interviewing}');

-- ---------------------------------------------------------------------------
-- Group D (n 55-69): sparse-vs-rich distractors and aspirants — profiles that
-- are lexically loud but humanly wrong (or not eligible at all).
-- ---------------------------------------------------------------------------
insert into eval_member
  (n, display_name, headline, employer, title, industry, city, university, major, bio, grad_year, is_helper, open_to_help, topics) values
  -- rich-but-NOT-a-helper consulting distractor: never opted in; must never
  -- surface anywhere (universal invariant material).
  (55, 'Maya Lindgren', 'Strategy consulting across industries', 'Deloitte', 'Senior Consultant', 'Management consulting', 'Dallas, TX', 'SMU', 'Business Administration', 'Consulting engagements in strategy, operations, and transformation. Client work across retail and energy consulting practices.', 2013, false, true, '{}'),
  -- rich helper whose text screams consulting but whose OFFER is Working
  -- abroad. Ambiguous-by-design: acceptable for consulting questions, not must.
  (56, 'Nico Alves', 'Consultant at Bain, three countries and counting', 'Bain & Company', 'Consultant', 'Management consulting', 'London, UK', 'IE University', 'Economics', 'Consulting across European offices; happy to talk visas, transfers, and building a career abroad.', 2016, true, true, '{Working abroad}'),
  -- aspirant trap #1: wants INTO consulting; helper for First jobs only.
  (57, 'Otis Reeves', 'Operations analyst aiming for consulting', 'Granite Retail', 'Operations Analyst', 'Retail', 'Cleveland, OH', 'Ohio State', 'Business Administration', 'Hoping to break into consulting after two years in operations. Glad to compare notes on landing a first job out of school.', 2023, true, true, '{First jobs}'),
  -- aspirant trap #2: wants INTO venture capital; helper for Interviewing.
  (58, 'Pia Kowalski', 'Analyst hoping to move into venture capital', 'Brightwater Group', 'Analyst', 'Finance', 'New York, NY', 'Fordham', 'Finance', 'Prepping for the venture capital recruiting cycle myself; can share interview prep systems that worked for me.', 2022, true, true, '{Interviewing}'),
  -- aspirant trap #3: wants INTO product management; helper for First jobs.
  (59, 'Ravi Chandra', 'Support engineer working toward product management', 'Pixelforge', 'Support Engineer', 'Technology', 'San Jose, CA', 'SJSU', 'Computer Engineering', 'Studying product management frameworks and hoping to make the jump; happy to talk first-job search in tech support.', 2023, true, true, '{First jobs}'),
  -- rich medicine-adjacent distractor: PhD researcher, not a physician.
  (60, 'Sela Fiava', 'Biomedical sciences PhD; bench to biotech', 'Aster Biosciences', 'Scientist II', 'Biotechnology', 'San Diego, CA', 'UCSD', 'Biomedical Sciences', 'Medical research on immunology; moved from academia to industry biotech.', 2014, true, true, '{Graduate school}'),
  -- consulting near-miss pack (density for the consulting cases):
  (61, 'Tomas Brandt', 'Corporate strategy in retail', 'Northwind Retail', 'Strategy Manager', 'Retail', 'Minneapolis, MN', null, null, null, 2012, true, true, '{Managing people}'),
  (62, 'Una Björk', 'Strategy and planning', 'Polar Freight', 'Head of Planning', 'Logistics', 'Newark, NJ', null, null, 'Internal strategy work; considering business school to formalize it.', 2015, true, true, '{Business school}'),
  (63, 'Vik Sharma', 'Advisory services, audit-adjacent', 'Whitfield & Associates', 'Advisory Manager', 'Accounting', 'Houston, TX', null, null, null, 2013, true, true, '{Investment banking}'),
  -- venture-capital near-miss pack:
  (64, 'Wanda Fuchs', 'Angel investing on the side', 'Fuchs Design Co', 'Owner', 'Design', 'Santa Fe, NM', null, null, 'Small angel checks into local startups; day job running a studio.', 2007, true, true, '{Startups}'),
  (65, 'Xander Cole', 'Private equity, industrials', 'Kestrel Partners', 'Associate', 'Private equity', 'Chicago, IL', null, null, null, 2018, true, true, '{Investment banking}'),
  -- 'capital campaigns' collision inside a nonprofit profile:
  (66, 'Yara Saleh', 'Fundraising and capital campaigns for nonprofits', 'Riverlight Foundation', 'Development Director', 'Nonprofit', 'Philadelphia, PA', null, null, 'Runs capital campaigns; happy to talk nonprofit fundraising careers.', 2009, true, true, '{Nonprofit work}'),
  -- product-management near-miss pack (for the PM + stem-trap cases):
  (67, 'Zara Ellison', 'Project manager, construction', 'Keystone Build', 'Project Manager', 'Construction', 'Nashville, TN', null, null, null, 2014, true, true, '{Negotiating an offer}'),
  (68, 'Ari Solberg', 'Product marketing for developer tools', 'Nimbus Software', 'Product Marketing Manager', 'Technology', 'Seattle, WA', null, null, null, 2017, true, true, '{First jobs}'),
  (69, 'Beth Calloway', 'Program management in aerospace', 'Vector Dynamics', 'Program Manager', 'Aerospace', 'Huntsville, AL', null, null, null, 2010, true, true, '{Managing people}');

-- ---------------------------------------------------------------------------
-- Group E (n 70-74): stem-collision traps. The english stemmer maps
-- production→product, markets→market, teaching→teach — these members match
-- query tokens for the wrong human reason.
-- ---------------------------------------------------------------------------
insert into eval_member
  (n, display_name, headline, employer, title, industry, city, university, major, bio, grad_year, is_helper, topics) values
  -- production/product collision: matches BOTH tokens of "product management".
  (70, 'Zane Okafor', 'Production lines and plant operations', 'Meridian Manufacturing', 'Production Manager', 'Manufacturing', 'Toledo, OH', null, null, 'Runs production scheduling and product line throughput on two plants.', 2008, true, '{Managing people}'),
  -- capital markets reporter: collides with "venture capital" via 'capital'.
  (71, 'Ada Blum', 'Capital markets reporter', 'The Ledger', 'Markets Reporter', 'Media', 'New York, NY', null, null, 'Covers capital markets, IPOs, and rates.', 2015, true, '{Journalism}'),
  -- teaching-hospital collision: a physician whose text matches 'teaching'.
  (72, 'Bela Nagy', 'Resident at a teaching hospital', 'Lakeside Teaching Hospital', 'Resident Physician', 'Healthcare', 'Cleveland, OH', null, null, null, 2020, true, '{Medicine}'),
  -- second production-adjacent member, partial tier (density for stem trap):
  (73, 'Cyrus Ford', 'Plant supervisor', 'Ironline Manufacturing', 'Production Supervisor', 'Manufacturing', 'Gary, IN', null, null, null, 2011, true, '{Career changes}'),
  -- 'offering' collision candidate for negotiation queries, partial tier:
  (74, 'Dalia Mansour', 'Runs the seasonal product offering at a retailer', 'Solara Brands', 'Merchandising Manager', 'Consumer goods', 'Atlanta, GA', null, null, null, 2013, true, '{Working abroad}');

-- ---------------------------------------------------------------------------
-- Group F (n 75-77): split-phrase traps — the words of a topic phrase appear
-- in DIFFERENT fields; must not count as a topic-level hit.
-- ---------------------------------------------------------------------------
insert into eval_member
  (n, display_name, headline, employer, title, industry, city, university, major, bio, grad_year, is_helper, topics) values
  -- 'venture' (employer) + 'capital' (bio), zero VC involvement:
  (75, 'Cato Lindholm', 'Infrastructure project finance', 'Venture Partners Group', 'Project Manager', 'Infrastructure', 'Denver, CO', null, null, 'Raising capital for toll-road and transmission projects.', 2012, true, '{Climate tech}'),
  -- 'business' (title) + 'school' (employer) split, not Business school:
  (76, 'Dot Reyes', 'Operations for a school district', 'Ridgeview School District', 'Business Manager', 'Education', 'Fresno, CA', null, null, null, 2009, true, '{Nonprofit work}'),
  -- 'managing' (bio) + 'people' (headline) split across low-weight fields:
  (77, 'Ezra Stone', 'People person; sales at heart', 'Coastline Media', 'Account Director', 'Media', 'Los Angeles, CA', null, null, 'Managing budgets and campaign timelines for ad clients.', 2010, true, '{Journalism}');

-- ---------------------------------------------------------------------------
-- Group G (n 78-79): tiebreak twins — identical shape, same topic, same
-- profile_updated; they differ ONLY in seeded pending-ask load (below).
-- Expected order: Erin (0 pending) before Dara (2 pending).
-- ---------------------------------------------------------------------------
insert into eval_member
  (n, display_name, headline, employer, title, industry, city, university, major, bio, grad_year, is_helper, topics) values
  (78, 'Dara Quinn', 'Mock interviews and offer prep', 'Summit Coaching', 'Coach', 'Coaching', 'Boise, ID', null, null, null, 2012, true, '{Interviewing}'),
  (79, 'Erin Quill', 'Mock interviews and offer prep', 'Summit Coaching', 'Coach', 'Coaching', 'Boise, ID', null, null, null, 2012, true, '{Interviewing}');

-- ---------------------------------------------------------------------------
-- Group H (n 85-89): eligibility gates. Each is the ONLY holder of a unique
-- topic (or paired with a query no one else matches), so their case isolates
-- one gate: paused / opted-out / at-capacity / blocked.
-- ---------------------------------------------------------------------------
insert into eval_member
  (n, display_name, headline, employer, title, industry, city, university, major, bio, grad_year, is_helper, open_to_help, max_pending, paused, topics) values
  -- paused helper (open_to_help=false + paused_at, per the pause constraint):
  (85, 'Finn Halvorsen', 'Compilers and developer tooling', 'Fjord Systems', 'Senior Engineer', 'Technology', 'Austin, TX', null, null, 'Deep systems background; normally glad to help.', 2014, true, false, 10, true, '{Software engineering}'),
  -- opted out (helper row exists, open_to_help=false, not paused). Topics kept
  -- on the row: consulting queries must never surface him.
  (86, 'Gus Mbeki', 'Operating partner, retail turnarounds', 'Harlow Advisors', 'Operating Partner', 'Management consulting', 'Charlotte, NC', null, null, 'Former consulting principal; not taking asks right now.', 2003, true, false, 10, false, '{Consulting}'),
  -- rich never-a-helper VC mirror of Maya (universal-invariant material):
  (87, 'Hilda Stein', 'Venture capital, fintech focus', 'Argonaut Ventures', 'Principal', 'Venture capital', 'New York, NY', 'Columbia University', 'Economics', 'Series A fintech investing; sourcing, diligence, and portfolio support.', 2011, false, true, 10, false, '{}'),
  -- permanently at capacity: max_pending=1 with one seeded waiting ask below.
  -- Only 'Executive coaching' helper → that query must return empty.
  (88, 'Iona Macleod', 'Executive coaching for new managers', 'Macleod Coaching', 'Executive Coach', 'Coaching', 'Providence, RI', null, null, 'Coaches first-time executives through their first 100 days.', 2001, true, true, 1, false, '{Executive coaching}'),
  -- blocked by viewer-2 (member_blocks below). Only 'Public speaking' helper:
  -- viewer-2 sees empty, viewer-1 sees him. Two cases from one member.
  (89, 'Jules Aubert', 'Public speaking and executive presence', 'Aubert Communications', 'Speaking Coach', 'Coaching', 'New Orleans, LA', null, null, 'Keynote coaching and conference-talk prep.', 2005, true, true, 10, false, '{Public speaking}');

-- ---------------------------------------------------------------------------
-- Group I (n 100-129): reserve bench — realistic mixed-tier members that
-- thicken distractor density everywhere and stand by for future cases.
-- Roughly half are helpers on assorted vocabulary topics.
-- ---------------------------------------------------------------------------
insert into eval_member
  (n, display_name, headline, employer, title, industry, city, university, major, bio, grad_year, is_helper, topics) values
  (100, 'Kai Watanabe', 'Payments infrastructure engineer', 'Ledgerline', 'Senior Engineer', 'Fintech', 'San Francisco, CA', null, null, null, 2016, true, '{Software engineering}'),
  (101, 'Lior Ben-David', 'Growth marketing', 'Brightside Apps', 'Growth Lead', 'Technology', 'Los Angeles, CA', null, null, null, 2015, true, '{Startups}'),
  (102, 'Mina Chowdhury', 'Pediatric nurse practitioner', 'Bayview Clinic', 'Nurse Practitioner', 'Healthcare', 'Oakland, CA', null, null, null, 2013, true, '{Medicine}'),
  (103, 'Noel Traore', null, 'Calder LLP', 'Paralegal', 'Law', 'Washington, DC', null, null, null, 2021, true, '{Law school}'),
  (104, 'Opal Kekoa', 'Hotel operations leadership', 'Palm & Tide Resorts', 'General Manager', 'Hospitality', 'Honolulu, HI', null, null, null, 2004, true, '{Managing people}'),
  (105, 'Pavel Sokolov', null, null, null, null, 'Pittsburgh, PA', null, null, null, 2019, true, '{Negotiating an offer}'),
  (106, 'Queenie Lam', 'Supply chain planning', 'Polar Freight', 'Planner', 'Logistics', 'Newark, NJ', null, null, null, 2018, false, '{}'),
  (107, 'Remy Fontaine', 'Sommelier turned sales trainer', 'Coastline Media', 'Sales Trainer', 'Media', 'Los Angeles, CA', null, null, 'Changed industries twice; wine floor to media sales.', 2007, true, '{Career changes}'),
  (108, 'Suki Tanaka', null, null, null, null, 'Seattle, WA', null, null, null, 2020, false, '{}'),
  (109, 'Theo Lindqvist', 'Actuarial analyst', 'Ledger Mutual', 'Analyst', 'Insurance', 'Hartford, CT', null, null, null, 2022, false, '{}'),
  (110, 'Ursula Meyer', 'Museum education programs', 'City Museum of Art', 'Education Manager', 'Arts', 'St. Louis, MO', null, null, null, 2009, true, '{Teaching,Nonprofit work}'),
  (111, 'Viggo Rasmussen', 'Wind project development', 'Verdant Energy', 'Development Manager', 'Climate', 'Oakland, CA', null, null, null, 2012, true, '{Climate tech}'),
  (112, 'Willa Novak', null, null, null, null, null, null, null, null, 2023, true, '{First jobs}'),
  (113, 'Xiu Ying', 'Quant research', 'Ashford & Co', 'Quantitative Analyst', 'Investment banking', 'New York, NY', null, null, null, 2019, true, '{Data science}'),
  (114, 'Yannick Dubois', 'Bilingual newsroom editor', 'The Ledger', 'Editor', 'Media', 'Montreal, QC', null, null, null, 2008, true, '{Journalism,Working abroad}'),
  (115, 'Zelda Marsh', 'Grant writing', 'Harbor Foundation', 'Grants Manager', 'Nonprofit', 'Chicago, IL', null, null, null, 2014, true, '{Nonprofit work}'),
  (116, 'Ash Patel', 'Corp dev at a public tech company', 'Nimbus Software', 'Corporate Development Manager', 'Technology', 'Seattle, WA', null, null, null, 2013, true, '{Investment banking}'),
  (117, 'Blair Cummings', null, 'Roosevelt High School', 'Math Teacher', 'Education', 'Sacramento, CA', null, null, null, 2012, true, '{Teaching}'),
  (118, 'Cleo Vance', 'Design systems and accessibility', 'Loop Studio', 'Senior Designer', 'Design', 'Portland, OR', null, null, null, 2016, true, '{Design}'),
  (119, 'Dario Bianchi', 'Restaurant group operations', 'Trattoria Group', 'Operations Director', 'Hospitality', 'Boston, MA', null, null, null, 2006, true, '{Managing people}'),
  (120, 'Effie Kondos', null, null, null, null, 'Baltimore, MD', null, null, null, 2021, true, '{Graduate school}'),
  (121, 'Ferris Uddin', 'Policy staffer', 'Civic Institute', 'Research Assistant', 'Public policy', 'Washington, DC', null, null, null, 2022, true, '{Public policy}'),
  (122, 'Greta Holm', 'Founding designer', 'Solstice Labs', 'Founding Designer', 'Technology', 'San Francisco, CA', null, null, null, 2015, true, '{Startups,Design}'),
  (123, 'Hollis Grant', null, null, null, null, null, null, null, null, 2017, false, '{}'),
  (124, 'Indra Wijaya', 'Regional sales, APAC', 'Meridian Logistics', 'Sales Director', 'Logistics', 'Singapore', null, null, null, 2010, true, '{Working abroad,Negotiating an offer}'),
  (125, 'Jem Barlow', 'Second-career teacher after ten years in banking', 'Lincoln High School', 'Economics Teacher', 'Education', 'San Diego, CA', null, null, 'Left investment banking for the classroom.', 2005, true, '{Career changes,Teaching}'),
  (126, 'Koa Kahale', null, null, null, null, 'Honolulu, HI', null, null, null, 2024, false, '{}'),
  (127, 'Lux Moreno', 'Clinical trials project lead', 'Aster Biosciences', 'Project Lead', 'Biotechnology', 'San Diego, CA', null, null, null, 2014, true, '{Graduate school}'),
  (128, 'Mara Vidal', 'Employment attorney', 'Vidal Law', 'Attorney', 'Law', 'Austin, TX', null, null, 'Advises on offer letters and equity terms.', 2008, true, '{Law school,Negotiating an offer}'),
  (129, 'Nils Bergman', 'Staffing agency owner', 'People Management Group', 'Owner', 'Staffing', 'Boston, MA', null, null, null, 2002, true, '{Managing people}');

-- ---------------------------------------------------------------------------
-- Group I continued (n 130-151): second reserve bench — extra distractor
-- density for the anchor topics (consulting, VC, PM, medicine, negotiation)
-- and more sparse/partial helpers, per the doubled hand-authored core.
-- ---------------------------------------------------------------------------
insert into eval_member
  (n, display_name, headline, employer, title, industry, city, university, major, bio, grad_year, is_helper, topics) values
  (130, 'Odin Vasquez', 'Client development at a consultancy', 'Harlow Advisors', 'Business Development Manager', 'Management consulting', 'Charlotte, NC', null, null, null, 2015, true, '{Negotiating an offer}'),
  (131, 'Pax Whitman', 'Economic consulting, litigation support', 'Cardinal Economics', 'Senior Analyst', 'Economic consulting', 'Washington, DC', null, null, null, 2018, true, '{Graduate school}'),
  (132, 'Quill Andrade', null, 'Meridian Ventures', 'Executive Assistant', 'Venture capital', 'San Francisco, CA', null, null, null, 2020, true, '{First jobs}'),
  (133, 'Rune Sagara', 'Portfolio operations at a growth fund', 'Kestrel Partners', 'Operations Manager', 'Private equity', 'Chicago, IL', null, null, null, 2014, true, '{Managing people}'),
  (134, 'Sable Iverson', 'Product analytics', 'Helix Analytics', 'Product Analyst', 'Technology', 'Denver, CO', null, null, null, 2019, true, '{Data science}'),
  (135, 'Tove Aldana', 'APM program graduate', 'Nimbus Software', 'Product Manager', 'Technology', 'Seattle, WA', null, null, null, 2021, true, '{Product management,First jobs}'),
  (136, 'Usha Rao', null, null, null, null, 'Houston, TX', null, null, null, 2016, true, '{Consulting}'),
  (137, 'Vero Castellanos', 'Med school applications coaching on weekends', 'Bayview Clinic', 'Physician Assistant', 'Healthcare', 'Oakland, CA', null, null, null, 2012, true, '{Medicine}'),
  (138, 'Wren Halloway', null, null, null, null, null, null, null, null, 2018, true, '{Venture capital}'),
  (139, 'Xola Mthembu', 'Offer negotiation for engineers', 'Independent', 'Career Advisor', 'Coaching', 'Remote', null, null, 'Former recruiter; now advises on negotiating an offer without burning the bridge.', 2009, true, '{Negotiating an offer,Interviewing}'),
  (140, 'Yuri Belov', 'Manufacturing operations leadership', 'Ironline Manufacturing', 'Plant Manager', 'Manufacturing', 'Gary, IN', null, null, null, 2004, true, '{Managing people}'),
  (141, 'Zephyr Nakano', 'Freelance brand designer', 'Independent', 'Designer', 'Design', 'Los Angeles, CA', null, null, null, 2017, true, '{Design,Startups}'),
  (142, 'Ansel Marchetti', 'Hospital administration', 'St. Vincent Hospital', 'Administrator', 'Healthcare', 'Boston, MA', null, null, null, 2007, true, '{Managing people}'),
  (143, 'Briar Duval', null, 'The Ledger', 'Copy Editor', 'Media', 'New York, NY', null, null, null, 2019, true, '{Journalism}'),
  (144, 'Cassia Okoro', 'Consumer insights research', 'Solara Brands', 'Insights Manager', 'Consumer goods', 'Atlanta, GA', null, null, null, 2013, true, '{Career changes}'),
  (145, 'Dune Farrow', null, null, null, null, 'Boise, ID', null, null, null, 2022, true, '{Interviewing}'),
  -- both-topic member for the managing+startups coverage case (planted during
  -- the 2026-08-15 counter-candidate sweep; the pair had zero holders):
  (146, 'Ember Nascimento', 'Scaled a support org from 4 to 40', 'Ledgerline', 'Head of Support', 'Fintech', 'San Francisco, CA', null, null, null, 2011, true, '{Managing people,Startups}'),
  (147, 'Fen Alighieri', 'Climate policy analysis', 'Civic Institute', 'Policy Fellow', 'Public policy', 'Washington, DC', null, null, null, 2020, true, '{Public policy,Climate tech}'),
  (148, 'Gale Montoya', null, 'Foothill Capital', 'Office Manager', 'Venture capital', 'Palo Alto, CA', null, null, null, 2015, false, '{}'),
  (149, 'Halcyon Reyes', 'Sales engineering', 'Cobalt Works', 'Sales Engineer', 'Technology', 'Remote', null, null, null, 2016, true, '{Software engineering,Interviewing}'),
  (150, 'Isolde Brennan', 'Second-year consultant', 'Acme Consulting', 'Consultant', 'Management consulting', 'San Francisco, CA', null, null, null, 2023, true, '{Consulting,First jobs}'),
  (151, 'Juno Castellan', 'University career services', 'UT Austin', 'Career Counselor', 'Education', 'Austin, TX', null, null, 'Runs the campus career center; resumes, fairs, and first offers.', 2010, true, '{First jobs,Interviewing}');

-- ---------------------------------------------------------------------------
-- Generated crowd (n 1000-2079): deterministic md5('eval:'||n) generation,
-- sharing the hand-authored topic vocabulary. ~22% opt in as helpers with a
-- weighted topic draw that makes Negotiating an offer / Managing people /
-- Career changes genuinely crowded (>=30 holders each). Tier split ~50%
-- sparse / 30% partial / 20% rich mirrors a real org.
-- ---------------------------------------------------------------------------
insert into eval_member
  (n, display_name, headline, employer, title, industry, city, university, major, bio,
   grad_year, is_helper, open_to_help, max_pending, paused, topics, profile_updated)
select
  g.n,
  fn.name || ' ' || ln.name,
  case when tier.t <> 'sparse' then
    case h.hf % 4
      when 0 then rw.title || ' at ' || rw.employer
      when 1 then 'Working on ' || lower(rw.industry) || ' in ' || split_part(rw.city, ',', 1)
      when 2 then 'Happy to talk about ' || lower(rw.industry) || ' and what comes next'
      else rw.title || ' at ' || rw.employer || '. Previously ' || rw.major || ' at ' || rw.university || '.'
    end
  end,
  case when tier.t <> 'sparse' then rw.employer end,
  case when tier.t <> 'sparse' then rw.title end,
  case when tier.t <> 'sparse' then rw.industry end,
  case when tier.t = 'sparse' and h.hd % 3 = 0 then null else rw.city end,
  case when tier.t = 'rich' then rw.university end,
  case when tier.t = 'rich' then rw.major end,
  case when tier.t = 'rich' then
    'Spent time in ' || lower(rw.industry) || ' after studying ' || lower(rw.major) ||
    '; glad to share what the day-to-day is like.'
  end,
  (1988 + (h.hc % 36))::smallint,
  (h.he % 100) < 22,
  true,
  (5 + (h.hd % 6))::smallint,
  false,
  case
    when (h.he % 100) >= 22 then '{}'::text[]
    when h.hb % 3 = 0 and tp.second is distinct from tp.first then array[tp.first, tp.second]
    else array[tp.first]
  end,
  ('2026-08-01'::date - (h.hc % 540))
from generate_series(1000, 2079) as g(n)
cross join lateral (
  select
    ('x' || substr(md5('eval:a:' || g.n::text), 1, 7))::bit(28)::int as ha,
    ('x' || substr(md5('eval:b:' || g.n::text), 1, 7))::bit(28)::int as hb,
    ('x' || substr(md5('eval:c:' || g.n::text), 1, 7))::bit(28)::int as hc,
    ('x' || substr(md5('eval:d:' || g.n::text), 1, 7))::bit(28)::int as hd,
    ('x' || substr(md5('eval:e:' || g.n::text), 1, 7))::bit(28)::int as he,
    ('x' || substr(md5('eval:f:' || g.n::text), 1, 7))::bit(28)::int as hf
) as h
cross join lateral (
  select case when h.ha % 10 < 5 then 'sparse' when h.ha % 10 < 8 then 'partial' else 'rich' end as t
) as tier
cross join lateral (
  select
    (array['Negotiating an offer','Negotiating an offer','Negotiating an offer','Negotiating an offer',
           'Managing people','Managing people','Managing people','Managing people',
           'Career changes','Career changes','Career changes',
           'Startups','Interviewing','First jobs','Working abroad','Consulting',
           'Product management','Software engineering','Graduate school','Design'])[1 + (h.ha / 5) % 20] as first,
    (array['Negotiating an offer','Negotiating an offer','Negotiating an offer','Negotiating an offer',
           'Managing people','Managing people','Managing people','Managing people',
           'Career changes','Career changes','Career changes',
           'Startups','Interviewing','First jobs','Working abroad','Consulting',
           'Product management','Software engineering','Graduate school','Design'])[1 + (h.hb / 7) % 20] as second
) as tp
cross join lateral (
  select (array['Rowan','Sage','Ellis','Marlow','Avery','Linden','Perry','Sasha','Devon','Emory',
                'Hollis','Arden','Jules','Kendall','Lane','Micah','Noor','Oakley','Reese','Shay',
                'Tatum','Vesper','Winter','Yael','Zion','Blythe','Cove','Darcy','Ever','Frankie'])[1 + g.n % 30] as name
) as fn
cross join lateral (
  select (array['Ashford','Beltran','Caruso','Dawson','Eastman','Fairbanks','Galloway','Hartwell','Ibarra','Jennings',
                'Kimura','Lachlan','Mercer','Navarro','Oyelaran','Pemberton','Quintero','Rutherford','Santana','Thackeray',
                'Ueda','Valencia','Whitfield','Xu','Yamada','Zielinski','Abernathy','Boswell','Cardona','Delacroix',
                'Emerson','Fontana','Grimaldi','Holloway','Iverson','Joubert'])[1 + (g.n / 30) % 36] as name
) as ln
cross join lateral (
  select
    (array['Northwind Retail','Ledgerline','Brightside Apps','Cobalt Works','Polar Freight','Ashford & Co',
           'Helix Analytics','Fjord Systems','Nimbus Software','Solara Brands','Granite Retail','Harbor Foundation',
           'Civic Institute','The Ledger','Loop Studio','Verdant Energy','Meridian Logistics','Aster Biosciences',
           'Palm & Tide Resorts','Keystone Build','Trattoria Group','Bayview Clinic','Stateside Insurance','Atlas Group'])[1 + h.hb % 24] as employer,
    (array['Analyst','Senior Analyst','Manager','Senior Manager','Director','Coordinator','Specialist','Lead',
           'Associate','Senior Associate','Consultant','Engineer','Senior Engineer','Designer','Account Executive','Operations Manager'])[1 + h.hc % 16] as title,
    (array['Technology','Healthcare','Finance','Education','Retail','Logistics','Media','Nonprofit',
           'Hospitality','Insurance','Climate','Design','Manufacturing','Government'])[1 + h.hd % 14] as industry,
    (array['New York, NY','San Francisco, CA','Los Angeles, CA','Chicago, IL','Boston, MA','Seattle, WA',
           'Austin, TX','Denver, CO','Atlanta, GA','Portland, OR','Washington, DC','Miami, FL',
           'Minneapolis, MN','Philadelphia, PA','Phoenix, AZ','Columbus, OH'])[1 + h.he % 16] as city,
    (array['UCLA','Stanford University','University of Michigan','UT Austin','NYU','Georgetown University',
           'Northwestern University','Ohio State','University of Washington','Duke University','Cornell University',
           'UC Berkeley','Boston University','Emory University','Rice University','Penn State'])[1 + h.hf % 16] as university,
    (array['Economics','Computer Science','Business Administration','Biology','Political Science','Psychology',
           'English','History','Statistics','Mechanical Engineering','Communications','Public Policy'])[1 + (h.hf / 16) % 12] as major
) as rw;

-- ---------------------------------------------------------------------------
-- Fan out: auth.users (one bcrypt hash computed once), identities, users,
-- memberships, profiles, org profiles, helper prefs, topics.
-- ---------------------------------------------------------------------------
with pw as (
  select extensions.crypt('eval-password', extensions.gen_salt('bf')) as hash
)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000',
  ('ee000000-0000-4000-8000-' || lpad(m.n::text, 12, '0'))::uuid,
  'authenticated',
  'authenticated',
  case
    when m.n <= 3 then 'viewer-' || m.n || '@eval.test'
    when m.n < 1000 then 'helper-' || lpad(m.n::text, 3, '0') || '@eval.test'
    else 'member-' || m.n || '@eval.test'
  end,
  pw.hash,
  '2026-08-01T00:00:00Z',
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', m.display_name),
  '2026-08-01T00:00:00Z', '2026-08-01T00:00:00Z', '', '', '', ''
from eval_member m, pw;

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  u.id::text,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  'email', '2026-08-01T00:00:00Z', '2026-08-01T00:00:00Z', '2026-08-01T00:00:00Z'
from auth.users u
where u.id::text like 'ee000000-0000-4000-8000-%';

update public.users
set onboarding_completed_at = '2026-08-01T00:00:00Z'
where id::text like 'ee000000-0000-4000-8000-%';

insert into public.organization_memberships (id, user_id, organization_id, status, joined_at)
select
  ('ee111111-1111-4111-8111-' || lpad(m.n::text, 12, '0'))::uuid,
  ('ee000000-0000-4000-8000-' || lpad(m.n::text, 12, '0'))::uuid,
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'active',
  m.profile_updated - 200
from eval_member m;

insert into public.profiles (
  user_id, display_name, headline, current_employer, current_title,
  industry, city, university, major, updated_at
)
select
  ('ee000000-0000-4000-8000-' || lpad(m.n::text, 12, '0'))::uuid,
  m.display_name, m.headline, m.employer, m.title,
  m.industry, m.city, m.university, m.major,
  m.profile_updated
from eval_member m;

insert into public.organization_profiles (
  organization_membership_id, organization_id, graduation_year, bio
)
select
  ('ee111111-1111-4111-8111-' || lpad(m.n::text, 12, '0'))::uuid,
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  m.grad_year,
  m.bio
from eval_member m;

insert into public.helper_preferences (
  organization_membership_id, organization_id, open_to_help,
  max_pending_requests, paused_at, pause_reason
)
select
  ('ee111111-1111-4111-8111-' || lpad(m.n::text, 12, '0'))::uuid,
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  m.open_to_help,
  m.max_pending,
  case when m.paused then '2026-07-15T00:00:00Z'::timestamptz end,
  case when m.paused then 'manual' end
from eval_member m
where m.is_helper;

insert into public.helper_topics (
  organization_membership_id, organization_id, name, normalized_name, sort_order
)
select
  ('ee111111-1111-4111-8111-' || lpad(m.n::text, 12, '0'))::uuid,
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  t.name,
  lower(btrim(t.name)),
  (t.ord - 1)::smallint
from eval_member m
cross join lateral unnest(m.topics) with ordinality as t(name, ord)
where m.is_helper;

-- ---------------------------------------------------------------------------
-- Hand-authored experiences: D-weight signal carriers.
-- ---------------------------------------------------------------------------
insert into public.profile_experiences (user_id, employer, title, start_year, end_year, description, sort_order)
values
  -- Ivy Cheng (n 49): the career-change story lives ONLY here (D-weight case).
  ('ee000000-0000-4000-8000-000000000049', 'Mercy Hospital', 'Registered Nurse', 2012, 2019, 'Clinical nursing in the cardiac unit.', 0),
  ('ee000000-0000-4000-8000-000000000049', 'HealthBridge', 'Product Manager', 2019, null, 'Moved from nursing into health-tech product management; owns the clinician-facing app.', 1),
  -- Ana Ferreira (n 10): consulting depth for evidence realism.
  ('ee000000-0000-4000-8000-000000000010', 'BCG', 'Associate', 2014, 2017, 'Generalist consulting across consumer and industrial clients.', 0),
  -- Elias Vance (n 45): the McKinsey history behind the headline signal.
  ('ee000000-0000-4000-8000-000000000045', 'McKinsey & Company', 'Business Analyst', 2009, 2012, 'Generalist analyst; left for the classroom.', 0),
  -- Jem Barlow (n 125): banking-to-teaching change story.
  ('ee000000-0000-4000-8000-000000000125', 'Ashford & Co', 'Associate', 2005, 2015, 'Investment banking coverage.', 0);

-- ---------------------------------------------------------------------------
-- Seeded waiting asks: capacity gate + tiebreak twins.
-- Iona (n 88, max_pending=1) gets 1 waiting ask -> permanently at capacity.
-- Dara (n 78) gets 2 waiting asks; twin Erin (n 79) gets 0.
-- ---------------------------------------------------------------------------
insert into public.asks (
  id, organization_id, asker_membership_id, kind, status, recipient_membership_id,
  question, request_message, client_request_id, expires_at, created_at
) values
  ('ee222222-2222-4222-8222-000000000001', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
   'ee111111-1111-4111-8111-000000000001', 'direct', 'waiting', 'ee111111-1111-4111-8111-000000000088',
   'Could we talk through coaching a struggling new manager?', 'Would value thirty minutes of your time.',
   'ee333333-3333-4333-8333-000000000001', '2027-01-01T00:00:00Z', '2026-08-01T00:00:00Z'),
  ('ee222222-2222-4222-8222-000000000002', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
   'ee111111-1111-4111-8111-000000000001', 'direct', 'waiting', 'ee111111-1111-4111-8111-000000000078',
   'Can you help me rehearse for a panel interview?', 'Big interview in two weeks.',
   'ee333333-3333-4333-8333-000000000002', '2027-01-01T00:00:00Z', '2026-08-01T00:00:00Z'),
  ('ee222222-2222-4222-8222-000000000003', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
   'ee111111-1111-4111-8111-000000000002', 'direct', 'waiting', 'ee111111-1111-4111-8111-000000000078',
   'Would you mock-interview me for a director role?', 'Happy to work around your schedule.',
   'ee333333-3333-4333-8333-000000000003', '2027-01-01T00:00:00Z', '2026-08-01T00:00:00Z');

-- viewer-2 blocks Jules Aubert (n 89): block-eligibility case pair.
insert into public.member_blocks (blocker_user_id, blocked_user_id)
values ('ee000000-0000-4000-8000-000000000002', 'ee000000-0000-4000-8000-000000000089');

-- viewer-1 is connected to Ana Ferreira (future connections-tier cases).
insert into public.connections (user_a_id, user_b_id, origin_organization_id)
values ('ee000000-0000-4000-8000-000000000001', 'ee000000-0000-4000-8000-000000000010',
        'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');

drop table eval_member;

end
$eval$;
