import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { sendEventRsvpConfirmationEmail } from '@/notify/resend'
import type { RsvpInput } from './schemas'

export type RespondRsvpResult =
  | { ok: true; status: 'going' | 'not_going' }
  | { ok: false; error: 'event_not_found' | 'db_error'; detail?: string }

/**
 * Upsert the viewer's RSVP. Idempotent: re-RSVPing with the same status is
 * a no-op from the user's perspective (and we avoid re-sending the confirm
 * email by reading the prior status first).
 *
 * Email confirmation only fires on going (per spec — "no reminders beyond
 * a single confirmation email on RSVP"), and only when the status actually
 * transitions into going.
 */
export async function respondRsvp(
  supabase: SupabaseClient<Database>,
  appOrigin: string,
  userId: string,
  userEmail: string,
  input: RsvpInput,
): Promise<RespondRsvpResult> {
  const { data: event, error: evtErr } = await supabase
    .from('events')
    .select('id, title, starts_at, location, organization_id')
    .eq('id', input.eventId)
    .maybeSingle()
  if (evtErr || !event) return { ok: false, error: 'event_not_found' }

  const { data: prior } = await supabase
    .from('event_rsvps')
    .select('status')
    .eq('event_id', input.eventId)
    .eq('user_id', userId)
    .maybeSingle()

  const { error: upsertErr } = await supabase.from('event_rsvps').upsert(
    {
      event_id: input.eventId,
      user_id: userId,
      status: input.status,
      responded_at: new Date().toISOString(),
    },
    { onConflict: 'event_id,user_id' },
  )

  if (upsertErr) return { ok: false, error: 'db_error', detail: upsertErr.message }

  const wasGoing = prior?.status === 'going'
  const justWentGoing = input.status === 'going' && !wasGoing

  if (justWentGoing) {
    await sendEventRsvpConfirmationEmail({
      to: userEmail,
      eventTitle: event.title,
      eventStartsAt: event.starts_at,
      eventLocation: event.location,
      eventUrl: `${appOrigin}/events`,
    }).catch(() => {
      // Best-effort. The RSVP row is already written; the user sees the
      // confirmed state in the UI regardless.
    })
  }

  return { ok: true, status: input.status }
}
