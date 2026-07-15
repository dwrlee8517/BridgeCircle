import { notFound } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { selectedMembership } from '@/lib/membership/selection'
import { CircleAskComposer } from './circle-ask-composer'

export default async function CircleAskPage() {
  const { context } = await loadMemberContext()
  const membership = selectedMembership(context)
  if (!membership || membership.status !== 'active') notFound()

  return (
    <CircleAskComposer
      membershipId={membership.membershipId}
      organizationName={membership.organization.name}
      graduationYear={membership.profile.graduationYear}
    />
  )
}
