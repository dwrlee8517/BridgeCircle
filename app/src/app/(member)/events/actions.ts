'use server'

import { revalidatePath } from 'next/cache'
import { getAppOrigin } from '@/lib/auth/app-url'
import { requireSession } from '@/lib/auth/session'
import { respondRsvp } from '@/lib/events/respondRsvp'
import { parseRsvpForm } from '@/lib/events/schemas'

export type RsvpActionResult =
  | { ok: true; status: 'going' | 'not_going' | 'waitlisted' }
  | { ok: false; error: string }

/**
 * Server action target for the RSVP buttons. Returns a structured result so
 * the client can render an error toast / inline message rather than silently
 * leaving the UI stuck on the prior state.
 *
 * Common failure modes that previously failed silently:
 *   - migration drift (e.g. column doesn't exist in dev DB yet)
 *   - admin client missing SUPABASE_SECRET_KEY
 *   - invalid eventId in the form
 */
export async function rsvpAction(formData: FormData): Promise<RsvpActionResult> {
  const session = await requireSession()
  const parsed = parseRsvpForm(formData)
  if (!parsed.success) {
    // Log what we got so we can see if the field is missing entirely vs.
    // present-but-malformed. Common cause we hit: zod 4's z.uuid() rejecting
    // a non-canonical UUID, or formData missing one of the fields.
    console.error('[rsvpAction] parse failed', {
      eventIdRaw: formData.get('eventId'),
      statusRaw: formData.get('status'),
      issues: parsed.error.issues,
    })
    const first = parsed.error.issues[0]
    const where = first?.path.join('.') ?? 'input'
    const why = first?.message ?? 'unknown'
    return { ok: false, error: `Invalid ${where}: ${why}` }
  }

  const origin = await getAppOrigin()
  const result = await respondRsvp(origin, session.userId, session.email, parsed.data)

  if (!result.ok) {
    // Surface the server-side cause to the dev console for local debugging,
    // and a friendly version to the user.
    console.error('[rsvpAction] respondRsvp failed:', result)
    if (result.error === 'event_not_found') {
      return {
        ok: false,
        error: "Event not found. It may have been canceled — try refreshing.",
      }
    }
    return {
      ok: false,
      error: `Couldn't save your RSVP${result.detail ? `: ${result.detail}` : '.'}`,
    }
  }

  revalidatePath('/events')
  revalidatePath(`/events/${parsed.data.eventId}`)
  return { ok: true, status: result.status }
}
