import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createAvatarStorageRepository } from '@/db/repositories/avatar-storage'
import { createProfileRepository } from '@/db/repositories/profiles'
import { selectedMembership } from '@/lib/membership/selection'
import { SelfProfileView } from './self-profile-view'

export default async function MyProfilePage() {
  const memberState = await loadMemberContext()
  const membership = selectedMembership(memberState.context)
  if (!membership || (membership.status !== 'active' && membership.status !== 'pending')) {
    throw new Error('Self profile membership is unavailable')
  }

  const result = await createProfileRepository(memberState.client).get(membership.membershipId)
  if (!result.ok) throw new Error('Self profile is unavailable')

  const avatarUrl = result.profile.identity.avatarPath
    ? createAvatarStorageRepository(memberState.client).publicUrl(
        result.profile.identity.avatarPath,
      )
    : null

  return <SelfProfileView profile={result.profile} avatarUrl={avatarUrl} />
}
