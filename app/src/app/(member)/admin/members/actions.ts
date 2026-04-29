'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/db/server'
import { cancelScheduledDeletion } from '@/lib/admin/cancelScheduledDeletion'
import { finalizeAccount } from '@/lib/admin/finalizeAccount'
import { scheduleAccountDeletion } from '@/lib/admin/scheduleAccountDeletion'
import { setApprovalMode } from '@/lib/admin/setApprovalMode'
import { setMemberActive } from '@/lib/admin/setMemberActive'
import { requireAdmin } from '@/lib/auth/session'

// Generic action state shape used by every admin row action — the dialogs
// each have their own useActionState hook but share this type for ergonomics.
export type AdminMemberActionState = {
  ok?: boolean
  error?: string
}

// =============================================================================
// Deactivate / Reactivate
// =============================================================================

const deactivateSchema = z.object({
  membershipId: z.uuid(),
  reason: z.string().trim().min(1, 'Reason is required.').max(500),
})

export async function deactivateMemberAction(
  _prev: AdminMemberActionState,
  formData: FormData,
): Promise<AdminMemberActionState> {
  const session = await requireAdmin()
  const parsed = deactivateSchema.safeParse({
    membershipId: formData.get('membershipId'),
    reason: formData.get('reason'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid request.' }
  }

  const result = await setMemberActive({
    membershipId: parsed.data.membershipId,
    adminUserId: session.userId,
    action: 'deactivate',
    reason: parsed.data.reason,
  })

  if (!result.ok) {
    if (result.error === 'membership_not_found') return { error: 'Membership not found.' }
    if (result.error === 'wrong_state') {
      return { error: 'Only active members can be deactivated.' }
    }
    return { error: 'Could not deactivate. Try again.' }
  }

  revalidatePath('/admin/members')
  return { ok: true }
}

const reactivateSchema = z.object({ membershipId: z.uuid() })

export async function reactivateMemberAction(
  _prev: AdminMemberActionState,
  formData: FormData,
): Promise<AdminMemberActionState> {
  const session = await requireAdmin()
  const parsed = reactivateSchema.safeParse({ membershipId: formData.get('membershipId') })
  if (!parsed.success) return { error: 'Invalid request.' }

  const result = await setMemberActive({
    membershipId: parsed.data.membershipId,
    adminUserId: session.userId,
    action: 'reactivate',
  })

  if (!result.ok) {
    if (result.error === 'membership_not_found') return { error: 'Membership not found.' }
    if (result.error === 'wrong_state') {
      return { error: 'Only deactivated members can be reactivated.' }
    }
    return { error: 'Could not reactivate. Try again.' }
  }

  revalidatePath('/admin/members')
  return { ok: true }
}

// =============================================================================
// Schedule deletion / Cancel deletion / Finalize now
// =============================================================================

const scheduleDeletionSchema = z.object({
  userId: z.uuid(),
  reason: z.string().trim().min(1, 'Reason is required.').max(1000),
})

export async function scheduleDeletionAction(
  _prev: AdminMemberActionState,
  formData: FormData,
): Promise<AdminMemberActionState> {
  const session = await requireAdmin()
  const parsed = scheduleDeletionSchema.safeParse({
    userId: formData.get('userId'),
    reason: formData.get('reason'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid request.' }
  }

  const result = await scheduleAccountDeletion({
    userId: parsed.data.userId,
    adminUserId: session.userId,
    reason: parsed.data.reason,
  })

  if (!result.ok) {
    if (result.error === 'user_not_found') return { error: 'User not found.' }
    if (result.error === 'already_scheduled') {
      return { error: 'This account already has a pending deletion.' }
    }
    return { error: 'Could not schedule deletion. Try again.' }
  }

  revalidatePath('/admin/members')
  return { ok: true }
}

const cancelDeletionSchema = z.object({ userId: z.uuid() })

export async function cancelDeletionAction(
  _prev: AdminMemberActionState,
  formData: FormData,
): Promise<AdminMemberActionState> {
  const session = await requireAdmin()
  const parsed = cancelDeletionSchema.safeParse({ userId: formData.get('userId') })
  if (!parsed.success) return { error: 'Invalid request.' }

  const result = await cancelScheduledDeletion({
    userId: parsed.data.userId,
    actorUserId: session.userId,
    actorIsAdmin: true,
  })

  if (!result.ok) {
    if (result.error === 'user_not_found') return { error: 'User not found.' }
    if (result.error === 'no_active_schedule') {
      return { error: 'No active deletion schedule to cancel.' }
    }
    return { error: 'Could not cancel deletion. Try again.' }
  }

  revalidatePath('/admin/members')
  return { ok: true }
}

const finalizeSchema = z.object({ userId: z.uuid() })

export async function finalizeAccountAction(
  _prev: AdminMemberActionState,
  formData: FormData,
): Promise<AdminMemberActionState> {
  const session = await requireAdmin()
  const parsed = finalizeSchema.safeParse({ userId: formData.get('userId') })
  if (!parsed.success) return { error: 'Invalid request.' }

  const result = await finalizeAccount({
    userId: parsed.data.userId,
    actorUserId: session.userId,
  })

  if (!result.ok) {
    if (result.error === 'user_not_found') return { error: 'User not found.' }
    if (result.error === 'already_finalized') {
      return { error: 'This account is already deleted.' }
    }
    return { error: 'Could not finalize deletion. Try again.' }
  }

  revalidatePath('/admin/members')
  return { ok: true }
}

// =============================================================================
// Approval mode toggle (unchanged from Day 14 base, kept here for one entry point)
// =============================================================================

const approvalModeSchema = z.object({ requiresApproval: z.enum(['true', 'false']) })

export type ApprovalModeState = { ok?: boolean; error?: string }

export async function setApprovalModeAction(
  _prev: ApprovalModeState,
  formData: FormData,
): Promise<ApprovalModeState> {
  const session = await requireAdmin()
  const supabase = await createClient()

  const parsed = approvalModeSchema.safeParse({
    requiresApproval: formData.get('requiresApproval'),
  })
  if (!parsed.success) return { error: 'Invalid request.' }

  const { data: roles } = await supabase
    .from('admin_role_assignments')
    .select('organization_id')
    .eq('user_id', session.userId)
    .in('role', ['super_admin', 'admin'])
    .limit(1)
  const orgId = roles?.[0]?.organization_id
  if (!orgId) return { error: 'No admin organization found.' }

  const result = await setApprovalMode({
    organizationId: orgId,
    adminUserId: session.userId,
    requiresApproval: parsed.data.requiresApproval === 'true',
  })

  if (!result.ok) return { error: result.error }

  revalidatePath('/admin/members')
  revalidatePath('/admin/approvals')
  revalidatePath('/admin')
  return { ok: true }
}
