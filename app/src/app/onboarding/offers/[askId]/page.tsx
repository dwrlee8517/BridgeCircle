import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { GiveOfferView } from '@/app/(member)/help/asks/[askId]/offer/give-offer-view'
import { Wordmark } from '@/components/ui/wordmark'
import { createAvatarStorageRepository } from '@/db/repositories/avatar-storage'
import { createHelpRepository } from '@/db/repositories/help'
import { requireSession } from '@/lib/auth/session'
import { selectedMembership } from '@/lib/membership/selection'

export default async function OnboardingOfferPage({
  params,
}: {
  params: Promise<{ askId: string }>
}) {
  const [{ askId }, session, memberState] = await Promise.all([
    params,
    requireSession('/onboarding?step=7'),
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
    detail.status !== 'open' ||
    detail.organizationId !== membership.organization.id ||
    !preferences?.openToHelp ||
    preferences.pausedAt ||
    (detail.asker.identity === 'identified' && detail.asker.userId === session.userId)
  ) {
    notFound()
  }

  const avatarPath = detail.asker.identity === 'identified' ? detail.asker.avatarPath : null
  const avatarUrl = avatarPath
    ? createAvatarStorageRepository(memberState.client).publicUrl(avatarPath)
    : null

  return (
    <div className="min-h-dvh bg-[image:var(--wash-page)]">
      <header className="flex min-h-16 items-center border-b border-[var(--border-subtle)] bg-white px-4 sm:px-8">
        <Link
          href="/onboarding?step=7"
          aria-label="Back to onboarding"
          className="mr-3 inline-flex size-10 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <ArrowLeft aria-hidden className="size-4" />
        </Link>
        <Wordmark withIcon={false} textClassName="text-lg" />
      </header>
      <GiveOfferView
        detail={detail}
        avatarUrl={avatarUrl}
        viewerUserId={session.userId}
        returnHref="/onboarding?step=7"
        returnLabel="Back to onboarding"
        onboarding
      />
    </div>
  )
}
