import 'server-only'
import { createAdminClient } from '@/db/admin'
import { sendMembershipApprovedEmail, sendMembershipDeactivatedEmail } from '@/notify/resend'

export type SetActiveInput = {
  membershipId: string
  adminUserId: string
  action: 'deactivate' | 'reactivate'
  /** Reason captured from the admin dialog. Required for deactivate, ignored for reactivate. */
  reason?: string | null
}

export type SetActiveResult =
  | { ok: true }
  | { ok: false; error: 'membership_not_found' | 'wrong_state' | 'unknown' }

/**
 * Flip an existing member between active and revoked / self_deactivated.
 *
 * Deactivate: must be currently 'active'  → 'revoked' (admin removed access)
 *             admin captures a reason; user receives an email with that reason.
 * Reactivate: must be 'revoked' OR 'self_deactivated' → 'active'.
 *             Admin can override a self-pause (rare but allowed). User receives
 *             a welcome-back email.
 *
 * For pending/rejected rows use decideMembership. For full account deletion
 * (with grace period) use scheduleAccountDeletion.
 *
 * Service-role only.
 */
export async function setMemberActive(input: SetActiveInput): Promise<SetActiveResult> {
  const admin = createAdminClient()

  const { data: membership } = await admin
    .from('organization_memberships')
    .select('id, user_id, organization_id, status')
    .eq('id', input.membershipId)
    .maybeSingle()

  if (!membership) return { ok: false, error: 'membership_not_found' }

  const ALLOWED_FROM_FOR_REACTIVATE = ['revoked', 'self_deactivated'] as const
  const okPrecondition =
    input.action === 'deactivate'
      ? membership.status === 'active'
      : (ALLOWED_FROM_FOR_REACTIVATE as readonly string[]).includes(membership.status)

  if (!okPrecondition) return { ok: false, error: 'wrong_state' }

  const targetStatus = input.action === 'deactivate' ? 'revoked' : 'active'

  const { error: updErr } = await admin
    .from('organization_memberships')
    .update({ status: targetStatus })
    .eq('id', input.membershipId)

  if (updErr) return { ok: false, error: 'unknown' }

  await admin.from('audit_log').insert({
    actor_id: input.adminUserId,
    organization_id: membership.organization_id,
    action: input.action === 'deactivate' ? 'member.deactivated' : 'member.reactivated',
    target_type: 'membership',
    target_id: input.membershipId,
    payload: input.action === 'deactivate' && input.reason ? { reason: input.reason } : null,
  })

  // Notify the affected member. Best-effort: a missing email or send failure
  // doesn't roll back the status change.
  const [{ data: userRes }, { data: base }, { data: org }] = await Promise.all([
    admin.auth.admin.getUserById(membership.user_id),
    admin.from('base_profiles').select('name').eq('user_id', membership.user_id).maybeSingle(),
    admin.from('organizations').select('name').eq('id', membership.organization_id).maybeSingle(),
  ])
  const email = userRes?.user?.email ?? null
  const name = base?.name ?? null
  const orgName = org?.name ?? 'BridgeCircle'

  if (email) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    if (input.action === 'deactivate') {
      await sendMembershipDeactivatedEmail({
        to: email,
        recipientName: name,
        orgName,
        reason: input.reason ?? null,
      })
    } else {
      await sendMembershipApprovedEmail({
        to: email,
        recipientName: name,
        orgName,
        signInUrl: `${baseUrl}/sign-in`,
      })
    }
  }

  return { ok: true }
}
