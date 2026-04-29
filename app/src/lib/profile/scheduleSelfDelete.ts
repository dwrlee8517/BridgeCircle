import 'server-only'
import { createAdminClient } from '@/db/admin'

export const SELF_DELETE_GRACE_HOURS = 24 * 30 // 30 days

export const SELF_DELETE_REASON_CATEGORIES = [
  'no_longer_relevant',
  'privacy_concerns',
  'too_many_emails',
  'didnt_find_value',
  'other',
] as const
export type SelfDeleteReasonCategory = (typeof SELF_DELETE_REASON_CATEGORIES)[number]

export type ScheduleSelfDeleteInput = {
  userId: string
  reasonCategory: SelfDeleteReasonCategory
  customReason?: string | null
}

export type ScheduleSelfDeleteResult =
  | { ok: true; scheduledFor: string }
  | { ok: false; error: 'user_not_found' | 'already_scheduled' | 'unknown' }

/**
 * User schedules their own account for deletion. Phase 1 of the self-delete
 * grace flow:
 *   - all active/self_deactivated memberships → 'revoked' (immediate hide)
 *   - users.delete_scheduled_for = now() + 30d
 *   - users.delete_reason = "<category>: <custom>" (or just category if no
 *     custom text). Stored together so the cancel-delete page and audit can
 *     surface it without joining anywhere.
 *   - users.delete_initiated_by_admin = false
 *   - auth user is NOT banned (the user can sign back in to /cancel-delete
 *     during grace and reverse the decision)
 *
 * No email fires (per product spec — self-delete is silent to the user; they
 * already know they did it).
 *
 * After grace, finalizeAccount tombstones. The sweep script handles bulk
 * processing.
 */
export async function scheduleSelfDelete(
  input: ScheduleSelfDeleteInput,
): Promise<ScheduleSelfDeleteResult> {
  const admin = createAdminClient()

  const { data: userRow } = await admin
    .from('users')
    .select('id, deleted_at, delete_scheduled_for')
    .eq('id', input.userId)
    .maybeSingle()

  if (!userRow) return { ok: false, error: 'user_not_found' }
  if (userRow.deleted_at) return { ok: false, error: 'user_not_found' }
  if (userRow.delete_scheduled_for) return { ok: false, error: 'already_scheduled' }

  const scheduledFor = new Date(Date.now() + SELF_DELETE_GRACE_HOURS * 3600 * 1000).toISOString()

  const customTrim = input.customReason?.trim() ?? ''
  const composedReason = customTrim
    ? `${input.reasonCategory}: ${customTrim}`
    : input.reasonCategory

  const { error: usersErr } = await admin
    .from('users')
    .update({
      delete_scheduled_for: scheduledFor,
      delete_reason: composedReason,
      delete_initiated_by_admin: false,
    })
    .eq('id', input.userId)
  if (usersErr) return { ok: false, error: 'unknown' }

  const { data: memberships } = await admin
    .from('organization_memberships')
    .select('id, organization_id, status')
    .eq('user_id', input.userId)
    .in('status', ['active', 'self_deactivated', 'pending'])

  if (memberships && memberships.length > 0) {
    await admin
      .from('organization_memberships')
      .update({ status: 'revoked' })
      .in(
        'id',
        memberships.map((m) => m.id),
      )
  }

  // No auth ban — self-initiated path keeps sign-in open so the cancel-delete
  // flow works. Anyone signing in during grace is redirected to /cancel-delete
  // by the auth callback.

  const orgIds = Array.from(new Set((memberships ?? []).map((m) => m.organization_id)))
  for (const orgId of orgIds) {
    await admin.from('audit_log').insert({
      actor_id: input.userId,
      organization_id: orgId,
      action: 'account.delete_scheduled_self',
      target_type: 'user',
      target_id: input.userId,
      payload: {
        reason_category: input.reasonCategory,
        custom_reason: customTrim || null,
        scheduled_for: scheduledFor,
      },
    })
  }

  return { ok: true, scheduledFor }
}
