import 'server-only'
import { createAdminClient } from '@/db/admin'
import { sendAccountDeleteScheduledEmail } from '@/notify/resend'

export const ADMIN_DELETE_GRACE_HOURS = 24 * 7 // 7 days
const ADMIN_DELETE_BAN_HOURS = 24 * 30 // 30 days — comfortably past grace; finalize extends

export type ScheduleAdminDeleteInput = {
  userId: string
  adminUserId: string
  reason: string
}

export type ScheduleAdminDeleteResult =
  | { ok: true; scheduledFor: string }
  | { ok: false; error: 'user_not_found' | 'already_scheduled' | 'unknown' }

/**
 * Admin schedules a user account for deletion. Phase 1 of the grace flow:
 *   - all memberships → 'revoked' (immediate hide from peer queries)
 *   - users.delete_scheduled_for = now() + 7d
 *   - users.delete_reason captured
 *   - users.delete_initiated_by_admin = true
 *   - auth user banned (admin path: locked out immediately, no recovery via app)
 *   - email sent with the reason in the body
 *
 * Cancellation during grace is via cancelScheduledDeletion (admin only for this
 * path; users can't undo an admin-initiated deletion through the app).
 *
 * Finalization happens via finalizeAccount (manual button on /admin/members or
 * the sweep script after grace expires).
 */
export async function scheduleAccountDeletion(
  input: ScheduleAdminDeleteInput,
): Promise<ScheduleAdminDeleteResult> {
  const admin = createAdminClient()

  const { data: userRow } = await admin
    .from('users')
    .select('id, deleted_at, delete_scheduled_for')
    .eq('id', input.userId)
    .maybeSingle()

  if (!userRow) return { ok: false, error: 'user_not_found' }
  if (userRow.deleted_at) return { ok: false, error: 'user_not_found' } // already tombstoned
  if (userRow.delete_scheduled_for) return { ok: false, error: 'already_scheduled' }

  const scheduledFor = new Date(Date.now() + ADMIN_DELETE_GRACE_HOURS * 3600 * 1000).toISOString()

  // 1. Mark scheduled on the users row.
  const { error: usersErr } = await admin
    .from('users')
    .update({
      delete_scheduled_for: scheduledFor,
      delete_reason: input.reason,
      delete_initiated_by_admin: true,
    })
    .eq('id', input.userId)
  if (usersErr) return { ok: false, error: 'unknown' }

  // 2. Revoke every active or self-deactivated membership in any org.
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

  // 3. Ban auth user. Pass the ban as ban_duration in hours; Supabase parses it.
  await admin.auth.admin.updateUserById(input.userId, {
    ban_duration: `${ADMIN_DELETE_BAN_HOURS}h`,
  })

  // 4. Audit log per affected org (so it shows in each org's history).
  const orgIds = Array.from(new Set((memberships ?? []).map((m) => m.organization_id)))
  for (const orgId of orgIds) {
    await admin.from('audit_log').insert({
      actor_id: input.adminUserId,
      organization_id: orgId,
      action: 'account.delete_scheduled_admin',
      target_type: 'user',
      target_id: input.userId,
      payload: { reason: input.reason, scheduled_for: scheduledFor },
    })
  }

  // 5. Notify the user. Reason is included in the email body so they know why.
  const [{ data: userRes }, { data: base }] = await Promise.all([
    admin.auth.admin.getUserById(input.userId),
    admin.from('base_profiles').select('name').eq('user_id', input.userId).maybeSingle(),
  ])
  const email = userRes?.user?.email ?? null
  const name = base?.name ?? null

  if (email) {
    await sendAccountDeleteScheduledEmail({
      to: email,
      recipientName: name,
      reason: input.reason,
      scheduledFor,
    })
  }

  return { ok: true, scheduledFor }
}
