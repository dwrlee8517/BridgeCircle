import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { EventCreateInput } from './schemas'

export type EditEventInput = EventCreateInput & {
  /** Capacity column added by the day15 migration. null = unlimited. */
  capacity?: number | null
}

export type EditEventResult =
  | { ok: true }
  | { ok: false; error: 'event_not_found' | 'past_start' | 'db_error'; detail?: string }

/**
 * Admin updates an existing event. Allowed fields: title, description,
 * location, starts_at, capacity. Reusing eventCreateSchema keeps validation
 * consistent with create — no separate edit schema to maintain.
 *
 * Past-start guard: if the new starts_at is in the past, we reject.
 * Editing an event that's already in the past (admin fixing a typo on a
 * past event) is fine because we only check the new value.
 *
 * Cancel and delete are separate functions — this one is purely an update.
 */
export async function editEvent(
  supabase: SupabaseClient<Database>,
  eventId: string,
  actorUserId: string,
  input: EditEventInput,
): Promise<EditEventResult> {
  if (new Date(input.startsAt).getTime() < Date.now()) {
    // Compare to "now" only when the user actually moved the date into the
    // past; the create flow does the same. Editing a past event without
    // changing the date should still go through, so this guard fires only
    // on the proposed new value.
    const { data: existing } = await supabase
      .from('events')
      .select('starts_at')
      .eq('id', eventId)
      .maybeSingle()
    if (!existing || existing.starts_at !== input.startsAt) {
      return { ok: false, error: 'past_start' }
    }
  }

  const { data: row, error: updErr } = await supabase
    .from('events')
    .update({
      title: input.title,
      description: input.description,
      location: input.location,
      starts_at: input.startsAt,
      ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
    })
    .eq('id', eventId)
    .select('id, organization_id')
    .maybeSingle()

  if (updErr || !row) {
    return updErr
      ? { ok: false, error: 'db_error', detail: updErr.message }
      : { ok: false, error: 'event_not_found' }
  }

  await supabase.from('audit_log').insert({
    actor_id: actorUserId,
    organization_id: row.organization_id,
    action: 'event.edited',
    target_type: 'event',
    target_id: eventId,
  })

  return { ok: true }
}
