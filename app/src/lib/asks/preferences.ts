import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { HelperPreferenceInput } from './schemas'

export type HelperPreferenceView = {
  membershipId: string
  organizationId: string
  organizationName: string
  openToAdvice: boolean
  openToMentorship: boolean
  topics: string[]
  screeningPrompt: string | null
  maxActiveMentees: number
  maxPendingRequests: number
  pausedAt: string | null
  activeMenteeCount: number
  pendingRequestCount: number
}

const DEFAULT_MAX_ACTIVE = 5
const DEFAULT_MAX_PENDING = 10

/**
 * Load the helper's preference row for their primary active org. Returns
 * sensible defaults when no row exists yet (new members who haven't visited
 * settings) so the form has something to render against.
 *
 * Defaults match the schema: both opt-ins start true. Advice is the lighter
 * commitment, broadly recruited. Mentorship defaults on too — at a small
 * school the network needs supply, and the settings UI shows a friendly
 * caveat when a member unchecks it (pointing at the active/pending caps as
 * a way to keep mentorship light rather than turn it off entirely).
 *
 * Active/pending counts are scoped to mentorship asks because the caps only
 * apply to mentorship — advice has no caps in this iteration.
 */
export async function getHelperPreference(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<HelperPreferenceView | null> {
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select(
      'id, organization_id, organizations!organization_memberships_organization_id_fkey(name)',
    )
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!membership) return null

  const orgName = (membership.organizations as { name: string } | null)?.name ?? ''

  const [{ data: pref }, { count: activeCount }, { count: pendingCount }] = await Promise.all([
    supabase
      .from('helper_preferences')
      .select(
        'open_to_advice, open_to_mentorship, topics, screening_prompt, max_active_mentees, max_pending_requests, paused_at',
      )
      .eq('organization_membership_id', membership.id)
      .maybeSingle(),
    supabase
      .from('ask_threads')
      .select('id, asks!inner(ask_type)', { count: 'exact', head: true })
      .eq('helper_id', userId)
      .eq('status', 'active')
      .eq('asks.ask_type', 'mentorship'),
    supabase
      .from('asks')
      .select('id', { count: 'exact', head: true })
      .eq('helper_id', userId)
      .eq('ask_type', 'mentorship')
      .eq('status', 'pending'),
  ])

  return {
    membershipId: membership.id,
    organizationId: membership.organization_id,
    organizationName: orgName,
    openToAdvice: pref?.open_to_advice ?? true,
    openToMentorship: pref?.open_to_mentorship ?? true,
    topics: pref?.topics ?? [],
    screeningPrompt: pref?.screening_prompt ?? null,
    maxActiveMentees: pref?.max_active_mentees ?? DEFAULT_MAX_ACTIVE,
    maxPendingRequests: pref?.max_pending_requests ?? DEFAULT_MAX_PENDING,
    pausedAt: pref?.paused_at ?? null,
    activeMenteeCount: activeCount ?? 0,
    pendingRequestCount: pendingCount ?? 0,
  }
}

export type SaveHelperPreferenceResult =
  | { ok: true }
  | { ok: false; error: 'no_membership' | 'db_error'; detail?: string }

/**
 * Upsert the helper preference row for the user's primary active org.
 *
 * Unpause behavior: any save action also clears `paused_at`. Helpers land on
 * settings either to make a real change (which signals they're back) or to
 * actively flip themselves closed — both should release the auto-pause.
 */
