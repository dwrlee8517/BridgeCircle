import { notFound } from 'next/navigation'
import { z } from 'zod'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createAvatarStorageRepository } from '@/db/repositories/avatar-storage'
import { createHelpRepository } from '@/db/repositories/help'
import { requireSession } from '@/lib/auth/session'
import { selectedMembership } from '@/lib/membership/selection'
import { AskStatusView } from './ask-status-view'
import { GiveDirectView } from './give-direct-view'

export default async function AskStatusPage({ params }: { params: Promise<{ askId: string }> }) {
  const [{ askId }, session, memberState] = await Promise.all([
    params,
    requireSession(),
    loadMemberContext(),
  ])
  if (!z.guid().safeParse(askId).success) notFound()

  const membership = selectedMembership(memberState.context)
  if (!membership || membership.status !== 'active') notFound()

  const detail = await createHelpRepository(memberState.client).getAskDetail(askId)
  if (!detail) notFound()

  const avatarStorage = createAvatarStorageRepository(memberState.client)
  const isOwner = detail.asker.identity === 'identified' && detail.asker.userId === session.userId
  const isDirectRecipient = detail.kind === 'direct' && detail.recipient?.userId === session.userId

  if (isDirectRecipient && !isOwner) {
    const askerAvatarPath = detail.asker.identity === 'identified' ? detail.asker.avatarPath : null
    return (
      <GiveDirectView
        detail={detail}
        avatarUrl={askerAvatarPath ? avatarStorage.publicUrl(askerAvatarPath) : null}
      />
    )
  }

  if (!isOwner) notFound()

  const avatarPaths = [
    detail.recipient?.avatarPath,
    ...detail.offers.map((offer) => offer.helper.avatarPath),
  ].filter((path): path is string => Boolean(path))
  const avatarUrls = Object.fromEntries(
    avatarPaths.map((path) => [path, avatarStorage.publicUrl(path)]),
  )

  return (
    <AskStatusView
      detail={detail}
      avatarUrls={avatarUrls}
      membershipId={membership.membershipId}
      organizationName={membership.organization.name}
      graduationYear={membership.profile.graduationYear}
    />
  )
}
