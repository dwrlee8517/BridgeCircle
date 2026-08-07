import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import DataLoader from 'dataloader'
import type { Database } from '@/db/database.types'
import { getMemberContext } from '@/db/repositories/member-context'
import { createPeopleRepository } from '@/db/repositories/people'
import type { MemberProfile } from '@/lib/people/contracts'

/**
 * Per-request DataLoaders. Created fresh in `buildContext` so batching and the
 * implicit per-key cache never leak across requests — or across users, which
 * matters under RLS.
 *
 * v2 has no batch member RPC yet, so `memberProfileByUserId` calls the per-user
 * `get_member_profile` for each distinct key. The win today is dedup + request
 * caching — many graph edges pointing at the same person resolve once — and it
 * is the seam a batch RPC drops into later without touching any resolver.
 */
export type Loaders = {
  /** Member profile by target user id, scoped to the viewer's membership. */
  memberProfileByUserId: DataLoader<string, MemberProfile | null>
}

/**
 * Batch resolver: resolve the viewer's membership once, then fetch each distinct
 * target. Generic and dependency-injected so it unit-tests without DB fixtures.
 */
export async function batchMemberProfiles<T>(
  userIds: readonly string[],
  resolveViewerMembershipId: () => Promise<string | null>,
  getProfile: (membershipId: string, userId: string) => Promise<T | null>,
): Promise<(T | null)[]> {
  const membershipId = await resolveViewerMembershipId()
  if (!membershipId) return userIds.map(() => null)
  return Promise.all(userIds.map((userId) => getProfile(membershipId, userId)))
}

export function createLoaders(supabase: SupabaseClient<Database>): Loaders {
  const people = createPeopleRepository(supabase)

  // Resolve the viewer's membership once per request (memoized promise).
  // get_member_profile is membership-scoped; identity is user-scoped but profile
  // reads are membership-scoped — never substitute one for the other.
  let viewerMembership: Promise<string | null> | null = null
  const resolveViewerMembershipId = () => {
    if (!viewerMembership) {
      viewerMembership = getMemberContext(supabase)
        .then((ctx) => ctx.selectedMembershipId ?? ctx.memberships[0]?.membershipId ?? null)
        .catch(() => null)
    }
    return viewerMembership
  }

  const getProfile = async (membershipId: string, userId: string) => {
    const result = await people.getMemberProfile(membershipId, userId)
    return result.ok ? result.profile : null
  }

  return {
    memberProfileByUserId: new DataLoader<string, MemberProfile | null>((userIds) =>
      batchMemberProfiles(userIds, resolveViewerMembershipId, getProfile),
    ),
  }
}
