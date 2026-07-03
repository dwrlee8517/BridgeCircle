import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { HelperPreferenceInput } from './schemas'

export type HelperPreferenceView = {
  membershipId: string
  organizationId: string
  organizationName: string
  openToHelp: boolean
  topics: string[]
  pausedAt: string | null
}

/**
 * Load the helper's preference row for their primary active org. Returns
 * sensible defaults when no row exists yet (new members who haven't visited
 * settings) so the form has something to render against.
 *
 * One availability state (ADR 0011 Phase 2): open to helping, or not.
 * open_to_advice is THE flag until the Phase 6 rename to open_to_help; it
 * defaults open — at a small school the network needs supply. Caps and the
 * screening prompt left the view with the type split; max_pending_requests
 * stays enforced inside createAsk as the invisible abuse valve.
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

  const { data: pref } = await supabase
    .from('helper_preferences')
    .select('open_to_advice, topics, paused_at')
    .eq('organization_membership_id', membership.id)
    .maybeSingle()

  return {
    membershipId: membership.id,
    organizationId: membership.organization_id,
    organizationName: orgName,
    openToHelp: pref?.open_to_advice ?? true,
    topics: pref?.topics ?? [],
    pausedAt: pref?.paused_at ?? null,
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

  // One open state, written to both legacy columns so anything still reading
  // open_to_mentorship stays consistent until Phase 6 drops it. Caps and
  // screening are deliberately not written — existing values sit untouched
  // (max_pending_requests keeps working as the invisible valve in createAsk).
  const { error } = await supabase.from('helper_preferences').upsert(
    {
      organization_membership_id: membership.id,
      open_to_advice: input.openToHelp,
      open_to_mentorship: input.openToHelp,
      topics: input.topics,
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
 * Lightweight availability flip used by the profile form's "open to
 * helping" checkbox. Writes the single open state to both legacy columns
 * (ADR 0011 Phase 2) so the profile toggle and the ask gate stay in sync
 * without requiring the user to visit help settings first.
 */
export async function setOpenToHelp(
  supabase: SupabaseClient<Database>,
  membershipId: string,
  open: boolean,
): Promise<SaveHelperPreferenceResult> {
  const { error } = await supabase.from('helper_preferences').upsert(
    {
      organization_membership_id: membershipId,
      open_to_advice: open,
      open_to_mentorship: open,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'organization_membership_id' },
  )

  if (error) return { ok: false, error: 'db_error', detail: error.message }
  return { ok: true }
}
