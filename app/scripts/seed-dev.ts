/**
 * Seed the bridgecircle-dev Supabase project with deterministic fake data.
 *
 * Run from app/:
 *   SEED_CONFIRM=YES pnpm dlx tsx --env-file=.env.local scripts/seed-dev.ts
 *
 * What it does:
 *   - Wipes the relevant tables in the dev database (in dependency order).
 *   - Re-creates a small, hand-curated set of fake users, profiles, mentors,
 *     mentorship requests, events, and RSVPs that exercise the Phase 1 flows.
 *   - Prints a summary so you can sanity-check what landed.
 *
 * Prerequisites:
 *   - .env.local points at bridgecircle-dev (NOT production).
 *   - The Phase 1 migrations from phase-1-launch-spec.md have been applied
 *     to bridgecircle-dev. Without those tables, this script fails on the
 *     first insert with "relation does not exist" — that's expected.
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
const PROD_PROJECT_REF = process.env.PROD_PROJECT_REF // optional extra guard

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

console.log(`[seed-dev] target Supabase URL: ${SUPABASE_URL}`)
console.log('[seed-dev] you have 3 seconds to abort with Ctrl+C if this is the wrong project...')
await new Promise((r) => setTimeout(r, 3000))

const admin: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SECRET, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ---------------------------------------------------------------------------
// Curated fake data
//
// Hand-curated rather than random so test scenarios are recognizable and
// reproducible. Update IDs/emails here when you want to add new personas.
// ---------------------------------------------------------------------------

const ORG = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Chadwick School (DEV)',
  slug: 'chadwick-dev',
}

type Persona = {
  id: string
  email: string
  password: string
  fullName: string
  gradYear: number
  city: string
  employer: string
  title: string
  university: string
  major: string
  openToMentor: boolean
  mentorTopics?: string[]
  maxPending?: number
  maxActive?: number
  bio?: string
  role?: 'super_admin' | 'admin' | 'member'
}

const PERSONAS: Persona[] = [
  {
    id: 'aaaa0000-0000-0000-0000-000000000001',
    email: 'admin-amy@example.com',
    password: 'devseed-password-1',
    fullName: 'Amy Admin',
    gradYear: 2005,
    city: 'Palos Verdes, CA',
    employer: 'Chadwick School',
    title: 'Alumni Board Chair',
    university: 'Stanford University',
    major: 'Public Policy',
    openToMentor: false,
    role: 'super_admin',
  },
  {
    id: 'aaaa0000-0000-0000-0000-000000000002',
    email: 'mentor-mark@example.com',
    password: 'devseed-password-2',
    fullName: 'Mark Mentor',
    gradYear: 2008,
    city: 'San Francisco, CA',
    employer: 'Acme Consulting',
    title: 'Senior Partner',
    university: 'University of Pennsylvania',
    major: 'Economics',
    openToMentor: true,
    mentorTopics: ['consulting', 'career change', 'business school'],
    maxPending: 5,
    maxActive: 3,
    bio: 'Open to ~30min calls with current students or recent grads.',
  },
  {
    id: 'aaaa0000-0000-0000-0000-000000000003',
    email: 'mentor-mei@example.com',
    password: 'devseed-password-3',
    fullName: 'Mei Mentor',
    gradYear: 2012,
    city: 'Seoul, South Korea',
    employer: 'Hyundai Motor',
    title: 'Product Director',
    university: 'Yonsei University',
    major: 'Industrial Engineering',
    openToMentor: true,
    mentorTopics: ['product management', 'returning to Korea', 'engineering to PM'],
    maxPending: 10,
    maxActive: 5,
    bio: 'Happy to chat about the PM transition or relocating to Asia.',
  },
  {
    id: 'aaaa0000-0000-0000-0000-000000000004',
    email: 'mentor-fully-booked@example.com',
    password: 'devseed-password-4',
    fullName: 'Felix Atcapacity',
    gradYear: 2010,
    city: 'New York, NY',
    employer: 'Goldman Sachs',
    title: 'VP, Equity Research',
    university: 'Harvard University',
    major: 'Mathematics',
    openToMentor: true,
    mentorTopics: ['finance', 'investment banking'],
    maxPending: 1, // intentionally low so we can test capacity-full state
    maxActive: 1,
    bio: 'Currently at max mentee capacity.',
  },
  {
    id: 'aaaa0000-0000-0000-0000-000000000005',
    email: 'mentor-paused@example.com',
    password: 'devseed-password-5',
    fullName: 'Paula Paused',
    gradYear: 2009,
    city: 'Boston, MA',
    employer: 'Mass General Hospital',
    title: 'Attending Physician',
    university: 'Johns Hopkins University',
    major: 'Biology',
    openToMentor: false, // paused for testing the auto-pause UI
    bio: 'Paused while away.',
  },
  {
    id: 'bbbb0000-0000-0000-0000-000000000001',
    email: 'student-sam@example.com',
    password: 'devseed-password-6',
    fullName: 'Sam Student',
    gradYear: 2024,
    city: 'Los Angeles, CA',
    employer: 'UCLA',
    title: 'Senior, Computer Science',
    university: 'UCLA',
    major: 'Computer Science',
    openToMentor: false,
  },
  {
    id: 'bbbb0000-0000-0000-0000-000000000002',
    email: 'recent-grad-ria@example.com',
    password: 'devseed-password-7',
    fullName: 'Ria Recent',
    gradYear: 2022,
    city: 'San Francisco, CA',
    employer: 'Stripe',
    title: 'Software Engineer',
    university: 'UC Berkeley',
    major: 'Computer Science',
    openToMentor: false,
  },
  {
    id: 'bbbb0000-0000-0000-0000-000000000003',
    email: 'recent-grad-rohan@example.com',
    password: 'devseed-password-8',
    fullName: 'Rohan Recent',
    gradYear: 2021,
    city: 'Seattle, WA',
    employer: 'Microsoft',
    title: 'Product Manager',
    university: 'University of Washington',
    major: 'Business Administration',
    openToMentor: false,
  },
  {
    id: 'bbbb0000-0000-0000-0000-000000000004',
    email: 'incomplete-iris@example.com',
    password: 'devseed-password-9',
    fullName: 'Iris Incomplete',
    gradYear: 2023,
    city: '',
    employer: '',
    title: '',
    university: '',
    major: '',
    openToMentor: false,
    bio: 'Profile intentionally left incomplete to test profile-completion prompts.',
  },
]

const EVENTS = [
  {
    id: 'eeee0000-0000-0000-0000-000000000001',
    title: 'Spring Alumni Mixer (Palos Verdes)',
    description: 'Casual evening drinks at the Palos Verdes campus.',
    locationText: 'Chadwick School Main Campus',
    startsAt: futureIso(14),
  },
  {
    id: 'eeee0000-0000-0000-0000-000000000002',
    title: 'Songdo Alumni Coffee',
    description: 'Saturday morning coffee meetup for Chadwick International alumni.',
    locationText: 'Cafe Onion, Songdo',
    startsAt: futureIso(21),
  },
]

function futureIso(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString()
}

// ---------------------------------------------------------------------------
// Steps
//
// Each step is small and named so the console output reads like a checklist.
// If a step throws, the script stops — re-running starts from the top with
// a fresh wipe.
// ---------------------------------------------------------------------------

async function wipe() {
  // Order matters: child tables before parents.
  const tables = [
    'event_rsvp',
    'event',
    'message',
    'mentorship_thread',
    'mentorship_request',
    'mentorship_preference',
    'invite',
    'admin_role_assignment',
    'audit_log',
    'organization_membership',
    'profile',
    'organization',
  ]
  for (const t of tables) {
    const { error } = await admin.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error && !error.message.includes('does not exist')) throw error
  }

  // Wipe auth users we previously seeded. Match by email prefix.
  const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  for (const u of users?.users ?? []) {
    if (PERSONAS.some((p) => p.email === u.email)) {
      await admin.auth.admin.deleteUser(u.id)
    }
  }
  console.log('[seed-dev] wiped existing seed data')
}

async function createOrg() {
  const { error } = await admin.from('organization').insert({
    id: ORG.id,
    name: ORG.name,
    slug: ORG.slug,
  })
  if (error) throw error
  console.log(`[seed-dev] org: ${ORG.name}`)
}

async function createUsersAndProfiles() {
  for (const p of PERSONAS) {
    const { data, error } = await admin.auth.admin.createUser({
      email: p.email,
      password: p.password,
      email_confirm: true,
      user_metadata: { full_name: p.fullName },
    })
    if (error) throw error
    const userId = data.user.id

    const { error: profileError } = await admin.from('profile').insert({
      id: userId,
      organization_id: ORG.id,
      full_name: p.fullName,
      graduation_year: p.gradYear,
      city: p.city,
      employer: p.employer,
      title: p.title,
      university: p.university,
      major: p.major,
      open_to_mentor: p.openToMentor,
      bio: p.bio ?? null,
    })
    if (profileError) throw profileError

    const { error: mbError } = await admin.from('organization_membership').insert({
      user_id: userId,
      organization_id: ORG.id,
      status: 'approved',
    })
    if (mbError) throw mbError

    if (p.openToMentor) {
      const { error: prefError } = await admin.from('mentorship_preference').insert({
        user_id: userId,
        organization_id: ORG.id,
        topics: p.mentorTopics ?? [],
        max_pending: p.maxPending ?? 5,
        max_active: p.maxActive ?? 3,
      })
      if (prefError) throw prefError
    }

    if (p.role && p.role !== 'member') {
      const { error: roleError } = await admin.from('admin_role_assignment').insert({
        user_id: userId,
        organization_id: ORG.id,
        role: p.role,
      })
      if (roleError) throw roleError
    }

    // Persona ID columns are independent of auth user IDs in this dataset —
    // we do not write the curated `p.id` to any table; auth.users assigned its
    // own UUID. Print the mapping for cross-reference during debugging.
    console.log(`[seed-dev] user: ${p.fullName} <${p.email}>  auth.id=${userId}`)
  }
}

async function createMentorshipScenarios() {
  // Look up the auth IDs we just created so we can wire requests by email.
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

  const requests = [
    {
      mentee_id: sam,
      mentor_id: mark,
      reason: 'Trying to decide between consulting and product roles after graduation.',
      help_needed: 'Looking for a 30-min call about how to evaluate the two paths.',
      status: 'pending',
    },
    {
      mentee_id: ria,
      mentor_id: mei,
      reason: 'Considering a move from Stripe SF to a PM role in Korea.',
      help_needed: 'Want to talk about engineering -> PM transition and Seoul tech scene.',
      status: 'accepted',
    },
    {
      mentee_id: rohan,
      mentor_id: felix,
      reason: 'Curious about transitioning from PM to investment banking.',
      help_needed: 'Open to a quick chat about whether the move makes sense.',
      status: 'declined',
    },
  ]

  for (const r of requests) {
    const { data: req, error } = await admin
      .from('mentorship_request')
      .insert(r)
      .select('id')
      .single()
    if (error) throw error

    if (r.status === 'accepted' && req) {
      const { error: threadError } = await admin
        .from('mentorship_thread')
        .insert({ request_id: req.id })
      if (threadError) throw threadError
    }
  }
  console.log('[seed-dev] mentorship requests: 1 pending, 1 accepted, 1 declined')
}

async function createEventsAndRsvps() {
  for (const e of EVENTS) {
    const { error } = await admin.from('event').insert({
      id: e.id,
      organization_id: ORG.id,
      title: e.title,
      description: e.description,
      location_text: e.locationText,
      starts_at: e.startsAt,
    })
    if (error) throw error
  }

  // RSVP a couple of recent grads to the first event.
  const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const idByEmail = new Map<string, string>()
  for (const u of usersList?.users ?? []) {
    if (u.email) idByEmail.set(u.email, u.id)
  }
  const ria = idByEmail.get('recent-grad-ria@example.com')!
  const rohan = idByEmail.get('recent-grad-rohan@example.com')!

  const { error } = await admin.from('event_rsvp').insert([
    { event_id: EVENTS[0].id, user_id: ria, status: 'going' },
    { event_id: EVENTS[0].id, user_id: rohan, status: 'going' },
  ])
  if (error) throw error
  console.log(`[seed-dev] events: ${EVENTS.length} created, 2 RSVPs on event #1`)
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  await wipe()
  await createOrg()
  await createUsersAndProfiles()
  await createMentorshipScenarios()
  await createEventsAndRsvps()
  console.log('\n[seed-dev] done. log in with any email above + the password from PERSONAS.')
}

main().catch((err) => {
  console.error('\n[seed-dev] failed:', err)
  process.exit(1)
})
