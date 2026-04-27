import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { MentorshipPreferenceInput } from './schemas'

export type MentorshipPreferenceView = {
  membershipId: string
  organizationId: string
  organizationName: string
  isOpen: boolean
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
 * Load the mentor's preference row for their primary active org. Returns
 * sensible defaults when no row exists yet (new mentors who haven't visited
 * settings) so the form has something to render against.
 *
 * Also returns live counts (active threads, pending requests) so the UI can
 * show "3 of 5 active mentees" without a second round trip.
 */
export async function getMentorshipPreference(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<MentorshipPreferenceView | null> {
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('id, organization_id, organizations(name)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!membership) return null

  const orgName = (membership.organizations as { name: string } | null)?.name ?? ''

  const [{ data: pref }, { count: activeCount }, { count: pendingCount }] = await Promise.all([
    supabase
      .from('mentorship_preferences')
      .select(
        'is_open, topics, screening_prompt, max_active_mentees, max_pending_requests, paused_at',
      )
      .eq('organization_membership_id', membership.id)
      .maybeSingle(),
    supabase
      .from('mentorship_threads')
      .select('id', { count: 'exact', head: true })
      .eq('mentor_id', userId)
      .eq('status', 'active'),
    supabase
      .from('mentorship_requests')
      .select('id', { count: 'exact', head: true })
      .eq('mentor_id', userId)
      .eq('status', 'pending'),
  ])

  return {
    membershipId: membership.id,
    organizationId: membership.organization_id,
    organizationName: orgName,
    isOpen: pref?.is_open ?? false,
    topics: pref?.topics ?? [],
    screeningPrompt: pref?.screening_prompt ?? null,
    maxActiveMentees: pref?.max_active_mentees ?? DEFAULT_MAX_ACTIVE,
    maxPendingRequests: pref?.max_pending_requests ?? DEFAULT_MAX_PENDING,
    pausedAt: pref?.paused_at ?? null,
    activeMenteeCount: activeCount ?? 0,
    pendingRequestCount: pendingCount ?? 0,
  }
}

export type SaveMentorshipPreferenceResult =
  | { ok: true }
  | { ok: false; error: 'no_membership' | 'db_error'; detail?: string }

/**
 * Upsert the mentor preference row for the user's primary active org.
 *
 * Unpause behavior: any save action also clears `paused_at`. Mentors land on
 * settings either to make a real change (which signals they're back) or to
 * actively flip themselves closed — both should release the auto-pause.
 */
export async function saveMentorshipPreference(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: MentorshipPreferenceInput,
): Promise<SaveMentorshipPreferenceResult> {
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!membership) return { ok: false, error: 'no_membership' }

  const { error } = await supabase.from('mentorship_preferences').upsert(
    {
      organization_membership_id: membership.id,
      is_open: input.isOpen,
      topics: input.topics,
      screening_prompt: input.screeningPrompt,
      max_active_mentees: input.maxActiveMentees,
      max_pending_requests: input.maxPendingRequests,
      paused_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'organization_membership_id' },
  )

  if (error) return { ok: false, error: 'db_error', detail: error.message }
  return { ok: true }
}

/**
 * Lightweight is_open flip used by the profile form's "open to mentor"
 * checkbox. Creates the preferences row with defaults if it doesn't exist
 * yet — keeps the profile toggle and the request gate in sync without
 * requiring the user to visit mentor settings first.
 */
export async function setMentorOpen(
  supabase: SupabaseClient<Database>,
  membershipId: string,
  isOpen: boolean,
): Promise<SaveMentorshipPreferenceResult> {
  const { error } = await supabase.from('mentorship_preferences').upsert(
    {
      organization_membership_id: membershipId,
      is_open: isOpen,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'organization_membership_id' },
  )

  if (error) return { ok: false, error: 'db_error', detail: error.message }
  return { ok: true }
}
