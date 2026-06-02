/**
 * Seed the bridgecircle-dev Supabase project with deterministic fake data.
 *
 * Run from app/:
 *   SEED_CONFIRM=YES pnpm dlx tsx --env-file=.env.local scripts/seed-dev.ts
 *
 * What it does:
 *   - Wipes the relevant tables in the dev database.
 *   - Re-creates a small, hand-curated set of fake users, profiles, mentors,
 *     mentorship requests, events, and RSVPs that exercise the Phase 1 flows.
 *   - Prints a summary so you can sanity-check what landed.
 *
 * Prerequisites:
 *   - .env.local points at bridgecircle-dev (NOT production).
 *   - 0001_init has been applied to bridgecircle-dev. Without those tables,
 *     the script fails on the first insert with "relation does not exist".
 *   - The auth trigger from 0001_init auto-creates public.users rows when
 *     auth.admin.createUser is called — this script relies on that.
 *
 * Safety:
 *   - Refuses to run unless SEED_CONFIRM=YES is set.
 *   - Refuses to run when NODE_ENV=production.
 *   - Refuses to run if the configured Supabase URL matches PROD_PROJECT_REF
 *     (set this in .env.local to your prod project ref as a belt-and-braces
 *     guard).
 *   - Prints the target URL before doing anything destructive so you can
 *     abort with Ctrl+C if it points at the wrong project.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Safety
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY
const PROD_PROJECT_REF = process.env.PROD_PROJECT_REF

function refuse(reason: string): never {
  console.error(`\n[seed-dev] refusing to run: ${reason}\n`)
  process.exit(1)
}

if (process.env.SEED_CONFIRM !== 'YES') {
  refuse('SEED_CONFIRM=YES not set. Re-run with SEED_CONFIRM=YES to confirm.')
}

if (process.env.NODE_ENV === 'production') {
  refuse('NODE_ENV=production. This script is for the dev database only.')
}

if (!SUPABASE_URL || !SUPABASE_SECRET) {
  refuse('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in env.')
}

if (PROD_PROJECT_REF && SUPABASE_URL.includes(PROD_PROJECT_REF)) {
  refuse(`SUPABASE_URL appears to be production (matches PROD_PROJECT_REF=${PROD_PROJECT_REF}).`)
}

const admin: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SECRET, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ---------------------------------------------------------------------------
// Curated fake data
//
// Hand-curated rather than random so test scenarios are recognizable and
// reproducible. Update emails/personas here when you want to add new ones.
// ---------------------------------------------------------------------------

const ORG = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Chadwick School (DEV)',
  slug: 'chadwick-dev',
}

type AdminRole = 'super_admin' | 'admin' | 'event_moderator' | 'ambassador'

type CareerEntry = {
  employer: string
  title: string
  start_date: string | null
  end_date: string | null
  description: string | null
}

type EducationEntry = {
  school: string
  degree: string | null
  field: string | null
  start_date: string | null
  end_date: string | null
}

type Persona = {
  email: string
  password: string
  name: string
  gradYear: number
  city: string | null
  employer: string | null
  title: string | null
  university: string | null
  major: string | null
  bio?: string | null
  linkedinUrl?: string | null
  openToMentor: boolean
  mentorTopics?: string[]
  maxPending?: number
  maxActive?: number
  pausedAt?: string
  adminRole?: AdminRole
  careerHistory?: CareerEntry[]
  educationHistory?: EducationEntry[]
  skills?: string[]
}

const PERSONAS: Persona[] = [
  {
    email: 'admin-amy@example.com',
    password: 'devseed-password-1',
    name: 'Amy Admin',
    gradYear: 2005,
    city: 'Palos Verdes, CA',
    employer: 'Chadwick School',
    title: 'Alumni Board Chair',
    university: 'Stanford University',
    major: 'Public Policy',
    linkedinUrl: 'https://linkedin.com/in/amy-admin-chadwick',
    openToMentor: false,
    adminRole: 'super_admin',
    careerHistory: [
      {
        employer: 'Chadwick School',
        title: 'Alumni Board Chair',
        start_date: '2020',
        end_date: null,
        description: 'Volunteer role coordinating alumni engagement and the annual giving campaign.',
      },
      {
        employer: 'Bain & Company',
        title: 'Senior Manager',
        start_date: '2010',
        end_date: '2020',
        description: 'Public sector and education practice.',
      },
    ],
    educationHistory: [
      { school: 'Stanford University', degree: 'AB', field: 'Public Policy', start_date: '2001', end_date: '2005' },
    ],
    skills: ['nonprofit governance', 'fundraising', 'public policy', 'community organizing'],
  },
  {
    email: 'mentor-mark@example.com',
    password: 'devseed-password-2',
    name: 'Mark Mentor',
    gradYear: 2008,
    city: 'San Francisco, CA',
    employer: 'Acme Consulting',
    title: 'Senior Partner',
    university: 'University of Pennsylvania',
    major: 'Economics',
    bio: 'Open to ~30min calls with current students or recent grads.',
    linkedinUrl: 'https://linkedin.com/in/mark-mentor-acme',
    openToMentor: true,
    mentorTopics: ['consulting', 'career change', 'business school'],
    maxPending: 5,
    maxActive: 3,
    careerHistory: [
      {
        employer: 'Acme Consulting',
        title: 'Senior Partner',
        start_date: '2018',
        end_date: null,
        description: 'Lead the financial services practice; advising on growth strategy and M&A.',
      },
      {
        employer: 'McKinsey & Company',
        title: 'Engagement Manager',
        start_date: '2014',
        end_date: '2018',
        description: 'Strategy projects across consumer and financial services clients.',
      },
      {
        employer: 'McKinsey & Company',
        title: 'Business Analyst',
        start_date: '2008',
        end_date: '2010',
        description: 'Pre-MBA generalist role.',
      },
    ],
    educationHistory: [
      { school: 'Harvard Business School', degree: 'MBA', field: null, start_date: '2012', end_date: '2014' },
      { school: 'University of Pennsylvania', degree: 'BA', field: 'Economics', start_date: '2004', end_date: '2008' },
    ],
    skills: ['strategy', 'consulting', 'financial modeling', 'M&A', 'business school'],
  },
  {
    email: 'mentor-mei@example.com',
    password: 'devseed-password-3',
    name: 'Mei Mentor',
    gradYear: 2012,
    city: 'Seoul, South Korea',
    employer: 'Hyundai Motor',
    title: 'Product Director',
    university: 'Yonsei University',
    major: 'Industrial Engineering',
    bio: 'Happy to chat about the PM transition, relocating to Asia, or pivoting from creative roles into product.',
    linkedinUrl: 'https://linkedin.com/in/mei-mentor-hyundai',
    openToMentor: true,
    mentorTopics: ['product management', 'returning to Korea', 'engineering to PM'],
    maxPending: 10,
    maxActive: 5,
    // Mei's career path is the demo target for Day 10's NL search:
    // a query like "photography mentor" should surface her despite her
    // current title being "Product Director" — the LLM rerank step will
    // see the past roles in careerHistory.
    careerHistory: [
      {
        employer: 'Hyundai Motor',
        title: 'Product Director',
        start_date: '2021',
        end_date: null,
        description: 'Lead the in-vehicle infotainment product team across global markets.',
      },
      {
        employer: 'Kakao',
        title: 'Senior Product Manager',
        start_date: '2018',
        end_date: '2021',
        description: 'Owned the visual search and image-recognition product line.',
      },
      {
        employer: 'Naver',
        title: 'Product Designer',
        start_date: '2014',
        end_date: '2018',
        description: 'Visual design and user research for Naver Photos and the camera app.',
      },
      {
        employer: 'Vogue Korea',
        title: 'Photo Editor',
        start_date: '2012',
        end_date: '2014',
        description: 'Editorial photo selection and on-set art direction for fashion shoots.',
      },
    ],
    educationHistory: [
      { school: 'Yonsei University', degree: 'BS', field: 'Industrial Engineering', start_date: '2008', end_date: '2012' },
    ],
    skills: [
      'product management',
      'design systems',
      'photo editing',
      'art direction',
      'visual search',
      'Korean',
    ],
  },
  {
    email: 'mentor-fully-booked@example.com',
    password: 'devseed-password-4',
    name: 'Felix Atcapacity',
    gradYear: 2010,
    city: 'New York, NY',
    employer: 'Goldman Sachs',
    title: 'VP, Equity Research',
    university: 'Harvard University',
    major: 'Mathematics',
    bio: 'Currently at max mentee capacity.',
    linkedinUrl: 'https://linkedin.com/in/felix-atcapacity-gs',
    openToMentor: true,
    mentorTopics: ['finance', 'investment banking'],
    // Intentionally low so we can test the capacity-full state in the UI.
    maxPending: 1,
    maxActive: 1,
    careerHistory: [
      {
        employer: 'Goldman Sachs',
        title: 'VP, Equity Research',
        start_date: '2018',
        end_date: null,
        description: 'Cover the US semiconductors sector.',
      },
      {
        employer: 'Goldman Sachs',
        title: 'Associate, Equity Research',
        start_date: '2014',
        end_date: '2018',
        description: null,
      },
      {
        employer: 'JPMorgan Chase',
        title: 'Investment Banking Analyst',
        start_date: '2010',
        end_date: '2012',
        description: 'TMT coverage group.',
      },
    ],
    educationHistory: [
      { school: 'Columbia Business School', degree: 'MBA', field: null, start_date: '2012', end_date: '2014' },
      { school: 'Harvard University', degree: 'AB', field: 'Mathematics', start_date: '2006', end_date: '2010' },
    ],
    skills: ['equity research', 'capital markets', 'semiconductors', 'financial modeling'],
  },
  {
    email: 'mentor-paused@example.com',
    password: 'devseed-password-5',
    name: 'Paula Paused',
    gradYear: 2009,
    city: 'Boston, MA',
    employer: 'Mass General Hospital',
    title: 'Attending Physician',
    university: 'Johns Hopkins University',
    major: 'Biology',
    bio: 'Paused while away.',
    linkedinUrl: 'https://linkedin.com/in/paula-paused-mgh',
    // is_open=true but paused_at set: tests the "paused while away" UI state.
    openToMentor: true,
    mentorTopics: ['medicine', 'med school applications'],
    pausedAt: new Date().toISOString(),
    careerHistory: [
      {
        employer: 'Mass General Hospital',
        title: 'Attending Physician',
        start_date: '2017',
        end_date: null,
        description: 'Internal medicine, hospitalist track.',
      },
      {
        employer: 'Johns Hopkins Hospital',
        title: 'Resident Physician',
        start_date: '2014',
        end_date: '2017',
        description: null,
      },
    ],
    educationHistory: [
      { school: 'Johns Hopkins School of Medicine', degree: 'MD', field: null, start_date: '2010', end_date: '2014' },
      { school: 'Johns Hopkins University', degree: 'BS', field: 'Biology', start_date: '2005', end_date: '2009' },
    ],
    skills: ['internal medicine', 'med school applications', 'clinical research'],
  },
  {
    email: 'student-sam@example.com',
    password: 'devseed-password-6',
    name: 'Sam Student',
    gradYear: 2024,
    city: 'Los Angeles, CA',
    employer: 'UCLA',
    title: 'Senior, Computer Science',
    university: 'UCLA',
    major: 'Computer Science',
    linkedinUrl: 'https://linkedin.com/in/sam-student-ucla',
    openToMentor: false,
    educationHistory: [
      { school: 'UCLA', degree: 'BS', field: 'Computer Science', start_date: '2020', end_date: '2024' },
    ],
    skills: ['python', 'data analysis', 'machine learning'],
  },
  {
    email: 'recent-grad-ria@example.com',
    password: 'devseed-password-7',
    name: 'Ria Recent',
    gradYear: 2022,
    city: 'San Francisco, CA',
    employer: 'Stripe',
    title: 'Software Engineer',
    university: 'UC Berkeley',
    major: 'Computer Science',
    linkedinUrl: 'https://linkedin.com/in/ria-recent-stripe',
    openToMentor: false,
    careerHistory: [
      {
        employer: 'Stripe',
        title: 'Software Engineer',
        start_date: '2022',
        end_date: null,
        description: 'Backend engineering on the payments platform.',
      },
    ],
    educationHistory: [
      { school: 'UC Berkeley', degree: 'BS', field: 'Computer Science', start_date: '2018', end_date: '2022' },
    ],
    skills: ['typescript', 'distributed systems', 'payments'],
  },
  {
    email: 'recent-grad-rohan@example.com',
    password: 'devseed-password-8',
    name: 'Rohan Recent',
    gradYear: 2021,
    city: 'Seattle, WA',
    employer: 'Microsoft',
    title: 'Product Manager',
    university: 'University of Washington',
    major: 'Business Administration',
    linkedinUrl: 'https://linkedin.com/in/rohan-recent-msft',
    openToMentor: false,
    careerHistory: [
      {
        employer: 'Microsoft',
        title: 'Product Manager',
        start_date: '2021',
        end_date: null,
        description: 'PM on Azure developer experience.',
      },
    ],
    educationHistory: [
      { school: 'University of Washington', degree: 'BBA', field: 'Business Administration', start_date: '2017', end_date: '2021' },
    ],
    skills: ['product management', 'developer tools', 'cloud'],
  },
  {
    email: 'incomplete-iris@example.com',
    password: 'devseed-password-9',
    name: 'Iris Incomplete',
    gradYear: 2023,
    city: null,
    employer: null,
    title: null,
    university: null,
    major: null,
    bio: 'Profile intentionally left incomplete to test profile-completion prompts.',
    openToMentor: false,
  },
  {
    email: 'richard@example.com',
    password: 'devseed-password-richard',
    name: 'Richard Lee',
    gradYear: 2018,
    city: 'San Francisco, CA',
    employer: 'Common Capital',
    title: 'Investment Associate',
    university: 'Stanford University',
    major: 'Computer Science',
    bio: 'Alumnus Class of 2018. Focused on tech investing.',
    openToMentor: true,
    mentorTopics: ['venture capital', 'tech careers'],
    maxPending: 5,
    maxActive: 3,
  },
  {
    email: 'alexander@example.com',
    password: 'devseed-password-alexander',
    name: 'Alexander Kim',
    gradYear: 2022,
    city: 'Seoul, Korea',
    employer: 'Toss',
    title: 'Financial Analyst',
    university: 'Yonsei University',
    major: 'Business Administration',
    bio: 'Recent graduate interested in fintech strategy and banking transition paths.',
    openToMentor: false,
  },
  {
    email: 'iris@example.com',
    password: 'devseed-password-iris',
    name: 'Iris Okonkwo',
    gradYear: 2011,
    city: 'Brooklyn, NY',
    employer: 'Common Capital',
    title: 'VP Investments',
    university: 'Harvard University',
    major: 'Economics',
    bio: 'Focusing on climate tech and seed-stage infrastructure underwriting.',
    openToMentor: true,
    mentorTopics: ['Climate Tech', 'Fundraising'],
    maxPending: 3,
    maxActive: 5,
  },
  {
    email: 'dev@example.com',
    password: 'devseed-password-dev',
    name: 'Dev Patel',
    gradYear: 2021,
    city: 'San Francisco, CA',
    employer: 'Stripe',
    title: 'Data Scientist',
    university: 'UC Berkeley',
    major: 'Data Science',
    bio: 'Interested in machine learning and data engineering.',
    openToMentor: false,
  },
  {
    email: 'sarah@example.com',
    password: 'devseed-password-sarah',
    name: 'Sarah Lee',
    gradYear: 2012,
    city: 'San Francisco, CA',
    employer: 'Airbnb',
    title: 'Product Director',
    university: 'Stanford University',
    major: 'Product Design',
    bio: 'Leading product teams in hospitality and travel space.',
    openToMentor: false,
  },
  {
    email: 'jessica@example.com',
    password: 'devseed-password-jessica',
    name: 'Dr. Jessica Wong',
    gradYear: 2008,
    city: 'Chicago, IL',
    employer: 'Mayo Clinic',
    title: 'Cardiologist',
    university: 'Harvard Medical School',
    major: 'Medicine',
    bio: 'Cardiologist interested in helping pre-med students.',
    openToMentor: true,
    mentorTopics: ['medicine', 'cardiology'],
  },
]

const EVENTS = [
  {
    id: 'eeee0000-0000-0000-0000-000000000001',
    title: 'Spring Alumni Mixer (Palos Verdes)',
    description: 'Casual evening drinks at the Palos Verdes campus. Join your fellow Chadwick graduates for structured advisory discussions and local mentorship matching.',
    location: 'Chadwick School Main Campus',
    startsAt: futureIso(14),
    capacity: 50,
  },
  {
    id: 'eeee0000-0000-0000-0000-000000000002',
    title: 'Songdo Alumni Coffee',
    description: 'Saturday morning coffee meetup for Chadwick International alumni in Seoul.',
    location: 'Cafe Onion, Songdo',
    startsAt: futureIso(21),
    capacity: 15,
  },
  {
    id: 'eeee0000-0000-0000-0000-000000000003',
    title: 'Tech & Product Roundtable',
    description:
      'A focused roundtable for alumni working across product, engineering, and design.',
    location: 'The Hartwood Library & Terrace, SF',
    startsAt: futureIso(5),
    capacity: 100,
  },
  {
    id: 'eeee0000-0000-0000-0000-000000000004',
    title: 'Winter Holiday Dinner',
    description: 'Our annual end-of-year dinner celebration for local alumni.',
    location: 'The Athenaeum, Pasadena',
    startsAt: pastIso(30),
    capacity: 40,
  },
  {
    id: 'eeee0000-0000-0000-0000-000000000005',
    title: 'Creative Careers Panel',
    description: 'A moderated conversation with Chadwick alumni in media, art direction, photography, and design.',
    location: 'Soho House, West Hollywood',
    startsAt: pastIso(45),
    capacity: 25,
  },
]

function futureIso(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString()
}

function pastIso(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}


// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

async function wipe() {
  // Lean on the cascade rules in 0001_init:
  //   1. Deleting seeded auth users cascades through public.users to
  //      base_profiles, organization_memberships (→ organization_profiles,
  //      mentorship_preferences), mentorship_requests / threads, messages,
  //      event_rsvps, admin_role_assignments, friend_*, notifications,
  //      saved_searches.
  //   2. Deleting the org cascades to events, invites, announcements, and any
  //      stragglers tied to organization_id rather than user_id.
  // audit_log rows survive (FKs are ON DELETE SET NULL) — fine because the
  // seed never writes to audit_log.
  const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  for (const u of users?.users ?? []) {
    if (PERSONAS.some((p) => p.email === u.email)) {
      await admin.auth.admin.deleteUser(u.id)
    }
  }

  const { error: orgError } = await admin.from('organizations').delete().eq('id', ORG.id)
  if (orgError && !orgError.message.includes('does not exist')) throw orgError

  console.log('[seed-dev] wiped existing seed data')
}

async function createOrg() {
  const { error } = await admin.from('organizations').insert({
    id: ORG.id,
    name: ORG.name,
    slug: ORG.slug,
  })
  if (error) throw error
  console.log(`[seed-dev] org: ${ORG.name}`)
}

async function createUsersAndProfiles() {
  for (const p of PERSONAS) {
    // Auth admin create: the on_auth_user_created trigger inserts into
    // public.users. We then layer profile + membership + preference rows.
    const { data, error } = await admin.auth.admin.createUser({
      email: p.email,
      password: p.password,
      email_confirm: true,
      user_metadata: { full_name: p.name },
    })
    if (error) throw error
    const userId = data.user.id

    const { error: userUpdateError } = await admin
      .from('users')
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq('id', userId)
    if (userUpdateError) throw userUpdateError

    const { error: baseProfileError } = await admin.from('base_profiles').insert({
      user_id: userId,
      name: p.name,
      current_employer: p.employer,
      current_title: p.title,
      city: p.city,
      university: p.university,
      major: p.major,
      linkedin_url: p.linkedinUrl ?? null,
      career_history: p.careerHistory ?? null,
      education_history: p.educationHistory ?? null,
      skills: p.skills ?? null,
    })
    if (baseProfileError) throw baseProfileError

    const { data: membership, error: mbError } = await admin
      .from('organization_memberships')
      .insert({
        user_id: userId,
        organization_id: ORG.id,
        status: 'active',
        joined_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    if (mbError) throw mbError
    const membershipId = membership.id

    const { error: orgProfileError } = await admin.from('organization_profiles').insert({
      organization_membership_id: membershipId,
      graduation_year: p.gradYear,
      bio: p.bio ?? null,
      mentoring_topics: p.mentorTopics ?? null,
      open_to_mentor: p.openToMentor,
    })
    if (orgProfileError) throw orgProfileError

    if (p.openToMentor) {
      const { error: prefError } = await admin.from('helper_preferences').insert({
        organization_membership_id: membershipId,
        open_to_advice: true,
        open_to_mentorship: true,
        topics: p.mentorTopics ?? [],
        max_pending_requests: p.maxPending ?? 10,
        max_active_mentees: p.maxActive ?? 5,
        paused_at: p.pausedAt ?? null,
      })
      if (prefError) throw prefError
    }

    if (p.adminRole) {
      const { error: roleError } = await admin.from('admin_role_assignments').insert({
        user_id: userId,
        organization_id: ORG.id,
        role: p.adminRole,
      })
      if (roleError) throw roleError
    }

    console.log(`[seed-dev] user: ${p.name} <${p.email}>  auth.id=${userId}`)
  }
}

async function createMentorshipScenarios() {
  const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const idByEmail = new Map<string, string>()
  for (const u of usersList?.users ?? []) {
    if (u.email) idByEmail.set(u.email, u.id)
  }

  const sam = idByEmail.get('student-sam@example.com')!
  const ria = idByEmail.get('recent-grad-ria@example.com')!
  const rohan = idByEmail.get('recent-grad-rohan@example.com')!
  const mark = idByEmail.get('mentor-mark@example.com')!
  const mei = idByEmail.get('mentor-mei@example.com')!
  const felix = idByEmail.get('mentor-fully-booked@example.com')!
  const richard = idByEmail.get('richard@example.com')!
  const alexander = idByEmail.get('alexander@example.com')!
  const iris = idByEmail.get('iris@example.com')!
  const jessica = idByEmail.get('jessica@example.com')!

  const requests = [
    {
      organization_id: ORG.id,
      ask_type: 'mentorship' as const,
      asker_id: sam,
      helper_id: mark,
      reason: 'Trying to decide between consulting and product roles after graduation.',
      help_needed: 'Looking for a 30-min call about how to evaluate the two paths.',
      status: 'pending' as const,
    },
    {
      organization_id: ORG.id,
      ask_type: 'mentorship' as const,
      asker_id: ria,
      helper_id: mei,
      reason: 'Considering a move from Stripe SF to a PM role in Korea.',
      help_needed: 'Want to talk about engineering -> PM transition and Seoul tech scene.',
      status: 'accepted' as const,
      responded_at: new Date().toISOString(),
    },
    {
      organization_id: ORG.id,
      ask_type: 'mentorship' as const,
      asker_id: rohan,
      helper_id: felix,
      reason: 'Curious about transitioning from PM to investment banking.',
      help_needed: 'Open to a quick chat about whether the move makes sense.',
      status: 'declined' as const,
      responded_at: new Date().toISOString(),
    },
    {
      organization_id: ORG.id,
      ask_type: 'advice' as const,
      asker_id: rohan,
      helper_id: mark,
      reason: 'Preparing for consulting interviews and need feedback on my resume format.',
      help_needed: 'Looking for a quick review of my consulting resume to make sure it highlights the right things.',
      status: 'accepted' as const,
      responded_at: new Date().toISOString(),
    },
    {
      organization_id: ORG.id,
      ask_type: 'advice' as const,
      asker_id: ria,
      helper_id: mark,
      reason: 'How do you think about MBA programs for software engineers?',
      help_needed: 'Hoping to get advice on whether business school makes sense for tech.',
      status: 'pending' as const,
    },
    {
      organization_id: ORG.id,
      ask_type: 'mentorship' as const,
      asker_id: alexander,
      helper_id: richard,
      reason: "Hey Richard, I'm looking for a mentor to guide me through my transition from engineering to product management. I saw you made a similar move and would love to learn from your experience.",
      help_needed: 'Career transition advice',
      status: 'pending' as const,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      organization_id: ORG.id,
      ask_type: 'mentorship' as const,
      asker_id: richard,
      helper_id: jessica,
      reason: "Hi Dr. Wong, I'm a pre-med student at Cornell and would love to ask you a couple of questions about choosing cardiology as a specialty.",
      help_needed: 'Pre-med guidance',
      status: 'pending' as const,
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    // Richard's own outgoing asks — populate the "Your asks" home rail with a
    // varied trio (active / pending / declined).
    {
      organization_id: ORG.id,
      ask_type: 'advice' as const,
      asker_id: richard,
      helper_id: mark,
      reason: 'Sanity-checking my jump from engineering into product management.',
      help_needed: 'Would value 20 minutes on how to frame the transition for hiring managers.',
      status: 'accepted' as const,
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      responded_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      organization_id: ORG.id,
      ask_type: 'mentorship' as const,
      asker_id: richard,
      helper_id: felix,
      reason: 'Hoping to learn how you scaled a startup engineering team.',
      help_needed: 'Looking for an ongoing mentor as I move into a lead role.',
      status: 'declined' as const,
      created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      responded_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      organization_id: ORG.id,
      ask_type: 'advice' as const,
      asker_id: iris,
      helper_id: richard,
      reason: 'Portfolio Review & Framing',
      help_needed: 'Review my design critique slide deck outline',
      status: 'accepted' as const,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      responded_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    },
  ]

  for (const r of requests) {
    const { data: req, error } = await admin
      .from('asks')
      .insert(r)
      .select('id, helper_id, asker_id, status, ask_type')
      .single()
    if (error) throw error

    if (req.status === 'accepted') {
      const { data: thread, error: threadError } = await admin
        .from('ask_threads')
        .insert({
          ask_id: req.id,
          helper_id: req.helper_id,
          asker_id: req.asker_id,
        })
        .select('id')
        .single()
      if (threadError) throw threadError

      // Seed messages for the accepted threads to make them look active
      if (req.asker_id === ria && req.helper_id === mei) {
        const riaMeiMessages = [
          {
            thread_id: thread.id,
            thread_type: 'ask' as const,
            sender_id: ria,
            body: "Hi Mei! Thank you so much for accepting my request. I'd love to talk about transitioning to product roles in Seoul.",
            created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
            read_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
          },
          {
            thread_id: thread.id,
            thread_type: 'ask' as const,
            sender_id: mei,
            body: "Hi Ria! Yes, it's a big move but super rewarding. I transitioned from photo editing at Vogue into product at Hyundai and Kakao. What questions do you have?",
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            read_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            thread_id: thread.id,
            thread_type: 'ask' as const,
            sender_id: ria,
            body: "I'm curious about the work culture differences and if it's necessary to speak fluent Korean in PM roles there.",
            created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            read_at: null, // unread by Mei
          },
        ]
        const { error: msgErr } = await admin.from('messages').insert(riaMeiMessages)
        if (msgErr) throw msgErr

        await admin
          .from('ask_threads')
          .update({ last_message_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() })
          .eq('id', thread.id)
      } else if (req.asker_id === rohan && req.helper_id === mark) {
        const rohanMarkMessages = [
          {
            thread_id: thread.id,
            thread_type: 'ask' as const,
            sender_id: rohan,
            body: "Hi Mark! Thanks for accepting my advice request. Here is a brief snippet of my background in tech.",
            created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            read_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          },
          {
            thread_id: thread.id,
            thread_type: 'ask' as const,
            sender_id: mark,
            body: "Hey Rohan, happy to help. Send over a link to your resume or paste the key points here and I will take a look.",
            created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
            read_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
          },
        ]
        const { error: msgErr } = await admin.from('messages').insert(rohanMarkMessages)
        if (msgErr) throw msgErr

        await admin
          .from('ask_threads')
          .update({ last_message_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString() })
          .eq('id', thread.id)
      } else if (req.asker_id === iris && req.helper_id === richard) {
        const irisRichardMessages = [
          {
            thread_id: thread.id,
            thread_type: 'ask' as const,
            sender_id: iris,
            body: "Hi Richard, hope you're doing well! I'm prepping a presentation for our design critique next week. Would you have 15 minutes to review my slide deck outline?",
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            read_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            thread_id: thread.id,
            thread_type: 'ask' as const,
            sender_id: richard,
            body: "Hi Iris! Absolutely, I'd love to help. Feel free to drop a link to the deck or upload it here.",
            created_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
            read_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
          },
          {
            thread_id: thread.id,
            thread_type: 'ask' as const,
            sender_id: iris,
            body: "Awesome! Here's the link. Let me know if the problem framing reads clearly.",
            created_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
            read_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
          },
        ]
        const { error: msgErr } = await admin.from('messages').insert(irisRichardMessages)
        if (msgErr) throw msgErr

        await admin
          .from('ask_threads')
          .update({ last_message_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString() })
          .eq('id', thread.id)
      } else if (req.asker_id === richard && req.helper_id === mark) {
        const richardMarkMessages = [
          {
            thread_id: thread.id,
            thread_type: 'ask' as const,
            sender_id: mark,
            body: 'Hi Richard — glad to help with the PM move. Hiring managers mostly want evidence you can drive outcomes without owning the code. Want to walk through a couple of your projects?',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            read_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            thread_id: thread.id,
            thread_type: 'ask' as const,
            sender_id: richard,
            body: 'That would be perfect. I will put together two examples and send them over before our call.',
            created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            read_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]
        const { error: msgErr } = await admin.from('messages').insert(richardMarkMessages)
        if (msgErr) throw msgErr

        await admin
          .from('ask_threads')
          .update({ last_message_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() })
          .eq('id', thread.id)
      }
    }
  }
  console.log('[seed-dev] asks seeded: incoming + Richard outgoing across advice/mentorship')
}

async function createFriendshipAndDMScenarios() {
  const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const idByEmail = new Map<string, string>()
  for (const u of usersList?.users ?? []) {
    if (u.email) idByEmail.set(u.email, u.id)
  }

  const sam = idByEmail.get('student-sam@example.com')!
  const ria = idByEmail.get('recent-grad-ria@example.com')!
  const rohan = idByEmail.get('recent-grad-rohan@example.com')!
  const mark = idByEmail.get('mentor-mark@example.com')!
  const mei = idByEmail.get('mentor-mei@example.com')!
  const paula = idByEmail.get('mentor-paused@example.com')!
  const iris = idByEmail.get('incomplete-iris@example.com')!
  const amy = idByEmail.get('admin-amy@example.com')!
  const richard = idByEmail.get('richard@example.com')!
  const sarah = idByEmail.get('sarah@example.com')!
  const dev = idByEmail.get('dev@example.com')!

  // 1. Create friendships (connections)
  const friendshipsToCreate = [
    [mark, mei],
    [mark, ria],
    [mark, rohan],
    [mark, amy],
    [ria, sam],
    [ria, rohan],
    [richard, sarah],
  ]

  for (const [u1, u2] of friendshipsToCreate) {
    const [a, b] = u1 < u2 ? [u1, u2] : [u2, u1]
    const { error } = await admin.from('friendships').insert({
      user_a_id: a,
      user_b_id: b,
    })
    if (error) throw error
  }

  // 2. Create friend requests (pending connections)
  const friendRequestsToCreate = [
    {
      sender_id: sam,
      receiver_id: mark,
      status: 'pending' as const,
      message: 'Hey Mark, would love to connect and follow your consulting journey at Acme.',
    },
    {
      sender_id: iris,
      receiver_id: mark,
      status: 'pending' as const,
      message: 'Hello Mark! Hoping to connect and learn more about management consulting.',
    },
    {
      sender_id: mark,
      receiver_id: paula,
      status: 'pending' as const,
      message: "Hi Paula, let's connect and catch up when you are back in town.",
    },
    {
      sender_id: rohan,
      receiver_id: mei,
      status: 'pending' as const,
      message: "Hi Mei, I'm a PM in Seattle. Saw you are in product at Hyundai in Seoul. Let's connect!",
    },
    {
      sender_id: dev,
      receiver_id: richard,
      status: 'pending' as const,
      message: "Met at the Chadwick Alumni Dinner last week! Let's connect here.",
    },
  ]

  const { error: frError } = await admin.from('friend_requests').insert(friendRequestsToCreate)
  if (frError) throw frError

  // 3. Create direct message threads
  const dmThreadsToCreate = [
    { label: 'mark-mei', users: [mark, mei] },
    { label: 'mark-ria', users: [mark, ria] },
    { label: 'amy-mark', users: [amy, mark] },
    { label: 'richard-sarah', users: [richard, sarah] },
  ]

  const threadIdsMap = new Map<string, string>()
  for (const thread of dmThreadsToCreate) {
    const [u1, u2] = thread.users
    const [a, b] = u1 < u2 ? [u1, u2] : [u2, u1]
    const { data, error } = await admin
      .from('direct_message_threads')
      .insert({
        user_a_id: a,
        user_b_id: b,
      })
      .select('id')
      .single()
    if (error) throw error
    threadIdsMap.set(thread.label, data.id)
  }

  // 4. Create messages inside direct message threads
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const eighteenHoursAgo = new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString()
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()

  const messagesToCreate = [
    // Mark & Mei DM
    {
      thread_id: threadIdsMap.get('mark-mei')!,
      thread_type: 'direct' as const,
      sender_id: mark,
      body: "Hey Mei! How's Songdo? I saw the pictures from Onion Cafe, looks incredible.",
      created_at: oneDayAgo,
      read_at: oneDayAgo,
    },
    {
      thread_id: threadIdsMap.get('mark-mei')!,
      thread_type: 'direct' as const,
      sender_id: mei,
      body: "Hey Mark! Onion is fantastic, very cozy. Work is busy with the infotainment launch, but we should definitely catch up.",
      created_at: eighteenHoursAgo,
      read_at: eighteenHoursAgo,
    },
    {
      thread_id: threadIdsMap.get('mark-mei')!,
      thread_type: 'direct' as const,
      sender_id: mark,
      body: "Absolutely! I will be free next Thursday evening your time. Let's do a quick call.",
      created_at: twoHoursAgo,
      read_at: null, // unread by Mei
    },

    // Mark & Ria DM
    {
      thread_id: threadIdsMap.get('mark-ria')!,
      thread_type: 'direct' as const,
      sender_id: ria,
      body: "Hi Mark! Thanks for connecting. I'm a software engineer at Stripe in SF. Let me know if you are ever in the area!",
      created_at: twoDaysAgo,
      read_at: twoDaysAgo,
    },
    {
      thread_id: threadIdsMap.get('mark-ria')!,
      thread_type: 'direct' as const,
      sender_id: mark,
      body: "Hi Ria, great to meet you! I'm in SF quite often for consulting projects. Will let you know next time I visit.",
      created_at: oneDayAgo,
      read_at: null, // unread by Ria
    },

    // Amy & Mark DM
    {
      thread_id: threadIdsMap.get('amy-mark')!,
      thread_type: 'direct' as const,
      sender_id: amy,
      body: "Hi Mark, did you see the announcement for the Tech & Product Roundtable?",
      created_at: threeDaysAgo,
      read_at: threeDaysAgo,
    },
    {
      thread_id: threadIdsMap.get('amy-mark')!,
      thread_type: 'direct' as const,
      sender_id: mark,
      body: "Yes Amy, looks like a great panel. I will be attending for sure.",
      created_at: threeDaysAgo,
      read_at: threeDaysAgo,
    },

    // Richard & Sarah DM
    {
      thread_id: threadIdsMap.get('richard-sarah')!,
      thread_type: 'direct' as const,
      sender_id: richard,
      body: "Hey Sarah, are you attending the upcoming networking event in SF?",
      created_at: new Date('2026-05-15T11:30:00.000Z').toISOString(),
      read_at: new Date('2026-05-15T11:30:00.000Z').toISOString(),
    },
    {
      thread_id: threadIdsMap.get('richard-sarah')!,
      thread_type: 'direct' as const,
      sender_id: sarah,
      body: "Yes, I'm planning to go! We should grab coffee before it starts.",
      created_at: new Date('2026-05-15T11:42:00.000Z').toISOString(),
      read_at: new Date('2026-05-15T11:42:00.000Z').toISOString(),
    },
    {
      thread_id: threadIdsMap.get('richard-sarah')!,
      thread_type: 'direct' as const,
      sender_id: richard,
      body: "Sounds perfect, let's meet at Blue Bottle near the venue around 6 PM.",
      created_at: new Date('2026-05-16T09:15:00.000Z').toISOString(),
      read_at: new Date('2026-05-16T09:15:00.000Z').toISOString(),
    },
    {
      thread_id: threadIdsMap.get('richard-sarah')!,
      thread_type: 'direct' as const,
      sender_id: sarah,
      body: "Perfect, see you there!",
      created_at: new Date('2026-05-16T09:20:00.000Z').toISOString(),
      read_at: null, // unread
    },
  ]

  const { error: msgError } = await admin.from('messages').insert(messagesToCreate)
  if (msgError) throw msgError

  console.log('[seed-dev] friendships and DM threads created with messages')
}


async function createEventsAndRsvps() {
  const nowIso = new Date().toISOString()
  for (const e of EVENTS) {
    const { error } = await admin.from('events').insert({
      id: e.id,
      organization_id: ORG.id,
      title: e.title,
      description: e.description,
      location: e.location,
      starts_at: e.startsAt,
      capacity: e.capacity,
      published_at: nowIso,
    })
    if (error) throw error
  }

  const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const idByEmail = new Map<string, string>()
  for (const u of usersList?.users ?? []) {
    if (u.email) idByEmail.set(u.email, u.id)
  }

  const sam = idByEmail.get('student-sam@example.com')!
  const ria = idByEmail.get('recent-grad-ria@example.com')!
  const rohan = idByEmail.get('recent-grad-rohan@example.com')!
  const mark = idByEmail.get('mentor-mark@example.com')!
  const mei = idByEmail.get('mentor-mei@example.com')!
  const felix = idByEmail.get('mentor-fully-booked@example.com')!
  const richard = idByEmail.get('richard@example.com')!

  const rsvps = [
    // Event 1: PV Mixer
    { event_id: EVENTS[0].id, user_id: ria, status: 'going' },
    { event_id: EVENTS[0].id, user_id: rohan, status: 'going' },
    { event_id: EVENTS[0].id, user_id: sam, status: 'going' },
    { event_id: EVENTS[0].id, user_id: mark, status: 'going' },
    { event_id: EVENTS[0].id, user_id: richard, status: 'going' },

    // Event 2: Songdo Coffee
    { event_id: EVENTS[1].id, user_id: mei, status: 'going' },
    { event_id: EVENTS[1].id, user_id: rohan, status: 'going' },

    // Event 3: Tech Roundtable
    { event_id: EVENTS[2].id, user_id: ria, status: 'going' },
    { event_id: EVENTS[2].id, user_id: rohan, status: 'going' },
    { event_id: EVENTS[2].id, user_id: sam, status: 'going' },
    { event_id: EVENTS[2].id, user_id: mark, status: 'going' },
    { event_id: EVENTS[2].id, user_id: mei, status: 'going' },
    { event_id: EVENTS[2].id, user_id: felix, status: 'going' },
    { event_id: EVENTS[2].id, user_id: richard, status: 'going' },

    // Event 4: Holiday Dinner (Past)
    { event_id: EVENTS[3].id, user_id: ria, status: 'going' },
    { event_id: EVENTS[3].id, user_id: sam, status: 'going' },
    { event_id: EVENTS[3].id, user_id: mark, status: 'going' },

    // Event 5: Creative Careers (Past)
    { event_id: EVENTS[4].id, user_id: mei, status: 'going' },
    { event_id: EVENTS[4].id, user_id: ria, status: 'going' },
  ]

  const { error } = await admin.from('event_rsvps').insert(rsvps)
  if (error) throw error
  console.log(`[seed-dev] events: ${EVENTS.length} created with ${rsvps.length} total RSVPs`)
}


async function createAnnouncements() {
  const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const idByEmail = new Map<string, string>()
  for (const u of usersList?.users ?? []) {
    if (u.email) idByEmail.set(u.email, u.id)
  }
  const amy = idByEmail.get('admin-amy@example.com')!

  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const announcements = [
    {
      organization_id: ORG.id,
      created_by: amy,
      title: 'Spring Career Panel — register by May 30',
      body: 'Join alumni from product, finance, and medicine for a candid evening on early-career pivots. Doors at 6:30pm in the PV commons; remote link for Songdo. Bring a question.',
      published_at: new Date(now - 2 * day).toISOString(),
    },
    {
      organization_id: ORG.id,
      created_by: amy,
      title: '2026 Mentorship Awards — nominate by Jun 12',
      body: 'Know an alum who showed up for you this year? Nominate them for the annual mentorship awards. A few sentences is all it takes.',
      published_at: new Date(now - 5 * day).toISOString(),
    },
    {
      organization_id: ORG.id,
      created_by: amy,
      title: 'Summer in Seoul — alumni meetups forming now',
      body: 'Heading to Korea this summer? A handful of classmates are organizing casual coffee meetups near Songdo and Gangnam. Reply in the circle to be looped in.',
      published_at: new Date(now - 9 * day).toISOString(),
    },
  ]
  const { error } = await admin.from('announcements').insert(announcements)
  if (error) throw error
  console.log(`[seed-dev] announcements: ${announcements.length} published`)
}


async function createNotifications() {
  const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const idByEmail = new Map<string, string>()
  for (const u of usersList?.users ?? []) {
    if (u.email) idByEmail.set(u.email, u.id)
  }
  const richard = idByEmail.get('richard@example.com')!

  const now = Date.now()
  const hour = 60 * 60 * 1000
  const day = 24 * hour
  // Types + payload shape mirror src/lib/notifications/types.ts (the renderer
  // pulls payload.actor_name / ask_type / title). target_id is left null —
  // clicks fall back to /inbox or /announcements, which is fine for seed data.
  const notifications = [
    {
      user_id: richard,
      organization_id: ORG.id,
      type: 'ask_received',
      payload: { actor_name: 'Alexander Kim', ask_type: 'mentorship' },
      read_at: null,
      created_at: new Date(now - 2 * hour).toISOString(),
    },
    {
      user_id: richard,
      organization_id: ORG.id,
      type: 'friend_request_received',
      payload: { actor_name: 'Dev Patel' },
      read_at: null,
      created_at: new Date(now - 5 * hour).toISOString(),
    },
    {
      user_id: richard,
      organization_id: ORG.id,
      type: 'ask_message',
      payload: { actor_name: 'Iris Okonkwo' },
      read_at: null,
      created_at: new Date(now - 22 * hour).toISOString(),
    },
    {
      user_id: richard,
      organization_id: ORG.id,
      type: 'ask_accepted',
      payload: { actor_name: 'Mark Mentor', ask_type: 'advice' },
      read_at: new Date(now - 4 * day).toISOString(),
      created_at: new Date(now - 5 * day).toISOString(),
    },
    {
      user_id: richard,
      organization_id: ORG.id,
      type: 'announcement',
      payload: { title: 'Spring Career Panel — register by May 30' },
      read_at: new Date(now - 1 * day).toISOString(),
      created_at: new Date(now - 2 * day).toISOString(),
    },
  ]
  const { error } = await admin.from('notifications').insert(notifications)
  if (error) throw error
  console.log(`[seed-dev] notifications: ${notifications.length} for Richard`)
}


// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  console.log(`[seed-dev] target Supabase URL: ${SUPABASE_URL}`)
  console.log('[seed-dev] you have 3 seconds to abort with Ctrl+C if this is the wrong project...')
  await new Promise((r) => setTimeout(r, 3000))

  await wipe()
  await createOrg()
  await createUsersAndProfiles()
  await createMentorshipScenarios()
  await createFriendshipAndDMScenarios()
  await createEventsAndRsvps()
  await createAnnouncements()
  await createNotifications()
  console.log('\n[seed-dev] done. log in with any email above + the password from PERSONAS.')
}

main().catch((err) => {
  console.error('\n[seed-dev] failed:', err)
  process.exit(1)
})
