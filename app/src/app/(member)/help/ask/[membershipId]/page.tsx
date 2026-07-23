import { notFound } from 'next/navigation'
import { z } from 'zod'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createAvatarStorageRepository } from '@/db/repositories/avatar-storage'
import { createHelpRepository } from '@/db/repositories/help'
import { getDirectAskTarget } from '@/lib/help/operations'
import { selectedMembership } from '@/lib/membership/selection'
import { DirectAskComposer } from './direct-ask-composer'

const membershipIdSchema = z.uuid()
const topicSchema = z.string().trim().min(1).max(100)

export default async function DirectAskPage({
  params,
  searchParams,
}: {
  params: Promise<{ membershipId: string }>
  searchParams: Promise<{ draft?: string; skip?: string; topic?: string }>
}) {
  const [{ membershipId: recipientMembershipId }, { draft, skip, topic }] = await Promise.all([
    params,
    searchParams,
  ])
  if (!membershipIdSchema.safeParse(recipientMembershipId).success) notFound()

  const { client, context } = await loadMemberContext()
  const membership = selectedMembership(context)
  if (!membership || membership.status !== 'active') notFound()
  const recipient = await getDirectAskTarget(
    { membershipId: membership.membershipId, recipientMembershipId },
    createHelpRepository(client),
  )
  if (!recipient) notFound()

  const cleanedTopic = topicSchema.safeParse(topic)
  const initialQuestion = cleanedTopic.success
    ? `I’m hoping to learn from your experience with ${cleanedTopic.data}.`
    : ''
  const avatarUrl = recipient.avatarPath
    ? createAvatarStorageRepository(client).publicUrl(recipient.avatarPath)
    : null

  return (
    <DirectAskComposer
      viewerMembershipId={membership.membershipId}
      recipient={{
        membershipId: recipient.membershipId,
        userId: recipient.userId,
        displayName: recipient.displayName,
        headline: recipient.headline,
        avatarUrl,
        graduationYear: recipient.graduationYear,
        matchReason: recipient.topics.length
          ? `Offers help with ${recipient.topics.join(', ')}`
          : 'Open to help',
      }}
      initialQuestion={initialQuestion}
      skipAi={skip === '1'}
      useSearchDraft={draft === '1'}
    />
  )
}
