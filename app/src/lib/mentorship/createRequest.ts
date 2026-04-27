import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { sendMentorshipRequestEmail } from '@/notify/resend'
import type { MentorshipRequestInput } from './schemas'

export type CreateRequestResult =
  | { ok: true; requestId: string }
  | {
      ok: false
      error:
        | 'self_request'
        | 'no_shared_org'
        | 'mentor_closed'
        | 'mentor_paused'
        | 'mentor_full'
        | 'mentor_at_capacity'
        | 'duplicate_pending'
        | 'db_error'
      detail?: string
    }

/**
 * Create a mentorship_request from the authenticated user (mentee) to the
 * given mentor. Validates:
 *   - they're not requesting themselves
 *   - the mentor is in the same active org
 *   - the mentor is open + not paused
 *   - the mentor isn't at max_pending_requests capacity
 *   - the mentee doesn't already have an outstanding pending request to this mentor
 *
 * On success, sends the mentor an email notification (best-effort).
 */
export async function createMentorshipRequest(
  supabase: SupabaseClient<Database>,
  appOrigin: string,
  menteeId: string,
  input: MentorshipRequestInput,
): Promise<CreateRequestResult> {
  if (menteeId === input.mentorId) {
    return { ok: false, error: 'self_request' }
  }

  // Find a shared active org membership between mentee and mentor.
  const { data: menteeMembership } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', menteeId)
    .eq('status', 'active')
  const menteeOrgIds = (menteeMembership ?? []).map((m) => m.organization_id)

  if (menteeOrgIds.length === 0) {
    return { ok: false, error: 'no_shared_org' }
  }

  const { data: mentorMembership } = await supabase
    .from('organization_memberships')
    .select('id, organization_id')
    .eq('user_id', input.mentorId)
    .eq('status', 'active')
    .in('organization_id', menteeOrgIds)
    .limit(1)
    .maybeSingle()

  if (!mentorMembership) {
    return { ok: false, error: 'no_shared_org' }
  }

  const { data: pref } = await supabase
    .from('mentorship_preferences')
    .select('is_open, paused_at, max_pending_requests, max_active_mentees')
    .eq('organization_membership_id', mentorMembership.id)
    .maybeSingle()

  if (!pref?.is_open) return { ok: false, error: 'mentor_closed' }
  if (pref.paused_at) return { ok: false, error: 'mentor_paused' }

  const [{ count: pendingCount }, { count: activeCount }] = await Promise.all([
    supabase
      .from('mentorship_requests')
      .select('id', { count: 'exact', head: true })
      .eq('mentor_id', input.mentorId)
      .eq('status', 'pending'),
    supabase
      .from('mentorship_threads')
      .select('id', { count: 'exact', head: true })
      .eq('mentor_id', input.mentorId)
      .eq('status', 'active'),
  ])

  if (pendingCount !== null && pendingCount >= pref.max_pending_requests) {
    return { ok: false, error: 'mentor_full' }
  }
  if (activeCount !== null && activeCount >= pref.max_active_mentees) {
    return { ok: false, error: 'mentor_at_capacity' }
  }

  // Reject duplicate pending from same mentee → mentor.
  const { data: existing } = await supabase
    .from('mentorship_requests')
    .select('id')
    .eq('mentor_id', input.mentorId)
    .eq('mentee_id', menteeId)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle()
  if (existing) return { ok: false, error: 'duplicate_pending' }

  const { data: created, error: insertErr } = await supabase
    .from('mentorship_requests')
    .insert({
      organization_id: mentorMembership.organization_id,
      mentor_id: input.mentorId,
      mentee_id: menteeId,
      reason: input.reason,
      help_needed: input.helpNeeded,
      background: input.background || null,
    })
    .select('id')
    .single()

  if (insertErr || !created) {
    return { ok: false, error: 'db_error', detail: insertErr?.message }
  }

  await supabase.from('audit_log').insert({
    actor_id: menteeId,
    organization_id: mentorMembership.organization_id,
    action: 'mentorship_request.created',
    target_type: 'mentorship_request',
    target_id: created.id,
  })

  // Best-effort email — fetch mentor + mentee names then send.
  await sendRequestEmail(supabase, appOrigin, created.id, input.mentorId, menteeId)

  return { ok: true, requestId: created.id }
}

async function sendRequestEmail(
  supabase: SupabaseClient<Database>,
  appOrigin: string,
  requestId: string,
  mentorId: string,
  menteeId: string,
) {
  try {
    const [{ data: mentorAuth }, { data: menteeBase }] = await Promise.all([
      supabase.from('users').select('id').eq('id', mentorId).maybeSingle(),
      supabase.from('base_profiles').select('name').eq('user_id', menteeId).maybeSingle(),
    ])

    if (!mentorAuth) return

    // Pull email separately via admin since auth.users isn't in public schema for the user's RLS context.
    // Fallback: skip email send if we can't resolve mentor email.
    const { createAdminClient } = await import('@/db/admin')
    const admin = createAdminClient()
    const { data: authUser } = await admin.auth.admin.getUserById(mentorId)
    if (!authUser?.user?.email) return

    await sendMentorshipRequestEmail({
      to: authUser.user.email,
      menteeName: menteeBase?.name ?? 'A fellow alumnus',
      reviewUrl: `${appOrigin}/mentorship/request/${requestId}`,
    })
  } catch {
    // Email failures shouldn't fail the request. The request row is already
    // written; the audit log captures it. The mentor will see the request
    // in their inbox regardless.
  }
}
