import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { createNotification } from '@/lib/notifications/createNotification'
import { sendAskRequestEmail } from '@/notify/resend'
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
 *   - the helper is open to helping and not paused
 *   - the helper's max_pending_requests cap has room — the invisible abuse
 *     valve (ADR 0011: never surfaced in the UI, still enforced here)
 *   - the asker doesn't already have an outstanding pending ask to the
 *     same helper
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
    .select('open_to_advice, open_to_mentorship, paused_at, max_pending_requests')
    .eq('organization_membership_id', helperMembership.id)
    .maybeSingle()

  // One availability state (ADR 0011 Phase 2). Saves now write both legacy
  // columns together; until Phase 6 collapses them, either flag counts as
  // open so members with divergent legacy rows stay reachable (matches
  // isOpenToHelp in lib/utils). No preference row means the helper hasn't
  // visited settings yet — default open.
  const openToHelp = (pref?.open_to_advice ?? true) || (pref?.open_to_mentorship ?? false)
  if (!openToHelp) return { ok: false, error: 'helper_closed' }
  if (pref?.paused_at) return { ok: false, error: 'helper_paused' }

  // The invisible abuse valve: cap pending asks per helper. Never surfaced
  // in the UI (decided 2026-07-02); max_active_mentees is no longer checked.
  // Counted with the admin client: asks RLS only shows the caller their own
  // rows, so the asker's client can never see other askers' pending asks and
  // the cap would never trip against the pile-on it exists to stop.
  if (pref) {
    const { createAdminClient } = await import('@/db/admin')
    const { count: pendingCount } = await createAdminClient()
      .from('asks')
      .select('id', { count: 'exact', head: true })
      .eq('helper_id', input.helperId)
      .eq('status', 'pending')

    if (pendingCount !== null && pendingCount >= pref.max_pending_requests) {
      return { ok: false, error: 'helper_full' }
    }
  }

  // Reject duplicate pending from same asker → helper.
  const { data: existing } = await supabase
    .from('asks')
    .select('id')
    .eq('helper_id', input.helperId)
    .eq('asker_id', askerId)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle()
  if (existing) return { ok: false, error: 'duplicate_pending' }

  const { data: created, error: insertErr } = await supabase
    .from('asks')
    .insert({
      organization_id: helperMembership.organization_id,
      helper_id: input.helperId,
      asker_id: askerId,
      // Interim constant: the enum column is NOT NULL (default 'mentorship')
      // until Phase 6 drops it. 'advice' keeps legacy per-type reads honest —
      // new asks are the uncapped kind.
      ask_type: 'advice',
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

  await createNotification({
    userId: input.helperId,
    type: 'ask_received',
    organizationId: helperMembership.organization_id,
    targetType: 'ask',
    targetId: created.id,
    payload: {
      actor_id: askerId,
      actor_name: askerBase?.name ?? null,
    },
  })

  // Send email asynchronously in the background so it doesn't block the request.
  sendAskEmail(supabase, appOrigin, created.id, input.helperId, askerId).catch((err) => {
    console.error('Error sending ask email:', err)
  })

  return { ok: true, askId: created.id }
}

async function sendAskEmail(
  supabase: SupabaseClient<Database>,
  appOrigin: string,
  askId: string,
  helperId: string,
  askerId: string,
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

    await sendAskRequestEmail({
      to: authUser.user.email,
      askerName: askerBase?.name ?? 'A fellow alum',
      reviewUrl: `${appOrigin}/ask/${askId}`,
    })
  } catch {
    // Email failures shouldn't fail the ask. The row is already written;
    // the audit log captures it. The helper sees the ask in their inbox.
  }
}
