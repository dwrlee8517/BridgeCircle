import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

export type DeleteEventResult =
  | { ok: true }
  | { ok: false; error: 'event_not_found' | 'db_error'; detail?: string }

/**
 * Hard-delete an event row. Cascades to event_rsvps via FK on delete cascade.
 *
 * Reserved for typo / mistake events. The expected admin path for "this event
 * isn't happening" is cancelEvent, which preserves the row + RSVP history
 * and notifies attendees. This function bypasses both — only use it when
 * the event was created in error and you want it gone from the DB.
 *
 * Service-role isn't strictly required (admins have RLS DELETE permission)
 * but we go through the user's session client so RLS double-checks the
 * caller is an admin of this org. Keeps the privilege boundary tight.
 */
export async function deleteEvent(
  supabase: SupabaseClient<Database>,
  eventId: string,
  actorUserId: string,
): Promise<DeleteEventResult> {
  // Read first so we can write the audit row with the org_id even after the
  // delete cascades. (Audit rows are append-only and don't FK into events.)
  const { data: event } = await supabase
    .from('events')
    .select('organization_id, title')
    .eq('id', eventId)
    .maybeSingle()

  if (!event) return { ok: false, error: 'event_not_found' }

  const { error: delErr } = await supabase.from('events').delete().eq('id', eventId)
  if (delErr) return { ok: false, error: 'db_error', detail: delErr.message }

  await supabase.from('audit_log').insert({
    actor_id: actorUserId,
    organization_id: event.organization_id,
    action: 'event.deleted',
    target_type: 'event',
    target_id: eventId,
    payload: { title: event.title },
  })

  return { ok: true }
}
