import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { EventCreateInput } from './schemas'

export type CreateEventResult =
  | { ok: true; eventId: string }
  | { ok: false; error: 'db_error' | 'past_start'; detail?: string }

/**
 * Admin creates a new event. Per phase-1-launch-spec there's no draft state
 * at launch — events are published immediately so they show up on /events.
 *
 * RLS enforces admin-only inserts; this function trusts the caller has
 * already gone through requireAdmin in the server action above it.
 */
export async function createEvent(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  createdBy: string,
  input: EventCreateInput,
): Promise<CreateEventResult> {
  if (new Date(input.startsAt).getTime() < Date.now()) {
    return { ok: false, error: 'past_start' }
  }

  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from('events')
    .insert({
      organization_id: organizationId,
      created_by: createdBy,
      title: input.title,
      description: input.description,
      location: input.location,
      starts_at: input.startsAt,
      published_at: nowIso,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { ok: false, error: 'db_error', detail: error?.message }
  }

  await supabase.from('audit_log').insert({
    actor_id: createdBy,
    organization_id: organizationId,
    action: 'event.created',
    target_type: 'event',
    target_id: data.id,
  })

  return { ok: true, eventId: data.id }
}