export async function saveHelperPreference(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: HelperPreferenceInput,
): Promise<SaveHelperPreferenceResult> {
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!membership) return { ok: false, error: 'no_membership' }

  // Caps are optional at the form layer (the form disables the inputs when
  // mentorship is off, and disabled inputs don't submit). Resolve undefined
  // values to the existing row's caps so a disable→re-enable cycle preserves
  // what the user had set, falling back to module defaults for first-save.
  let resolvedMaxActive = input.maxActiveMentees
  let resolvedMaxPending = input.maxPendingRequests
  if (resolvedMaxActive === undefined || resolvedMaxPending === undefined) {
    const { data: existing } = await supabase
      .from('helper_preferences')
      .select('max_active_mentees, max_pending_requests')
      .eq('organization_membership_id', membership.id)
      .maybeSingle()
    resolvedMaxActive ??= existing?.max_active_mentees ?? DEFAULT_MAX_ACTIVE
    resolvedMaxPending ??= existing?.max_pending_requests ?? DEFAULT_MAX_PENDING
  }

  const { error } = await supabase.from('helper_preferences').upsert(
    {
      organization_membership_id: membership.id,
      open_to_advice: input.openToAdvice,
      open_to_mentorship: input.openToMentorship,
      topics: input.topics,
      screening_prompt: input.screeningPrompt,
      max_active_mentees: resolvedMaxActive,
      max_pending_requests: resolvedMaxPending,
      paused_at: null,
      // A settings save is the deliberate "I'm managing my availability"
      // signal, so it releases an explicit pause too.
      paused_until: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'organization_membership_id' },
  )

  if (error) return { ok: false, error: 'db_error', detail: error.message }
  return { ok: true }
}

export const EXPLICIT_PAUSE_DAYS = 14

/** Request-scoped pause horizon for UI copy ("Pause until Thu, Jun 25").
 * Lives here so the impure clock read stays out of component bodies. */
export function explicitPauseHorizon(now = new Date()): Date {
  return new Date(now.getTime() + EXPLICIT_PAUSE_DAYS * 24 * 60 * 60 * 1000)
}

/**
 * The guilt-free pause from the decline flow: member-chosen, with a
 * visible comeback date. Sets paused_at (the flag every matching surface
 * already filters on) plus paused_until so the nightly sweep auto-resumes
 * it — unlike inactivity auto-pauses, an explicit pause survives logins
 * and only a settings save or the horizon clears it.
 */
export async function pauseHelper(
  supabase: SupabaseClient<Database>,
  userId: string,
  { now = new Date() }: { now?: Date } = {},
): Promise<SaveHelperPreferenceResult> {
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!membership) return { ok: false, error: 'no_membership' }

  const until = new Date(now.getTime() + EXPLICIT_PAUSE_DAYS * 24 * 60 * 60 * 1000)
  const { error } = await supabase.from('helper_preferences').upsert(
    {
      organization_membership_id: membership.id,
      paused_at: now.toISOString(),
      paused_until: until.toISOString(),
      updated_at: now.toISOString(),
    },
    { onConflict: 'organization_membership_id' },
  )

  if (error) return { ok: false, error: 'db_error', detail: error.message }
  return { ok: true }
}

/**
 * Nightly: resume helpers whose explicit pause horizon has passed.
 * Service-role; returns how many were resumed.
 */
export async function sweepResumeExplicitPauses(
  admin: SupabaseClient<Database>,
  { now = new Date(), dryRun = false }: { now?: Date; dryRun?: boolean } = {},
): Promise<{ resumed: number; error: string | null }> {
  if (dryRun) {
    const { error, count } = await admin
      .from('helper_preferences')
      .select('organization_membership_id', { count: 'exact', head: true })
      .lte('paused_until', now.toISOString())
    return { resumed: count ?? 0, error: error?.message ?? null }
  }

  const { error, count } = await admin
    .from('helper_preferences')
    .update(
      { paused_at: null, paused_until: null, updated_at: now.toISOString() },
      { count: 'exact' },
    )
    .lte('paused_until', now.toISOString())

  return { resumed: count ?? 0, error: error?.message ?? null }
}

/**
 * Lightweight per-type opt-in flip used by the profile form's "open to
 * mentor" checkbox. Currently writes only to `open_to_mentorship` to keep
 * the existing single-toggle UI working; the next step (mentor settings UI)
 * will let users control both types from the form directly.
 *
 * Creates the preferences row with defaults if it doesn't exist yet, so the
 * profile toggle and the request gate stay in sync without requiring the
 * user to visit helper settings first.
 */
export async function setOpenToMentorship(
  supabase: SupabaseClient<Database>,
  membershipId: string,
  open: boolean,
): Promise<SaveHelperPreferenceResult> {
  const { error } = await supabase.from('helper_preferences').upsert(
    {
      organization_membership_id: membershipId,
      open_to_mentorship: open,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'organization_membership_id' },
  )

  if (error) return { ok: false, error: 'db_error', detail: error.message }
  return { ok: true }
}
