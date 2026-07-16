import { notFound } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createSchoolRepository } from '@/db/repositories/school'
import { selectedMembership } from '@/lib/membership/selection'
import { loadSchoolHome } from '@/lib/school/operations'
import { selectedSchoolEventId } from '@/lib/school/query'
import { SchoolHub } from './school-hub'

export default async function SchoolPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string | string[] }>
}) {
  const { client, context } = await loadMemberContext()
  const membership = selectedMembership(context)
  if (!membership || membership.status !== 'active') notFound()

  const home = await loadSchoolHome(membership.membershipId, createSchoolRepository(client))
  if (!home) notFound()
  const requestedEventId = selectedSchoolEventId((await searchParams).event)
  const selectedEvent =
    home.events.find((event) => event.id === requestedEventId) ??
    home.events.find((event) => event.viewerRsvp === 'offered') ??
    home.events.find((event) => event.viewerRsvp === 'going') ??
    home.events[0] ??
    null

  return <SchoolHub home={home} selectedEvent={selectedEvent} />
}
