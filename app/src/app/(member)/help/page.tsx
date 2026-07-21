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
  searchParams: Promise<{ mode?: string; from?: string; q?: string }>
}) {
  const { mode, from, q } = await searchParams
  const give = mode === 'give'
  const giveQuery = q?.trim() || null

  const { client, context } = await loadMemberContext()
  const membership = selectedMembership(context)
  if (!membership || membership.status !== 'active') notFound()

  const repository = createHelpRepository(client)
  const [home, recentAsks, searchableAsks] = await Promise.all([
    repository.getHome(membership.membershipId),
    give
      ? Promise.resolve([])
      : repository.listMyAsks({
          membershipId: membership.membershipId,
          cursor: null,
          limit: 4,
        }),
    give
      ? repository.listGiveHelp({
          membershipId: membership.membershipId,
          arm: 'search',
          query: giveQuery,
          cursor: null,
          limit: 12,
        })
      : Promise.resolve([]),
  ])
  if (!home) notFound()

  const suggestedAskIds = new Set(home.suggestedAsks.map((ask) => ask.askId))
  const browseAsks = searchableAsks.filter((ask) => !suggestedAskIds.has(ask.id))

  const avatarStorage = createAvatarStorageRepository(client)
  const avatarUrls = Object.fromEntries(
    [...home.directRequests, ...home.suggestedAsks, ...searchableAsks]
      .map((item) => item.asker)
      .flatMap((person) =>
        person.identity === 'identified' && person.avatarPath
          ? [[person.avatarPath, avatarStorage.publicUrl(person.avatarPath)]]
          : [],
      ),
  )

  return give ? (
    <HelpGiveHome
      home={home}
      searchableAsks={browseAsks}
      searchQuery={giveQuery}
      avatarUrls={avatarUrls}
    />
  ) : (
    <HelpGetHome home={home} recentAsks={recentAsks} autostart={from === 'home'} />
  )
}
