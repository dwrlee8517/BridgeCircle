import type { NextRequest } from 'next/server'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createSchoolRepository } from '@/db/repositories/school'
import { selectedMembership } from '@/lib/membership/selection'
import { buildSchoolEventCalendar, eventCalendarFilename } from '@/lib/school/time'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { client, context } = await loadMemberContext()
  const membership = selectedMembership(context)
  if (!membership || membership.status !== 'active')
    return new Response('Not found', { status: 404 })
  const event = await createSchoolRepository(client).getEvent(membership.membershipId, id)
  if (!event || event.status === 'cancelled') return new Response('Not found', { status: 404 })
  const canonicalUrl = new URL(`/school/events/${event.id}`, request.nextUrl.origin).toString()
  return new Response(buildSchoolEventCalendar(event, canonicalUrl), {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="${eventCalendarFilename(event.title)}"`,
      'cache-control': 'private, no-store',
    },
  })
}
