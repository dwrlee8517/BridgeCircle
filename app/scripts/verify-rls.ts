/**
 * Verify RLS policies behave as expected against seeded dev data.
 *
 * Run from app/:
 *   pnpm dlx tsx --env-file=.env.local scripts/verify-rls.ts
 *
 * Signs in as several seeded personas and asserts what they can / cannot see.
 * This is a smoke test, not an exhaustive policy audit. If it passes, the
 * "happy path" policies work; subtle edge cases still need real-world testing.
 *
 * Throwaway script — fine to delete after Day 2 if it has served its purpose.
 */

import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

function userClient() {
  return createClient(URL, PUBLISHABLE, { auth: { persistSession: false } })
}

async function signIn(email: string, password: string) {
  const c = userClient()
  const { error } = await c.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`)
  return c
}

function pass(label: string) {
  console.log(`  ✓ ${label}`)
}
function fail(label: string, detail: string): never {
  console.error(`  ✗ ${label}: ${detail}`)
  process.exit(1)
}

async function main() {
  console.log(`\n[verify-rls] target: ${URL}\n`)

  // ---------------------------------------------------------------------------
  // Sam Student — a regular member of the org
  // ---------------------------------------------------------------------------
  console.log('Sam Student (member, mentee on a pending request):')
  const sam = await signIn('student-sam@example.com', 'devseed-password-6')

  const { data: samEvents } = await sam.from('events').select('id, title')
  if (!samEvents || samEvents.length < 2) {
    fail('reads org events (published)', `expected ≥ 2, got ${samEvents?.length}`)
  }
  pass(`reads ${samEvents.length} published events in own org`)

  // ≥ 9 because real test users created during dev signup may be in the org too.
  const { data: samProfiles } = await sam.from('base_profiles').select('user_id, name')
  if (!samProfiles || samProfiles.length < 9) {
    fail('reads org-mate profiles', `expected ≥ 9 (the seeded personas), got ${samProfiles?.length}`)
  }
  pass(`reads all ${samProfiles.length} base_profiles in own org`)

  const { data: samRequests } = await sam.from('asks').select('id, helper_id, asker_id')
  if (!samRequests || samRequests.length !== 1) {
    fail('reads only own asks', `expected 1 (Sam→Mark), got ${samRequests?.length}`)
  }
  pass('reads only Sam→Mark ask (cannot see Ria→Mei or Rohan→Felix)')

  const { data: samMessages } = await sam.from('messages').select('id')
  if (samMessages?.length !== 0) {
    fail('cannot read messages from threads they\'re not in', `expected 0, got ${samMessages?.length}`)
  }
  pass('reads 0 messages (not a participant in any thread)')

  // ---------------------------------------------------------------------------
  // Ria Recent — mentee on the accepted thread
  // ---------------------------------------------------------------------------
  console.log('\nRia Recent (mentee on the accepted Ria→Mei thread):')
  const ria = await signIn('recent-grad-ria@example.com', 'devseed-password-7')

  const { data: riaThreads } = await ria.from('ask_threads').select('id, helper_id, asker_id')
  if (riaThreads?.length !== 1) {
    fail('reads own ask thread', `expected 1, got ${riaThreads?.length}`)
  }
  pass('reads 1 ask thread (Ria↔Mei)')

  const { data: riaInvites } = await ria.from('invites').select('id')
  if (riaInvites?.length !== 0) {
    fail('non-admins cannot read invites', `expected 0, got ${riaInvites?.length}`)
  }
  pass('reads 0 invites (Ria is not an admin)')

  // ---------------------------------------------------------------------------
  // Amy Admin — should see admin-scoped things
  // ---------------------------------------------------------------------------
  console.log('\nAmy Admin (super_admin):')
  const amy = await signIn('admin-amy@example.com', 'devseed-password-1')

  const { data: amyMemberships } = await amy.from('organization_memberships').select('id, user_id, status')
  if (!amyMemberships || amyMemberships.length < 9) {
    fail('admin reads all org memberships', `expected ≥ 9, got ${amyMemberships?.length}`)
  }
  pass(`admin reads all ${amyMemberships.length} org memberships`)

  // ---------------------------------------------------------------------------
  // Anonymous — should see nothing
  // ---------------------------------------------------------------------------
  console.log('\nAnonymous (no sign-in):')
  const anon = userClient()

  const { data: anonEvents } = await anon.from('events').select('id')
  if (anonEvents?.length !== 0) {
    fail('anon cannot read events', `expected 0, got ${anonEvents?.length}`)
  }
  pass('reads 0 events')

  const { data: anonProfiles } = await anon.from('base_profiles').select('user_id')
  if (anonProfiles?.length !== 0) {
    fail('anon cannot read profiles', `expected 0, got ${anonProfiles?.length}`)
  }
  pass('reads 0 base_profiles')

  console.log('\n[verify-rls] all checks passed.\n')
}

main().catch((err) => {
  console.error('\n[verify-rls] failed:', err)
  process.exit(1)
})
