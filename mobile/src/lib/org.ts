import { supabase } from './supabase'

/**
 * The viewer's active organization. Phase 1 is single-org (Chadwick); the
 * schema already supports multi-org, so this resolves through
 * organization_memberships rather than hardcoding.
 */
export async function getActiveOrganizationId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('organization_memberships')
    .select('organization_id, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
  if (error) throw new Error(`getActiveOrganizationId: ${error.message}`)
  return data?.[0]?.organization_id ?? null
}
