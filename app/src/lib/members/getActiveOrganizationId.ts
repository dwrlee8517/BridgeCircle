import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

/**
 * Resolve the caller's active organization.
 *
 * Server-side derivation of the org a member acts in — the client never supplies
 * it (it isn't theirs to choose). The base multi-org model allows several
 * memberships; today a member has one active org, so we take the first active
 * row. Returns null when the member has no active membership.
 */
export async function getActiveOrganizationId(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data.organization_id
}
