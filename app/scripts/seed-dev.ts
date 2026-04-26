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
  openToMentor: boolean
  mentorTopics?: string[]
  maxPending?: number
  maxActive?: number
  pausedAt?: string
  adminRole?: AdminRole
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
    openToMentor: false,
    adminRole: 'super_admin',
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
    openToMentor: true,
    mentorTopics: ['consulting', 'career change', 'business school'],
    maxPending: 5,
    maxActive: 3,
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
    bio: 'Happy to chat about the PM transition or relocating to Asia.',
    openToMentor: true,
    mentorTopics: ['product management', 'returning to Korea', 'engineering to PM'],
    maxPending: 10,
    maxActive: 5,
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
    openToMentor: true,
    mentorTopics: ['finance', 'investment banking'],
    // Intentionally low so we can test the capacity-full state in the UI.
    maxPending: 1,
    maxActive: 1,
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
    // is_open=true but paused_at set: tests the "paused while away" UI state.
    openToMentor: true,
    mentorTopics: ['medicine', 'med school applications'],
    pausedAt: new Date().toISOString(),
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
    openToMentor: false,
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
    openToMentor: false,
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
    openToMentor: false,
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
]

const EVENTS = [
  {
    id: 'eeee0000-0000-0000-0000-000000000001',
    title: 'Spring Alumni Mixer (Palos Verdes)',
    description: 'Casual evening drinks at the Palos Verdes campus.',
    location: 'Chadwick School Main Campus',
    startsAt: futureIso(14),
  },
  {
    id: 'eeee0000-0000-0000-0000-000000000002',
    title: 'Songdo Alumni Coffee',
    description: 'Saturday morning coffee meetup for Chadwick International alumni.',
    location: 'Cafe Onion, Songdo',
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

    const { error: baseProfileError } = await admin.from('base_profiles').insert({
      user_id: userId,
      name: p.name,
      current_employer: p.employer,
      current_title: p.title,
      city: p.city,
      university: p.university,
      major: p.major,
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
      const { error: prefError } = await admin.from('mentorship_preferences').insert({
        organization_membership_id: membershipId,
        is_open: true,
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

  const requests = [
    {
      organization_id: ORG.id,
      mentee_id: sam,
      mentor_id: mark,
      reason: 'Trying to decide between consulting and product roles after graduation.',
      help_needed: 'Looking for a 30-min call about how to evaluate the two paths.',
      status: 'pending' as const,
    },
    {
      organization_id: ORG.id,
      mentee_id: ria,
      mentor_id: mei,
      reason: 'Considering a move from Stripe SF to a PM role in Korea.',
      help_needed: 'Want to talk about engineering -> PM transition and Seoul tech scene.',
      status: 'accepted' as const,
      responded_at: new Date().toISOString(),
    },
    {
      organization_id: ORG.id,
      mentee_id: rohan,
      mentor_id: felix,
      reason: 'Curious about transitioning from PM to investment banking.',
      help_needed: 'Open to a quick chat about whether the move makes sense.',
      status: 'declined' as const,
      responded_at: new Date().toISOString(),
    },
  ]

  for (const r of requests) {
    const { data: req, error } = await admin
      .from('mentorship_requests')
      .insert(r)
      .select('id, mentor_id, mentee_id, status')
      .single()
    if (error) throw error

    if (req.status === 'accepted') {
      const { error: threadError } = await admin.from('mentorship_threads').insert({
        request_id: req.id,
        mentor_id: req.mentor_id,
        mentee_id: req.mentee_id,
      })
      if (threadError) throw threadError
    }
  }
  console.log('[seed-dev] mentorship requests: 1 pending, 1 accepted, 1 declined')
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
      published_at: nowIso,
    })
    if (error) throw error
  }

  const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const idByEmail = new Map<string, string>()
  for (const u of usersList?.users ?? []) {
    if (u.email) idByEmail.set(u.email, u.id)
  }
  const ria = idByEmail.get('recent-grad-ria@example.com')!
  const rohan = idByEmail.get('recent-grad-rohan@example.com')!

  const { error } = await admin.from('event_rsvps').insert([
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
  console.log(`[seed-dev] target Supabase URL: ${SUPABASE_URL}`)
  console.log('[seed-dev] you have 3 seconds to abort with Ctrl+C if this is the wrong project...')
  await new Promise((r) => setTimeout(r, 3000))

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
