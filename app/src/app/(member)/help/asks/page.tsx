import { notFound } from 'next/navigation'
import { z } from 'zod'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createHelpRepository } from '@/db/repositories/help'
import { requireSession } from '@/lib/auth/session'
import type { HelpCursor } from '@/lib/help/contracts'
import { selectedMembership } from '@/lib/membership/selection'
import { AskHistoryView } from './ask-history-view'

const cursorSchema = z
  .object({
    before: z.string().refine((value) => Number.isFinite(Date.parse(value))),
    id: z.guid(),
  })
  .strict()

export default async function AskHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ before?: string; id?: string }>
}) {
  const [session, params, memberState] = await Promise.all([
    requireSession('/help/asks'),
    searchParams,
    loadMemberContext(),
  ])
  const membership = selectedMembership(memberState.context)
  if (!membership || membership.status !== 'active') notFound()

  const parsedCursor = cursorSchema.safeParse(params)
  const cursor: HelpCursor | null = parsedCursor.success
    ? { createdAt: parsedCursor.data.before, id: parsedCursor.data.id }
    : null
  const repository = createHelpRepository(memberState.client)
  const [home, rows] = await Promise.all([
    repository.getHome(membership.membershipId),
    repository.listMyAsks({ membershipId: membership.membershipId, cursor, limit: 21 }),
  ])
  if (!home) notFound()

  const asks = rows.slice(0, 20)
  const last = asks.at(-1)
  const olderHref =
    rows.length > 20 && last
      ? `/help/asks?before=${encodeURIComponent(last.createdAt)}&id=${encodeURIComponent(last.id)}`
      : null

  return (
    <AskHistoryView
      asks={asks}
      activeAskCount={home.activeAskCount}
      activeAskLimit={home.activeAskLimit}
      organizationName={membership.organization.name}
      userId={session.userId}
      olderHref={olderHref}
      paged={cursor !== null}
    />
  )
}
