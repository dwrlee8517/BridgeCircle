import { notFound } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createSchoolRepository } from '@/db/repositories/school'
import { selectedMembership } from '@/lib/membership/selection'
import { loadSchoolEvent, loadSchoolEventAttendees } from '@/lib/school/operations'
import { SchoolEventDetailPage } from './school-event-detail-page'

export default async function SchoolEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { client, context } = await loadMemberContext()
  const membership = selectedMembership(context)
  if (!membership || membership.status !== 'active') notFound()
  const repository = createSchoolRepository(client)
  const [event, attendees] = await Promise.all([
    loadSchoolEvent(membership.membershipId, id, repository),
    loadSchoolEventAttendees(membership.membershipId, id, repository),
  ])
  if (!event || !attendees) notFound()

  const avatarUrls = Object.fromEntries(
    attendees.items.flatMap((attendee) =>
      attendee.avatarPath
        ? [
            [
              attendee.avatarPath,
              client.storage.from('avatars').getPublicUrl(attendee.avatarPath).data.publicUrl,
            ],
          ]
        : [],
    ),
  )
  return <SchoolEventDetailPage event={event} attendees={attendees} avatarUrls={avatarUrls} />
}
