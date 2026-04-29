import 'server-only'
import { createAdminClient } from '@/db/admin'

export type SelfDeactivateInput = {
  userId: string
}

export type SelfDeactivateResult =
  | { ok: true }
  | { ok: false; error: 'no_active_membership' | 'unknown' }

/**
 * User voluntarily deactivates their own account. All of their 'active'
 * memberships flip to 'self_deactivated'. Distinct from admin 'revoked' so
 * the user can self-reactivate later (revoked requires admin action).
 *
 * No email fires (per product spec — self-deactivation is silent).
 * No grace period (silent toggle; reversible at any time by signing back in).
 *
 * Service-role only because membership writes are service-role per RLS.
 */
export async function selfDeactivate(input: SelfDeactivateInput): Promise<SelfDeactivateResult> {
  const admin = createAdminClient()

  const { data: memberships, error } = await admin
    .from('organization_memberships')
    .select('id, organization_id, status')
    .eq('user_id', input.userId)
    .eq('status', 'active')

  if (error) return { ok: false, error: 'unknown' }
  if (!memberships || memberships.length === 0) {
    return { ok: false, error: 'no_active_membership' }
  }

  const { error: updErr } = await admin
    .from('organization_memberships')
    .update({ status: 'self_deactivated' })
    .in(
      'id',
      memberships.map((m) => m.id),
    )
  if (updErr) return { ok: false, error: 'unknown' }

  // One audit row per org, even though it's a single user-driven action.
  const orgIds = Array.from(new Set(memberships.map((m) => m.organization_id)))
  for (const orgId of orgIds) {
    await admin.from('audit_log').insert({
      actor_id: input.userId,
      organization_id: orgId,
      action: 'account.self_deactivated',
      target_type: 'user',
      target_id: input.userId,
    })
  }

  return { ok: true }
}
