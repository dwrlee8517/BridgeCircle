import { notFound } from 'next/navigation'
import { z } from 'zod'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { selectedMembership } from '@/lib/membership/selection'
import { DirectAskComposer } from './direct-ask-composer'

const membershipIdSchema = z.uuid()

export default async function DirectAskPage({
  params,
  searchParams,
}: {
  params: Promise<{ membershipId: string }>
  searchParams: Promise<{ skip?: string }>
}) {
  const [{ membershipId: recipientMembershipId }, { skip }] = await Promise.all([
    params,
    searchParams,
  ])
  if (!membershipIdSchema.safeParse(recipientMembershipId).success) notFound()

  const { context } = await loadMemberContext()
  const membership = selectedMembership(context)
  if (!membership || membership.status !== 'active') notFound()

  return (
    <DirectAskComposer
      viewerMembershipId={membership.membershipId}
      recipientMembershipId={recipientMembershipId}
      skipAi={skip === '1'}
    />
  )
}
