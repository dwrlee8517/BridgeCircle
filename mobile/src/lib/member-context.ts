import { supabase } from './supabase'

/**
 * Slim mobile mirror of the web's member-context repository
 * (app/src/db/repositories/member-context.ts). The v2 architecture is
 * RPC-first: `api.get_my_member_context` runs as the signed-in user and is
 * the same boundary the web crosses — mobile calls it directly instead of
 * re-deriving membership from tables.
 */
export type MemberContextLite = {
  membershipId: string | null
  displayName: string | null
  preferredName: string | null
  organizationName: string | null
}

type MembershipRow = {
  membershipId: string
  organization?: { name?: string | null } | null
  profile?: { displayName?: string | null; preferredName?: string | null } | null
}

export async function getMemberContextLite(): Promise<MemberContextLite> {
  const { data, error } = await supabase.schema('api').rpc('get_my_member_context', {}).single()
  if (error) throw new Error(`getMemberContextLite: ${error.message}`)

  const row = data as {
    selected_membership_id: string | null
    memberships: MembershipRow[] | null
  }
  const selected =
    row.memberships?.find((m) => m.membershipId === row.selected_membership_id) ??
    row.memberships?.[0] ??
    null
  return {
    membershipId: selected?.membershipId ?? null,
    displayName: selected?.profile?.displayName ?? null,
    preferredName: selected?.profile?.preferredName ?? null,
    organizationName: selected?.organization?.name ?? null,
  }
}
