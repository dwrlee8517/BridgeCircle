import { notFound } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createAvatarStorageRepository } from '@/db/repositories/avatar-storage'
import { createHelpRepository } from '@/db/repositories/help'
import { createHomeRepository } from '@/db/repositories/home'
import { createMessagesRepository } from '@/db/repositories/messages'
import { createSchoolRepository } from '@/db/repositories/school'
import { requireSession } from '@/lib/auth/session'
import type { HomeSource } from '@/lib/home/contracts'
import { composeHome, failedSource, readySource, unavailableSource } from '@/lib/home/operations'
import { selectedMembership } from '@/lib/membership/selection'
import { HomeDashboard } from './home-dashboard'

export default async function HomePage() {
  const [{ client, context }, session] = await Promise.all([loadMemberContext(), requireSession()])
  const membership = selectedMembership(context)
  if (!membership || membership.status !== 'active') notFound()

  const membershipId = membership.membershipId
  const helpRepository = createHelpRepository(client)
  const messagesRepository = createMessagesRepository(client)
  const schoolRepository = createSchoolRepository(client)
  const homeRepository = createHomeRepository(client)

  const [helpResult, asksResult, waitingResult, countsResult, schoolResult, nativeResult] =
    await Promise.allSettled([
      helpRepository.getHome(membershipId),
      helpRepository.listMyAsks({ membershipId, cursor: null, limit: 20 }),
      messagesRepository.listWaiting(),
      messagesRepository.getCounts(),
      schoolRepository.getHome(membershipId),
      homeRepository.getNative(membershipId),
    ])

  const dashboard = composeHome({
    greetingName: membership.profile.preferredName ?? membership.profile.displayName,
    organizationName: membership.organization.name,
    graduationYear: membership.profile.graduationYear,
    help: settledSource(helpResult),
    asks: settledSource(asksResult),
    waiting: settledSource(waitingResult),
    messageCounts: settledSource(countsResult),
    school: settledSource(schoolResult),
    native: settledSource(nativeResult),
  })

  const waiting = dashboard.waiting.status === 'ready' ? dashboard.waiting.data : []
  const avatarStorage = createAvatarStorageRepository(client)
  const avatarUrls = Object.fromEntries(
    waiting.flatMap((item) =>
      item.counterpart.avatarPath
        ? [[item.counterpart.avatarPath, avatarStorage.publicUrl(item.counterpart.avatarPath)]]
        : [],
    ),
  )

  return (
    <HomeDashboard
      dashboard={dashboard}
      membershipId={membershipId}
      userId={session.userId}
      avatarUrls={avatarUrls}
      renderedAt={new Date().toISOString()}
    />
  )
}

function settledSource<T>(result: PromiseSettledResult<T | null>): HomeSource<T> {
  if (result.status === 'rejected') return failedSource<T>()
  if (result.value === null) return unavailableSource<T>()
  return readySource(result.value)
}
