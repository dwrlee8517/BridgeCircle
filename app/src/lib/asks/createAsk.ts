import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { createNotification } from '@/lib/notifications/createNotification'
import { sendMentorshipRequestEmail } from '@/notify/resend'
import type { AskInput } from './schemas'

export type CreateAskResult =
  | { ok: true; askId: string }
  | {
      ok: false
      error:
        | 'self_request'
        | 'no_shared_org'
        | 'helper_closed'
        | 'helper_paused'
        | 'helper_full'
        | 'helper_at_capacity'
        | 'duplicate_pending'
        | 'db_error'
      detail?: string
    }

/**
 * Create an ask from the authenticated user (asker) to the given helper.
 *
 * Validates:
 *   - the asker isn't asking themselves
 *   - the helper is in the same active org
 *   - the helper is open to the requested ask type and not paused
 *   - mentorship asks respect the helper's max_pending_requests / max_active_mentees
 *     caps (applied to ongoing mentorship asks only — advice has no caps)
 *   - the asker doesn't already have an outstanding pending ask of the same
 *     type to the same helper
 *
 * On success, sends the helper an email notification (best-effort).
 */
export async function createAsk(
  supabase: SupabaseClient<Database>,
  appOrigin: string,
  askerId: string,
  input: AskInput,
): Promise<CreateAskResult> {
  if (askerId === input.helperId) {
    return { ok: false, error: 'self_request' }
  }

  // Find a shared active org membership between asker and helper.
  const { data: askerMembership } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', askerId)
    .eq('status', 'active')
  const askerOrgIds = (askerMembership ?? []).map((m) => m.organization_id)

  if (askerOrgIds.length === 0) {
    return { ok: false, error: 'no_shared_org' }
  }

  const { data: helperMembership } = await supabase
    .from('organization_memberships')
    .select('id, organization_id')
    .eq('user_id', input.helperId)
    .eq('status', 'active')
    .in('organization_id', askerOrgIds)
    .limit(1)
    .maybeSingle()

  if (!helperMembership) {
    return { ok: false, error: 'no_shared_org' }
  }

  const { data: pref } = await supabase
    .from('helper_preferences')
    .select(
      'open_to_advice, open_to_mentorship, paused_at, max_pending_requests, max_active_mentees',
    )
    .eq('organization_membership_id', helperMembership.id)
    .maybeSingle()

  // Gate per ask type. Advice and mentorship are independent toggles; absence
  // of a preference row means the helper hasn't visited settings yet, so we
  // fall back to the schema defaults (advice on, mentorship off).
  const openToAdvice = pref?.open_to_advice ?? true
  const openToMentorship = pref?.open_to_mentorship ?? false
  const isOpenForType = input.askType === 'advice' ? openToAdvice : openToMentorship
  if (!isOpenForType) return { ok: false, error: 'helper_closed' }
  if (pref?.paused_at) return { ok: false, error: 'helper_paused' }

  // Capacity caps apply to mentorship asks only — advice is intentionally
  // uncapped to keep volunteer supply broad. Existing max_pending_requests
  // / max_active_mentees columns now scope to mentorship-type rows.
  if (input.askType === 'mentorship' && pref) {
    const [{ count: pendingCount }, { count: activeCount }] = await Promise.all([
      supabase
        .from('asks')
        .select('id', { count: 'exact', head: true })
        .eq('helper_id', input.helperId)
        .eq('ask_type', 'mentorship')
        .eq('status', 'pending'),
      supabase
        .from('ask_threads')
        .select('id, asks!inner(ask_type)', { count: 'exact', head: true })
        .eq('helper_id', input.helperId)
        .eq('status', 'active')
        .eq('asks.ask_type', 'mentorship'),
    ])

    if (pendingCount !== null && pendingCount >= pref.max_pending_requests) {
      return { ok: false, error: 'helper_full' }
    }
    if (activeCount !== null && activeCount >= pref.max_active_mentees) {
      return { ok: false, error: 'helper_at_capacity' }
    }
  }

  // Reject duplicate pending of the same type from same asker → helper.
  // Cross-type is allowed (e.g. an advice ask in flight doesn't block
  // sending a mentorship ask).
  const { data: existing } = await supabase
    .from('asks')
    .select('id')
    .eq('helper_id', input.helperId)
    .eq('asker_id', askerId)
    .eq('ask_type', input.askType)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle()
  if (existing) return { ok: false, error: 'duplicate_pending' }

  // Pace and screening answer are mentorship-flow concepts; drop them for
  // advice even if a stray form field sent them.
  const isMentorship = input.askType === 'mentorship'
  const { data: created, error: insertErr } = await supabase
    .from('asks')
    .insert({
      organization_id: helperMembership.organization_id,
      helper_id: input.helperId,
      asker_id: askerId,
      ask_type: input.askType,
      reason: input.reason,
      help_needed: input.helpNeeded,
      background: input.background || null,
      commitment: isMentorship ? (input.commitment ?? null) : null,
      screening_answer: isMentorship ? (input.screeningAnswer ?? null) : null,
    })
    .select('id')
    .single()

  if (insertErr || !created) {
    return { ok: false, error: 'db_error', detail: insertErr?.message }
  }

  await supabase.from('audit_log').insert({
    actor_id: askerId,
    organization_id: helperMembership.organization_id,
    action: 'ask.created',
    target_type: 'ask',
    target_id: created.id,
  })

  // Best-effort email — fetch helper + asker names then send.
  const { data: askerBase } = await supabase
    .from('base_profiles')
    .select('name')
    .eq('user_id', askerId)
    .maybeSingle()

  // ask_type rides along on the payload so the notification label can be
  // type-specific without a schema change ("asked you for advice" vs.
  // "requested mentorship").
  await createNotification({
    userId: input.helperId,
    type: 'ask_received',
    organizationId: helperMembership.organization_id,
    targetType: 'ask',
    targetId: created.id,
    payload: {
      actor_id: askerId,
      actor_name: askerBase?.name ?? null,
      ask_type: input.askType,
    },
  })

  // Send email asynchronously in the background so it doesn't block the request.
  sendAskEmail(supabase, appOrigin, created.id, input.helperId, askerId, input.askType).catch(
    (err) => {
      console.error('Error sending ask email:', err)
    },
  )

  return { ok: true, askId: created.id }
}

async function sendAskEmail(
  supabase: SupabaseClient<Database>,
  appOrigin: string,
  askId: string,
  helperId: string,
  askerId: string,
  askType: 'advice' | 'mentorship',
) {
  try {
    const [{ data: helperAuth }, { data: askerBase }] = await Promise.all([
      supabase.from('users').select('id').eq('id', helperId).maybeSingle(),
      supabase.from('base_profiles').select('name').eq('user_id', askerId).maybeSingle(),
    ])

    if (!helperAuth) return

    const { createAdminClient } = await import('@/db/admin')
    const admin = createAdminClient()
    const { data: authUser } = await admin.auth.admin.getUserById(helperId)
    if (!authUser?.user?.email) return

    await sendMentorshipRequestEmail({
      to: authUser.user.email,
      menteeName: askerBase?.name ?? 'A fellow alumnus',
      reviewUrl: `${appOrigin}/ask/${askId}`,
      askType,
    })
  } catch {
    // Email failures shouldn't fail the ask. The row is already written;
    // the audit log captures it. The helper sees the ask in their inbox.
  }
}
