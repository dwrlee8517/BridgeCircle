import 'server-only'
import { createAdminClient } from '@/db/admin'

export type AcceptInput = {
  inviteId: string
  userId: string
}

export type AcceptResult =
  | { ok: true; membershipId: string }
  | { ok: false; error: 'invite_not_pending' | 'membership_exists' | 'unknown' }

/**
 * Accepts an invite on behalf of an authenticated user.
 * - Marks invite as accepted
 * - Creates organization_membership(status='active') if missing
 * - Creates base_profile (with name pre-filled from invite) if missing
 * - Creates organization_profile (with grad_year pre-filled) if missing
 * - Writes audit_log row
 *
 * Uses the admin client because we're writing across several RLS-protected
 * tables on behalf of a freshly created user whose RLS context isn't yet
 * shaped right (no membership ⇒ can't see anything via member policies).
 *
 * Idempotent on accept: if the invite is already accepted by this user,
 * returns { ok: true } with the existing membership. Different user ⇒ error.
 */
export async function acceptInvite({ inviteId, userId }: AcceptInput): Promise<AcceptResult> {
  const admin = createAdminClient()

  const { data: invite, error: inviteErr } = await admin
    .from('invites')
    .select('id, organization_id, email, full_name, graduation_year, status, accepted_by')
    .eq('id', inviteId)
    .maybeSingle()

  if (inviteErr || !invite) return { ok: false, error: 'invite_not_pending' }

  if (invite.status === 'accepted') {
    if (invite.accepted_by !== userId) {
      return { ok: false, error: 'invite_not_pending' }
    }
  } else if (invite.status !== 'pending') {
    return { ok: false, error: 'invite_not_pending' }
  }

  const { data: existingMembership } = await admin
    .from('organization_memberships')
    .select('id, status')
    .eq('user_id', userId)
    .eq('organization_id', invite.organization_id)
    .maybeSingle()

  let membershipId: string
  if (existingMembership) {
    membershipId = existingMembership.id
  } else {
    const { data: newMembership, error: mbErr } = await admin
      .from('organization_memberships')
      .insert({
        user_id: userId,
        organization_id: invite.organization_id,
        status: 'active',
        joined_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    if (mbErr || !newMembership) return { ok: false, error: 'unknown' }
    membershipId = newMembership.id
  }

  const { data: existingBase } = await admin
    .from('base_profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!existingBase) {
    const { error: baseErr } = await admin.from('base_profiles').insert({
      user_id: userId,
      name: invite.full_name,
    })
    if (baseErr) return { ok: false, error: 'unknown' }
  }

  const { data: existingOrgProfile } = await admin
    .from('organization_profiles')
    .select('organization_membership_id')
    .eq('organization_membership_id', membershipId)
    .maybeSingle()

  if (!existingOrgProfile) {
    const { error: orgProfileErr } = await admin.from('organization_profiles').insert({
      organization_membership_id: membershipId,
      graduation_year: invite.graduation_year,
    })
    if (orgProfileErr) return { ok: false, error: 'unknown' }
  }

  if (invite.status === 'pending') {
    await admin
      .from('invites')
      .update({
        status: 'accepted',
        accepted_by: userId,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', inviteId)

    await admin.from('audit_log').insert({
      actor_id: userId,
      organization_id: invite.organization_id,
      action: 'member.joined',
      target_type: 'invite',
      target_id: inviteId,
    })
  }

  return { ok: true, membershipId }
}
