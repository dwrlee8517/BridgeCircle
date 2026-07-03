import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/db/admin'
import type { Database } from '@/db/database.types'
import { createNotification } from '@/lib/notifications/createNotification'
import { sendAskAcceptedEmail } from '@/notify/resend'
import type { DeclineReason } from './declineReasons'

export type RespondInput = {
  askId: string
  decision: 'accepted' | 'declined'
  /** Optional structured reason when declining — shapes the asker-facing
   * copy and records a routing signal. Never required. */
  declineReason?: DeclineReason | null
}

export type RespondResult =
  | { ok: true; threadId: string | null }
  | {
      ok: false
      error: 'not_found' | 'not_pending' | 'not_helper' | 'db_error'
      detail?: string
    }

/**
 * Helper responds to a pending ask. On accept, creates an ask_thread (if
 * not already present) and emails the asker.
 *
 * Idempotent: if the ask is already accepted/declined, returns ok with
 * the existing thread id (or null for declined).
 */
export async function respondToAsk(
  supabase: SupabaseClient<Database>,
  appOrigin: string,
  helperId: string,
  input: RespondInput,
): Promise<RespondResult> {
  const { data: ask, error: askErr } = await supabase
    .from('asks')
    .select('id, helper_id, asker_id, organization_id, status')
    .eq('id', input.askId)
    .maybeSingle()

  if (askErr || !ask) return { ok: false, error: 'not_found' }
  if (ask.helper_id !== helperId) return { ok: false, error: 'not_helper' }

  // Thread inserts use the admin client because ask_threads has no INSERT
  // policy for the authenticated role (see 0003_rls.sql comment:
  // "Inserts via service_role only — server-side after request acceptance").
  // Without this, the insert silently fails under RLS and we end up with an
  // accepted ask with no thread backing it.
  const admin = createAdminClient()

  // Idempotent recovery: if already accepted, return existing thread (or
  // create one if it's missing — covers any historical broken state).
  if (ask.status === 'accepted') {
    const { data: existing } = await supabase
      .from('ask_threads')
      .select('id')
      .eq('ask_id', ask.id)
      .maybeSingle()
    if (existing) return { ok: true, threadId: existing.id }
    const recovered = await createThread(admin, ask)
    if (!recovered.ok) return recovered
    // Send email asynchronously in the background so it doesn't block the request.
    sendAcceptedEmail(supabase, appOrigin, recovered.threadId, ask.helper_id, ask.asker_id).catch(
      (err) => {
        console.error('Error sending accepted email:', err)
      },
    )
    return { ok: true, threadId: recovered.threadId }
  }
  if (ask.status === 'declined') {
    return { ok: true, threadId: null }
  }
  if (ask.status !== 'pending') return { ok: false, error: 'not_pending' }

  const now = new Date().toISOString()

  const { error: updateErr } = await supabase
    .from('asks')
    .update({
      status: input.decision,
      responded_at: now,
      ...(input.decision === 'declined' && input.declineReason
        ? { decline_reason: input.declineReason }
        : {}),
    })
    .eq('id', input.askId)

  if (updateErr) return { ok: false, error: 'db_error', detail: updateErr.message }

  let threadId: string | null = null
  if (input.decision === 'accepted') {
    const result = await createThread(admin, ask)
    if (!result.ok) return result
    threadId = result.threadId
    // Send email asynchronously in the background so it doesn't block the request.
    sendAcceptedEmail(supabase, appOrigin, threadId, ask.helper_id, ask.asker_id).catch((err) => {
      console.error('Error sending accepted email:', err)
    })
  }

  await supabase.from('audit_log').insert({
    actor_id: helperId,
    organization_id: ask.organization_id,
    action: `ask.${input.decision}`,
    target_type: 'ask',
    target_id: ask.id,
  })

  // In-app notification to the asker. On accept, deep-link goes to the
  // thread; on decline it goes back to the ask page (where they see status).
  // Notification type strings remain legacy until the /ask routing rename.
  const { data: helperBase } = await supabase
    .from('base_profiles')
    .select('name')
    .eq('user_id', helperId)
    .maybeSingle()

  await createNotification({
    userId: ask.asker_id,
    type: input.decision === 'accepted' ? 'ask_accepted' : 'ask_declined',
    organizationId: ask.organization_id,
    targetType: input.decision === 'accepted' ? 'ask_thread' : 'ask',
    targetId: input.decision === 'accepted' ? threadId : ask.id,
    payload: {
      actor_id: helperId,
      actor_name: helperBase?.name ?? null,
      ...(input.decision === 'declined' && input.declineReason
        ? { decline_reason: input.declineReason }
        : {}),
    },
  })

  return { ok: true, threadId }
}

async function createThread(
  admin: SupabaseClient<Database>,
  ask: { id: string; helper_id: string; asker_id: string },
): Promise<{ ok: true; threadId: string } | { ok: false; error: 'db_error'; detail?: string }> {
  const { data: thread, error } = await admin
    .from('ask_threads')
    .insert({
      ask_id: ask.id,
      helper_id: ask.helper_id,
      asker_id: ask.asker_id,
    })
    .select('id')
    .single()
  if (error || !thread) {
    return { ok: false, error: 'db_error', detail: error?.message }
  }
  return { ok: true, threadId: thread.id }
}

async function sendAcceptedEmail(
  supabase: SupabaseClient<Database>,
  appOrigin: string,
  threadId: string,
  helperId: string,
  askerId: string,
) {
  try {
    const { data: helperBase } = await supabase
      .from('base_profiles')
      .select('name')
      .eq('user_id', helperId)
      .maybeSingle()

    const { createAdminClient } = await import('@/db/admin')
    const admin = createAdminClient()
    const { data: askerAuth } = await admin.auth.admin.getUserById(askerId)
    if (!askerAuth?.user?.email) return

    await sendAskAcceptedEmail({
      to: askerAuth.user.email,
      helperName: helperBase?.name ?? 'Your helper',
      threadUrl: `${appOrigin}/ask/thread/${threadId}`,
    })
  } catch {
    // Email is best-effort.
  }
}
