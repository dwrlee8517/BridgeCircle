import 'server-only'
import { createAdminClient } from '@/db/admin'
import { markProfileEmbeddingDirty } from '@/lib/search/matching/indexStatus'
import { sendMembershipApprovedEmail, sendMembershipRejectedEmail } from '@/notify/resend'

export type Decision = 'approve' | 'reject'

export type DecideInput = {
  membershipId: string
  adminUserId: string
  decision: Decision
}

export type DecideResult =
  | { ok: true; userEmail: string | null; userName: string | null }
  | { ok: false; error: 'membership_not_found' | 'not_pending' | 'unknown' }

/**
 * Admin approves or rejects a pending org membership.
 *
 * Approve: status pending → active, joined_at = now, approved_by + approved_at,
 *          send approval email so the user knows they can sign in.
 * Reject:  status pending → rejected, approved_by + approved_at (decision time),
 *          send rejection email.
 *
 * Uses the admin client because membership writes are service-role only (see
 * 0003_rls.sql). Caller must verify the actor is admin via requireAdmin().
 *
 * Idempotency: if the row is already in the target status, returns ok with no
 * email re-send. If it's in some other terminal status (active when caller asked
 * to reject, etc.), returns 'not_pending'.
 */
export async function decideMembership(input: DecideInput): Promise<DecideResult> {
  const admin = createAdminClient()

  const { data: membership } = await admin
    .from('organization_memberships')
    .select('id, user_id, organization_id, status')
    .eq('id', input.membershipId)
    .maybeSingle()

  if (!membership) return { ok: false, error: 'membership_not_found' }

  const targetStatus = input.decision === 'approve' ? 'active' : 'rejected'

  if (membership.status === targetStatus) {
    // Already in target state; treat as no-op success without re-emailing.
    return { ok: true, userEmail: null, userName: null }
  }
  if (membership.status !== 'pending') {
    return { ok: false, error: 'not_pending' }
  }

  const now = new Date().toISOString()
  const { error: updErr } = await admin
    .from('organization_memberships')
    .update({
      status: targetStatus,
      approved_by: input.adminUserId,
      approved_at: now,
      // Approve sets joined_at (the moment access began). Reject leaves it null.
      ...(input.decision === 'approve' ? { joined_at: now } : {}),
    })
    .eq('id', input.membershipId)

  if (updErr) return { ok: false, error: 'unknown' }

  await admin.from('audit_log').insert({
    actor_id: input.adminUserId,
    organization_id: membership.organization_id,
    action: input.decision === 'approve' ? 'member.approved' : 'member.rejected',
    target_type: 'membership',
    target_id: input.membershipId,
  })

  if (input.decision === 'approve') {
    await markProfileEmbeddingDirty({
      userId: membership.user_id,
      organizationId: membership.organization_id,
      organizationMembershipId: membership.id,
      reason: 'membership_approved',
    })
  }

  // Look up the user's email + name to address the notification. Email lives
  // on auth.users; name on base_profiles. Both lookups are best-effort — if
  // either fails, we still consider the decision successful and skip the email.
  const [{ data: userRes }, { data: base }, { data: org }] = await Promise.all([
    admin.auth.admin.getUserById(membership.user_id),
    admin.from('base_profiles').select('name').eq('user_id', membership.user_id).maybeSingle(),
    admin.from('organizations').select('name').eq('id', membership.organization_id).maybeSingle(),
  ])

  const email = userRes?.user?.email ?? null
  const name = base?.name ?? null
  const orgName = org?.name ?? 'BridgeCircle'

  if (email) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'
    if (input.decision === 'approve') {
      await sendMembershipApprovedEmail({
        to: email,
        recipientName: name,
        orgName,
        signInUrl: `${baseUrl}/sign-in`,
      })
    } else {
      await sendMembershipRejectedEmail({
        to: email,
        recipientName: name,
        orgName,
      })
    }
  }

  return { ok: true, userEmail: email, userName: name }
}
