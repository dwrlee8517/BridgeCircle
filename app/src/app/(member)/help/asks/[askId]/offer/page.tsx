import { notFound } from 'next/navigation'
import { z } from 'zod'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createAvatarStorageRepository } from '@/db/repositories/avatar-storage'
import { createHelpRepository } from '@/db/repositories/help'
import { requireSession } from '@/lib/auth/session'
import { selectedMembership } from '@/lib/membership/selection'
import { GiveOfferView } from './give-offer-view'

export default async function GiveOfferPage({ params }: { params: Promise<{ askId: string }> }) {
  const [{ askId }, session, memberState] = await Promise.all([
    params,
    requireSession(),
    loadMemberContext(),
  ])
  if (!z.uuid().safeParse(askId).success) notFound()

  const membership = selectedMembership(memberState.context)
  if (!membership || membership.status !== 'active') notFound()

  const repository = createHelpRepository(memberState.client)
  const [detail, preferences] = await Promise.all([
    repository.getAskDetail(askId),
    repository.getHelperPreferences(membership.membershipId),
  ])
  if (
    !detail ||
    detail.kind !== 'circle' ||
    detail.organizationId !== membership.organization.id ||
    (detail.asker.identity === 'identified' && detail.asker.userId === session.userId)
  ) {
    notFound()
  }

  const ownOffer = detail.offers.find((offer) => offer.helper.userId === session.userId)
  if (!ownOffer && (detail.status !== 'open' || !preferences?.openToHelp || preferences.pausedAt)) {
    notFound()
  }

  const avatarPath = detail.asker.identity === 'identified' ? detail.asker.avatarPath : null
  const avatarUrl = avatarPath
    ? createAvatarStorageRepository(memberState.client).publicUrl(avatarPath)
    : null

  return <GiveOfferView detail={detail} avatarUrl={avatarUrl} viewerUserId={session.userId} />
}
