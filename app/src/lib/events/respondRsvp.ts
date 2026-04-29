import 'server-only'
import { createAdminClient } from '@/db/admin'
import { sendEventRsvpConfirmationEmail, sendEventWaitlistPromotedEmail } from '@/notify/resend'
import type { RsvpInput } from './schemas'

/**
 * Resolved status returned to the caller. The form sends 'going' or
 * 'not_going'; the lib decides whether 'going' becomes 'waitlisted' based
 * on capacity, so callers must read this back rather than trust input.status.
 */
export type ResolvedRsvpStatus = 'going' | 'not_going' | 'waitlisted'

export type RespondRsvpResult =
  | { ok: true; status: ResolvedRsvpStatus }
  | { ok: false; error: 'event_not_found' | 'db_error'; detail?: string }

/**
 * Upsert the viewer's RSVP, with capacity-aware "going / waitlisted"
 * resolution and auto-promotion when a going user backs out.
 *
 * State machine on input.status:
 *   'going'     → if capacity is set and going_count >= capacity, store
 *                 'waitlisted' instead. Otherwise store 'going'.
 *   'not_going' → store 'not_going'. If the prior status was 'going' and
 *                 capacity is set, promote the oldest 'waitlisted' user to
 *                 'going' and email them.
 *
 * Idempotency: re-RSVPing with the same effective status is harmless; we
 * read the prior row to suppress duplicate confirmation emails.
 *
 * Uses the admin client because:
 *   - the auto-promotion path needs to update another user's RSVP row,
 *     which RLS forbids the caller from doing through their own session
 *   - the email lookup goes through auth.admin.getUserById
 */
export async function respondRsvp(
  appOrigin: string,
  userId: string,
  userEmail: string,
  input: RsvpInput,
): Promise<RespondRsvpResult> {
  const admin = createAdminClient()

  const { data: event, error: evtErr } = await admin
    .from('events')
    .select('id, title, starts_at, location, organization_id, capacity, published_at')
    .eq('id', input.eventId)
    .maybeSingle()
  if (evtErr || !event) return { ok: false, error: 'event_not_found' }
  if (event.published_at === null) {
    // Canceled event: treat as not-found from the user's perspective. They
    // shouldn't have a path to RSVP a canceled event anyway, but defense
    // in depth.
    return { ok: false, error: 'event_not_found' }
  }

  const { data: prior } = await admin
    .from('event_rsvps')
    .select('status')
    .eq('event_id', input.eventId)
    .eq('user_id', userId)
    .maybeSingle()

  // Resolve target status based on capacity.
  let resolved: ResolvedRsvpStatus
  if (input.status === 'not_going') {
    resolved = 'not_going'
  } else if (event.capacity === null) {
    resolved = 'going'
  } else {
    // Count current going (excluding the user's own current going row, if any —
    // they're flipping to going from somewhere else and shouldn't double-count).
    const { count: goingCount } = await admin
      .from('event_rsvps')
      .select('user_id', { count: 'exact', head: true })
      .eq('event_id', input.eventId)
      .eq('status', 'going')
      .neq('user_id', userId)
    resolved = (goingCount ?? 0) >= event.capacity ? 'waitlisted' : 'going'
  }

  const { error: upsertErr } = await admin.from('event_rsvps').upsert(
    {
      event_id: input.eventId,
      user_id: userId,
      status: resolved,
      responded_at: new Date().toISOString(),
    },
    { onConflict: 'event_id,user_id' },
  )
  if (upsertErr) return { ok: false, error: 'db_error', detail: upsertErr.message }

  const wasGoing = prior?.status === 'going'
  const justWentGoing = resolved === 'going' && !wasGoing

  // Confirmation email only fires on 'going' (not 'waitlisted' — different
  // template) and only on the going-transition.
  if (justWentGoing) {
    sendEventRsvpConfirmationEmail({
      to: userEmail,
      eventTitle: event.title,
      eventStartsAt: event.starts_at,
      eventLocation: event.location,
      eventUrl: `${appOrigin}/events/${event.id}`,
    }).catch(() => {
      // Best-effort. The RSVP row is already written.
    })
  }

  // Auto-promote: if the user just left 'going' (now not_going or waitlisted —
  // the latter shouldn't happen but safe), and there's capacity-based ordering,
  // pull the oldest waitlisted user up.
  if (wasGoing && resolved !== 'going' && event.capacity !== null) {
    await promoteOldestWaitlisted(event.id, event.organization_id, appOrigin)
  }

  return { ok: true, status: resolved }
}

async function promoteOldestWaitlisted(
  eventId: string,
  _organizationId: string,
  appOrigin: string,
): Promise<void> {
  const admin = createAdminClient()

  const { data: oldest } = await admin
    .from('event_rsvps')
    .select('user_id, responded_at')
    .eq('event_id', eventId)
    .eq('status', 'waitlisted')
    .order('responded_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!oldest) return

  const { error: updErr } = await admin
    .from('event_rsvps')
    .update({ status: 'going', responded_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('user_id', oldest.user_id)
  if (updErr) return // best-effort

  // Email the promoted user.
  const [{ data: userRes }, { data: base }, { data: event }] = await Promise.all([
    admin.auth.admin.getUserById(oldest.user_id),
    admin.from('base_profiles').select('name').eq('user_id', oldest.user_id).maybeSingle(),
    admin.from('events').select('title, starts_at, location').eq('id', eventId).maybeSingle(),
  ])
  const email = userRes?.user?.email
  if (!email || !event) return

  await sendEventWaitlistPromotedEmail({
    to: email,
    recipientName: base?.name ?? null,
    eventTitle: event.title,
    eventStartsAt: event.starts_at,
    eventLocation: event.location,
    eventUrl: `${appOrigin}/events/${eventId}`,
  }).catch(() => {
    // Best-effort.
  })
}
