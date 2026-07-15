import { notFound, redirect } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createAvatarStorageRepository } from '@/db/repositories/avatar-storage'
import { createPeopleRepository } from '@/db/repositories/people'
import { requireSession } from '@/lib/auth/session'
import { selectedMembership } from '@/lib/membership/selection'
import { getMemberProfile } from '@/lib/people/operations'
import { MemberProfileView } from './member-profile-view'

export default async function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session, memberState] = await Promise.all([
    params,
    requireSession('/people'),
    loadMemberContext(),
  ])
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

  return (
    <MemberProfileView
      profile={result.profile}
      avatarUrl={avatarUrl}
      organizationId={membership.organization.id}
      organizationName={membership.organization.name}
    />
  )
}
