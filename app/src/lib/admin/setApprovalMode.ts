import 'server-only'
import { createAdminClient } from '@/db/admin'

export type SetApprovalModeInput = {
  organizationId: string
  adminUserId: string
  requiresApproval: boolean
}

/**
 * Toggle whether new invite acceptances in this org go to the approval queue.
 *
 * When false (default), invitees become 'active' immediately on token redeem.
 * When true, they land as 'pending' and an admin must approve from
 * /admin/approvals before they gain org access.
 *
 * Existing pending rows from a previous "true" period are not auto-approved on
 * flip — flipping back to false only changes future invite acceptances.
 */
export async function setApprovalMode(
  input: SetApprovalModeInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient()

  const { error: updErr } = await admin
    .from('organizations')
    .update({ requires_admin_approval: input.requiresApproval })
    .eq('id', input.organizationId)

  if (updErr) return { ok: false, error: updErr.message }

  await admin.from('audit_log').insert({
    actor_id: input.adminUserId,
    organization_id: input.organizationId,
    action: input.requiresApproval ? 'org.approval_mode_on' : 'org.approval_mode_off',
    target_type: 'organization',
    target_id: input.organizationId,
  })

  return { ok: true }
}
