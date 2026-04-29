import 'server-only'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/db/admin'
import { createNotificationsForMany } from '@/lib/notifications/createNotification'
import { sendEventCanceledEmail } from '@/notify/resend'

export type CancelEventInput = {
  eventId: string
  actorUserId: string
  /** Optional message included in the cancellation email body. */
  reason?: string | null
}

export type CancelEventResult =
  | { ok: true; emailsSent: number }
  | { ok: false; error: 'event_not_found' | 'already_canceled' | 'db_error'; detail?: string }

/**
 * Admin cancels an event without removing the row.
 *
 * Soft-cancel via `published_at = null` — RLS ("members read published
 * events" requires published_at not null) hides it from member views
 * immediately. The event row + RSVP rows stay so we have history. To
 * un-cancel, write a backfill SQL or expose an "uncancel" admin action
 * later (out of scope here).
 *
 * Side effects:
 *   - emails everyone with `going` status (or `waitlisted`, since they
 *     intended to attend if a spot opened up)
 *   - audit log entry
 *
 * Uses the admin client because we need to read user emails from
 * auth.users (RLS blocks members from seeing other members' emails) and
 * we want the cancellation to succeed even if the caller's session has
 * scoping limits.
 */
export async function cancelEvent(input: CancelEventInput): Promise<CancelEventResult> {
  const admin = createAdminClient()

  const { data: event } = await admin
    .from('events')
    .select('id, organization_id, title, starts_at, location, published_at')
    .eq('id', input.eventId)
    .maybeSingle()

  if (!event) return { ok: false, error: 'event_not_found' }
  if (event.published_at === null) return { ok: false, error: 'already_canceled' }

  const { error: updErr } = await admin
    .from('events')
    .update({ published_at: null })
    .eq('id', input.eventId)
  if (updErr) return { ok: false, error: 'db_error', detail: updErr.message }

  await admin.from('audit_log').insert({
    actor_id: input.actorUserId,
    organization_id: event.organization_id,
    action: 'event.canceled',
    target_type: 'event',
    target_id: input.eventId,
    payload: input.reason ? { reason: input.reason } : null,
  })

  // Notify everyone who intended to attend (going + waitlisted).
  const { data: rsvps } = await admin
    .from('event_rsvps')
    .select('user_id')
    .eq('event_id', input.eventId)
    .in('status', ['going', 'waitlisted'])

  // In-app notifications fan out first — cheap, always-on. Emails follow.
  await createNotificationsForMany(
    (rsvps ?? []).map((r) => r.user_id),
    {
      type: 'event_canceled',
      organizationId: event.organization_id,
      targetType: 'event',
      targetId: input.eventId,
      payload: { actor_id: input.actorUserId, event_title: event.title },
    },
  )

  let emailsSent = 0
  for (const r of rsvps ?? []) {
    const { data: userRes } = await admin.auth.admin.getUserById(r.user_id)
    const email = userRes?.user?.email
    if (!email) continue
    const { data: base } = await admin
      .from('base_profiles')
      .select('name')
      .eq('user_id', r.user_id)
      .maybeSingle()
    const sendResult = await sendEventCanceledEmail({
      to: email,
      recipientName: base?.name ?? null,
      eventTitle: event.title,
      eventStartsAt: event.starts_at,
      eventLocation: event.location,
      reason: input.reason ?? null,
    })
    if (sendResult.ok) {
      emailsSent += 1
    } else {
      Sentry.captureMessage('event-canceled email failed', {
        level: 'warning',
        extra: {
          scope: 'event-cancel-fanout',
          eventId: input.eventId,
          userId: r.user_id,
          error: sendResult.error,
        },
      })
    }
  }

  return { ok: true, emailsSent }
}
