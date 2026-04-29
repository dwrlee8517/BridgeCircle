import 'server-only'
import { createAdminClient } from '@/db/admin'

export type CancelDeletionInput = {
  userId: string
  /** The actor canceling. If equal to userId, this is a self-cancel; otherwise an admin override. */
  actorUserId: string
  /** True if the actor has admin role. Admins can cancel any pending deletion; users can only cancel self-initiated. */
  actorIsAdmin: boolean
}

export type CancelDeletionResult =
  | { ok: true }
  | {
      ok: false
      error: 'user_not_found' | 'no_active_schedule' | 'forbidden_admin_initiated' | 'unknown'
    }

/**
 * Cancels a pending account deletion during the grace window. Restores
 * memberships to 'active', clears the schedule columns, and unbans the
 * auth user.
 *
 * Authorization rules:
 *   - Admin-initiated deletion: only an admin actor can cancel.
 *   - Self-initiated deletion:  the user themselves OR any admin can cancel.
 *
 * Once finalized (tombstone fired, users.deleted_at set), this function won't
 * help — recovery requires manual DB intervention from a backup.
 */
export async function cancelScheduledDeletion(
  input: CancelDeletionInput,
): Promise<CancelDeletionResult> {
  const admin = createAdminClient()

  const { data: userRow } = await admin
    .from('users')
    .select('id, deleted_at, delete_scheduled_for, delete_initiated_by_admin')
    .eq('id', input.userId)
    .maybeSingle()

  if (!userRow) return { ok: false, error: 'user_not_found' }
  if (userRow.deleted_at) return { ok: false, error: 'no_active_schedule' }
  if (!userRow.delete_scheduled_for) return { ok: false, error: 'no_active_schedule' }

  if (userRow.delete_initiated_by_admin && !input.actorIsAdmin) {
    // A non-admin user can't override an admin's deletion of their account.
    return { ok: false, error: 'forbidden_admin_initiated' }
  }

  // 1. Clear the schedule columns.
  const { error: clearErr } = await admin
    .from('users')
    .update({
      delete_scheduled_for: null,
      delete_reason: null,
      delete_initiated_by_admin: false,
    })
    .eq('id', input.userId)
  if (clearErr) return { ok: false, error: 'unknown' }

  // 2. Restore memberships. We flip every revoked row this user has back to
  // 'active'. Pre-existing legitimately-revoked rows from before the deletion
  // request would also flip — that's an edge case we accept; the alternative
  // (snapshotting prior status) adds complexity we don't need yet.
  const { data: memberships } = await admin
    .from('organization_memberships')
    .select('id, organization_id, status')
    .eq('user_id', input.userId)
    .eq('status', 'revoked')

  if (memberships && memberships.length > 0) {
    await admin
      .from('organization_memberships')
      .update({ status: 'active' })
      .in(
        'id',
        memberships.map((m) => m.id),
      )
  }

  // 3. Unban the auth user. 'none' clears any active ban.
  await admin.auth.admin.updateUserById(input.userId, { ban_duration: 'none' })

  // 4. Audit log per affected org.
  const orgIds = Array.from(new Set((memberships ?? []).map((m) => m.organization_id)))
  for (const orgId of orgIds) {
    await admin.from('audit_log').insert({
      actor_id: input.actorUserId,
      organization_id: orgId,
      action: 'account.delete_canceled',
      target_type: 'user',
      target_id: input.userId,
      payload: { canceled_by_admin: input.actorIsAdmin },
    })
  }

  return { ok: true }
}
