import 'server-only'
import { createAdminClient } from '@/db/admin'

export type SelfReactivateInput = {
  userId: string
}

export type SelfReactivateResult =
  | { ok: true }
  | { ok: false; error: 'nothing_to_reactivate' | 'unknown' }

/**
 * User reverses a self-deactivation. Flips every self_deactivated membership
 * back to active. Used by:
 *   - The /reactivate page after sign-in (auth callback redirects there if it
 *     sees self_deactivated memberships and no active ones).
 *   - A "Reactivate" button on the danger zone if we ever expose the page to
 *     self-deactivated users.
 *
 * Cannot be used to undo an admin 'revoked' or to escape a delete schedule —
 * those have separate paths. Self-reactivate is voluntary-only.
 */
export async function selfReactivate(input: SelfReactivateInput): Promise<SelfReactivateResult> {
  const admin = createAdminClient()

  const { data: memberships, error } = await admin
    .from('organization_memberships')
    .select('id, organization_id, status')
    .eq('user_id', input.userId)
    .eq('status', 'self_deactivated')

  if (error) return { ok: false, error: 'unknown' }
  if (!memberships || memberships.length === 0) {
    return { ok: false, error: 'nothing_to_reactivate' }
  }

  const { error: updErr } = await admin
    .from('organization_memberships')
    .update({ status: 'active' })
    .in(
      'id',
      memberships.map((m) => m.id),
    )
  if (updErr) return { ok: false, error: 'unknown' }

  const orgIds = Array.from(new Set(memberships.map((m) => m.organization_id)))
  for (const orgId of orgIds) {
    await admin.from('audit_log').insert({
      actor_id: input.userId,
      organization_id: orgId,
      action: 'account.self_reactivated',
      target_type: 'user',
      target_id: input.userId,
    })
  }

  return { ok: true }
}
