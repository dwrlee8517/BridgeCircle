import { notFound } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createAvatarStorageRepository } from '@/db/repositories/avatar-storage'
import { createProfileRepository } from '@/db/repositories/profiles'
import { selectedMembership } from '@/lib/membership/selection'
import { SelfProfileView } from './self-profile-view'

export default async function MyProfilePage() {
  const memberState = await loadMemberContext()
  const membership = selectedMembership(memberState.context)
  if (!membership || (membership.status !== 'active' && membership.status !== 'pending')) notFound()

  const result = await createProfileRepository(memberState.client).get(membership.membershipId)
  if (!result.ok) notFound()

  const avatarUrl = result.profile.identity.avatarPath
    ? createAvatarStorageRepository(memberState.client).publicUrl(
        result.profile.identity.avatarPath,
      )
    : null

  return <SelfProfileView profile={result.profile} avatarUrl={avatarUrl} />
}
