import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

/**
 * Social proof for the ask starter. Below this many open helpers the panel
 * hides entirely — honest numbers only work once the room isn't empty.
 */
export const SOCIAL_PROOF_MIN_HELPERS = 5
const SAMPLE_HELPER_COUNT = 5
const ANSWERED_WINDOW_DAYS = 90

export type AskStarterStats = {
  /** Active, unpaused members opted in to advice or mentorship. */
  helperCount: number
  /** A few real helpers for the avatar cluster — never invented faces. */
  sampleHelpers: Array<{
    userId: string
    name: string | null
    preferredName: string | null
    avatarUrl: string | null
  }>
  /** Asks accepted in the last 90 days, org-wide. 0 when unavailable. */
  answeredRecentCount: number
}

/**
 * Aggregates the "Open to help right now" panel. Helper visibility uses the
 * viewer's own client (org-mates can already read helper preferences — the
 * same data powers search badges). The answered-asks count crosses ask-row
 * RLS, so it comes through the admin client as a bare count — no row data
 * leaves the aggregate.
 */
export async function getAskStarterStats(
  supabase: SupabaseClient<Database>,
  admin: SupabaseClient<Database> | null,
  { organizationId }: { organizationId: string },
): Promise<AskStarterStats> {
  const { data: helperRows } = await supabase
    .from('helper_preferences')
    .select(
      'organization_membership_id, open_to_advice, open_to_mentorship, paused_at, organization_memberships!inner(user_id, status, organization_id)',
    )
    .eq('organization_memberships.organization_id', organizationId)
    .eq('organization_memberships.status', 'active')
    .is('paused_at', null)
    .or('open_to_advice.eq.true,open_to_mentorship.eq.true')

  const helpers = helperRows ?? []
  const helperCount = helpers.length

  const sampleUserIds = helpers
    .slice(0, SAMPLE_HELPER_COUNT)
    .map((row) => row.organization_memberships?.user_id)
    .filter((id): id is string => Boolean(id))

  let sampleHelpers: AskStarterStats['sampleHelpers'] = []
  if (sampleUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('base_profiles')
      .select('user_id, name, preferred_name, avatar_url')
      .in('user_id', sampleUserIds)
    sampleHelpers = (profiles ?? []).map((p) => ({
      userId: p.user_id,
      name: p.name,
      preferredName: p.preferred_name,
      avatarUrl: p.avatar_url,
    }))
  }

  let answeredRecentCount = 0
  if (admin) {
    const cutoff = new Date(Date.now() - ANSWERED_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await admin
      .from('asks')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'accepted')
      .gte('responded_at', cutoff)
    answeredRecentCount = count ?? 0
  }

  return { helperCount, sampleHelpers, answeredRecentCount }
}
