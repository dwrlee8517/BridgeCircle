'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { createSchoolRepository } from '@/db/repositories/school'
import { selectedMembership } from '@/lib/membership/selection'
import { respondToSchoolEvent } from '@/lib/school/operations'

export type SchoolActionState = { status: 'idle' | 'success' | 'error'; message: string }

const eventResponseSchema = z.object({
  eventId: z.uuid(),
  intent: z.enum(['going', 'not_going', 'join_waitlist', 'accept_offer', 'pass_offer']),
})

const successCopy = {
  going: "You're going — it is on your School page.",
  waitlisted: "You're on the list — we will ask before taking a spot.",
  not_going: 'You are off the list. If it was full, the next person is asked.',
} as const

export async function respondToEventAction(
  _state: SchoolActionState,
  formData: FormData,
): Promise<SchoolActionState> {
  const parsed = eventResponseSchema.safeParse({
    eventId: formData.get('eventId'),
    intent: formData.get('intent'),
  })
  if (!parsed.success) return { status: 'error', message: 'That response could not be read.' }

  const { client, context } = await loadMemberContext()
  const membership = selectedMembership(context)
  if (!membership || membership.status !== 'active') {
    return { status: 'error', message: 'Choose an active circle and try again.' }
  }
  const result = await respondToSchoolEvent(
    membership.membershipId,
    parsed.data.eventId,
    parsed.data.intent,
    createSchoolRepository(client),
  )
  revalidatePath('/school')
  revalidatePath(`/school/events/${parsed.data.eventId}`)

  if (result in successCopy) {
    return { status: 'success', message: successCopy[result as keyof typeof successCopy] }
  }
  const message =
    result === 'full'
      ? 'This event is full and does not have a waitlist.'
      : result === 'offer_expired'
        ? 'That held spot has expired and passed to the next person.'
        : result === 'not_offered'
          ? 'That spot is no longer waiting for a decision.'
          : result === 'not_open'
            ? 'This event is no longer open for responses.'
            : 'This event is not available in the selected circle.'
  return { status: 'error', message }
}

const announcementReadSchema = z.object({ announcementId: z.uuid() })

export async function markAnnouncementReadAction(announcementId: string) {
  const parsed = announcementReadSchema.safeParse({ announcementId })
  if (!parsed.success) return
  const { client, context } = await loadMemberContext()
  const membership = selectedMembership(context)
  if (!membership || membership.status !== 'active') return
  await createSchoolRepository(client).markAnnouncementRead(
    membership.membershipId,
    parsed.data.announcementId,
  )
  revalidatePath('/school')
  revalidatePath('/school/announcements')
}
