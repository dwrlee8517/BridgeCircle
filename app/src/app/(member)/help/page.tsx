import { notFound } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createAvatarStorageRepository } from '@/db/repositories/avatar-storage'
import { createHelpRepository } from '@/db/repositories/help'
import { selectedMembership } from '@/lib/membership/selection'
import { HelpGetHome } from './help-get-home'
import { HelpGiveHome } from './help-give-home'

/**
 * Help is one section with two modes. Only the selected side renders, so the
 * server never pays for both the ask and give data paths in one request.
 */
export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; from?: string }>
}) {
  const { mode, from } = await searchParams
  const give = mode === 'give'

  const { client, context } = await loadMemberContext()
  const membership = selectedMembership(context)
  if (!membership || membership.status !== 'active') notFound()

  const repository = createHelpRepository(client)
  const [home, recentAsks] = await Promise.all([
    repository.getHome(membership.membershipId),
    give
      ? Promise.resolve([])
      : repository.listMyAsks({
          membershipId: membership.membershipId,
          cursor: null,
          limit: 4,
        }),
  ])
  if (!home) notFound()

  const avatarStorage = createAvatarStorageRepository(client)
  const avatarUrls = Object.fromEntries(
    [...home.directRequests, ...home.suggestedAsks]
      .map((item) => item.asker)
      .flatMap((person) =>
        person.identity === 'identified' && person.avatarPath
          ? [[person.avatarPath, avatarStorage.publicUrl(person.avatarPath)]]
          : [],
      ),
  )

  return give ? (
    <HelpGiveHome home={home} avatarUrls={avatarUrls} />
  ) : (
    <HelpGetHome home={home} recentAsks={recentAsks} autostart={from === 'home'} />
  )
}
