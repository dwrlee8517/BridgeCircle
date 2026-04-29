import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/db/admin'
import type { Database } from '@/db/database.types'
import { createNotification } from '@/lib/notifications/createNotification'
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

  // Thread inserts use the admin client because mentorship_threads has no
  // INSERT policy for the authenticated role (see 0003_rls.sql comment:
  // "Inserts via service_role only — server-side after request acceptance").
  // Without this, the insert silently fails under RLS and we end up with an
  // accepted request with no thread backing it.
  const admin = createAdminClient()

  // Idempotent recovery: if already accepted, return existing thread (or
  // create one if it's missing — covers any historical broken state from
  // the bug this commit fixes).
  if (req.status === 'accepted') {
    const { data: existing } = await supabase
      .from('mentorship_threads')
      .select('id')
      .eq('request_id', req.id)
      .maybeSingle()
    if (existing) return { ok: true, threadId: existing.id }
    const recovered = await createThread(admin, req)
    if (!recovered.ok) return recovered
    await sendAcceptedEmail(supabase, appOrigin, recovered.threadId, req.mentor_id, req.mentee_id)
    return { ok: true, threadId: recovered.threadId }
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
    const result = await createThread(admin, req)
    if (!result.ok) return result
    threadId = result.threadId
    await sendAcceptedEmail(supabase, appOrigin, threadId, req.mentor_id, req.mentee_id)
  }

  await supabase.from('audit_log').insert({
    actor_id: mentorId,
    organization_id: req.organization_id,
    action: `mentorship_request.${input.decision}`,
    target_type: 'mentorship_request',
    target_id: req.id,
  })

  // In-app notification to the mentee. On accept, deep-link goes to the
  // thread; on decline it goes back to the request page (where they can see
  // the status).
  const { data: mentorBase } = await supabase
    .from('base_profiles')
    .select('name')
    .eq('user_id', mentorId)
    .maybeSingle()

  await createNotification({
    userId: req.mentee_id,
    type:
      input.decision === 'accepted' ? 'mentorship_request_accepted' : 'mentorship_request_declined',
    organizationId: req.organization_id,
    targetType: input.decision === 'accepted' ? 'mentorship_thread' : 'mentorship_request',
    targetId: input.decision === 'accepted' ? threadId : req.id,
    payload: { actor_id: mentorId, actor_name: mentorBase?.name ?? null },
  })

  return { ok: true, threadId }
}

async function createThread(
  admin: SupabaseClient<Database>,
  req: { id: string; mentor_id: string; mentee_id: string },
): Promise<{ ok: true; threadId: string } | { ok: false; error: 'db_error'; detail?: string }> {
  const { data: thread, error } = await admin
    .from('mentorship_threads')
    .insert({
      request_id: req.id,
      mentor_id: req.mentor_id,
      mentee_id: req.mentee_id,
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
