import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { sendMentorshipAcceptedEmail } from '@/notify/resend'

export type RespondInput = {
  requestId: string
  decision: 'accepted' | 'declined'
}

export type RespondResult =
  | { ok: true; threadId: string | null }
  | {
      ok: false
      error: 'not_found' | 'not_pending' | 'not_mentor' | 'db_error'
      detail?: string
    }

/**
 * Mentor responds to a pending mentorship request. On accept, creates a
 * mentorship_thread (if not already present) and emails the mentee.
 *
 * Idempotent: if the request is already accepted/declined, returns ok with
 * the existing thread id (or null for declined).
 */
export async function respondToRequest(
  supabase: SupabaseClient<Database>,
  appOrigin: string,
  mentorId: string,
  input: RespondInput,
): Promise<RespondResult> {
  const { data: req, error: reqErr } = await supabase
    .from('mentorship_requests')
    .select('id, mentor_id, mentee_id, organization_id, status')
    .eq('id', input.requestId)
    .maybeSingle()

  if (reqErr || !req) return { ok: false, error: 'not_found' }
  if (req.mentor_id !== mentorId) return { ok: false, error: 'not_mentor' }

  // Idempotent: if already accepted, return existing thread; if declined, return null.
  if (req.status === 'accepted') {
    const { data: existing } = await supabase
      .from('mentorship_threads')
      .select('id')
      .eq('request_id', req.id)
      .maybeSingle()
    return { ok: true, threadId: existing?.id ?? null }
  }
  if (req.status === 'declined') {
    return { ok: true, threadId: null }
  }
  if (req.status !== 'pending') return { ok: false, error: 'not_pending' }

  const now = new Date().toISOString()

  const { error: updateErr } = await supabase
    .from('mentorship_requests')
    .update({ status: input.decision, responded_at: now })
    .eq('id', input.requestId)

  if (updateErr) return { ok: false, error: 'db_error', detail: updateErr.message }

  let threadId: string | null = null
  if (input.decision === 'accepted') {
    const { data: thread, error: threadErr } = await supabase
      .from('mentorship_threads')
      .insert({
        request_id: req.id,
        mentor_id: req.mentor_id,
        mentee_id: req.mentee_id,
      })
      .select('id')
      .single()
    if (threadErr || !thread) {
      return { ok: false, error: 'db_error', detail: threadErr?.message }
    }
    threadId = thread.id

    await sendAcceptedEmail(supabase, appOrigin, threadId, req.mentor_id, req.mentee_id)
  }

  await supabase.from('audit_log').insert({
    actor_id: mentorId,
    organization_id: req.organization_id,
    action: `mentorship_request.${input.decision}`,
    target_type: 'mentorship_request',
    target_id: req.id,
  })

  return { ok: true, threadId }
}

async function sendAcceptedEmail(
  supabase: SupabaseClient<Database>,
  appOrigin: string,
  threadId: string,
  mentorId: string,
  menteeId: string,
) {
  try {
    const { data: mentorBase } = await supabase
      .from('base_profiles')
      .select('name')
      .eq('user_id', mentorId)
      .maybeSingle()

    const { createAdminClient } = await import('@/db/admin')
    const admin = createAdminClient()
    const { data: menteeAuth } = await admin.auth.admin.getUserById(menteeId)
    if (!menteeAuth?.user?.email) return

    await sendMentorshipAcceptedEmail({
      to: menteeAuth.user.email,
      mentorName: mentorBase?.name ?? 'Your mentor',
      threadUrl: `${appOrigin}/mentorship/thread/${threadId}`,
    })
  } catch {
    // Email is best-effort.
  }
}
