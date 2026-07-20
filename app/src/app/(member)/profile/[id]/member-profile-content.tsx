import { notFound, redirect } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createAvatarStorageRepository } from '@/db/repositories/avatar-storage'
import { createPeopleRepository } from '@/db/repositories/people'
import { requireSession } from '@/lib/auth/session'
import { selectedMembership } from '@/lib/membership/selection'
import { getMemberProfile } from '@/lib/people/operations'
import { MemberProfileModal } from './member-profile-modal'
import { MemberProfileView } from './member-profile-view'

export async function MemberProfileContent({
  id,
  presentation,
}: {
  id: string
  presentation: 'page' | 'overlay'
}) {
  const returnTo = presentation === 'page' ? `/profile/${id}` : '/people'
  const [session, memberState] = await Promise.all([requireSession(returnTo), loadMemberContext()])
  if (id === session.userId) redirect('/profile/me')

  const membership = selectedMembership(memberState.context)
  if (!membership || membership.status !== 'active') notFound()
  const result = await getMemberProfile(
    membership.membershipId,
    id,
    createPeopleRepository(memberState.client),
  )
  if (!result.ok) notFound()

  const avatarUrl = result.profile.identity.avatarPath
    ? createAvatarStorageRepository(memberState.client).publicUrl(
        result.profile.identity.avatarPath,
      )
    : null
  const name = result.profile.identity.preferredName || result.profile.identity.displayName
  const profileView = (
    <MemberProfileView
      profile={result.profile}
      avatarUrl={avatarUrl}
      organizationId={membership.organization.id}
      organizationName={membership.organization.name}
      presentation={presentation}
    />
  )

  if (presentation === 'overlay') {
    return <MemberProfileModal name={name}>{profileView}</MemberProfileModal>
  }

  return profileView
}
