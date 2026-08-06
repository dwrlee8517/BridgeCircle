import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

/**
 * Tenant provisioning — the one operation that stands a new organization up
 * from nothing: the org row, its first `super_admin`, and that admin's own
 * membership + profile so they are a fully functional member from the start.
 *
 * This is the front of the invite → join → member chain, which has no other
 * API: every other entity in the system is created by an already-existing
 * admin, so *something* has to mint the first one. Provisioning is that
 * something. It is privileged (it bypasses the normal invite gate and grants
 * the highest role), so the only caller is the secret-guarded provisioning
 * route — never a user session.
 *
 * Write order follows the v2 model, where identity is user-scoped and org
 * activity is membership-scoped (see docs/architecture/schema-rationale.md):
 *
 *   organizations → auth user → organization_memberships → profiles
 *   → organization_profiles → admin_role_assignments
 *
 * The membership must exist before the role grant, because v2 attaches admin
 * roles to a *membership* (`organization_membership_id`), not to a user. This
 * mirrors supabase/seeds/seed.sql, the reference bootstrap.
 *
 * Takes a service-role client (it both writes across tenant tables and calls
 * the Auth admin API). Injected rather than constructed so it can be driven
 * against local or dev Supabase and unit-tested with a stub.
 */

export type ProvisionOrganizationInput = {
  organization: {
    name: string
    slug: string
    /** Whether new invite acceptances need admin approval. Defaults to false. */
    requiresAdminApproval?: boolean
  }
  admin: {
    email: string
    password: string
    /** Shown across the app; falls back to the email local-part. */
    displayName?: string | null
  }
}

export type ProvisionOrganizationResult =
  | {
      ok: true
      organizationId: string
      adminUserId: string
      membershipId: string
    }
  | {
      ok: false
      error:
        | 'slug_taken'
        | 'admin_exists'
        | 'org_insert_failed'
        | 'user_create_failed'
        | 'membership_failed'
        | 'profile_failed'
        | 'grant_failed'
    }

// Postgres unique-violation. Surfaced as a typed error so callers (and tests)
// can distinguish "slug already used" from a genuine failure.
const UNIQUE_VIOLATION = '23505'

export async function provisionOrganization(
  admin: SupabaseClient<Database>,
  input: ProvisionOrganizationInput,
): Promise<ProvisionOrganizationResult> {
  const { organization, admin: adminInput } = input

  // 1. The org row. Slug is unique; a collision is a caller error, not a crash.
  const { data: org, error: orgErr } = await admin
    .from('organizations')
    .insert({
      name: organization.name,
      slug: organization.slug,
      requires_admin_approval: organization.requiresAdminApproval ?? false,
    })
    .select('id')
    .single()
  if (orgErr || !org) {
    if (orgErr?.code === UNIQUE_VIOLATION) return { ok: false, error: 'slug_taken' }
    return { ok: false, error: 'org_insert_failed' }
  }

  // 2. The admin's auth user. email_confirm so they can sign in immediately —
  // provisioning is trusted, there is no verification email in this path. The
  // on_auth_user_created trigger backfills public.users; profiles is ours.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: adminInput.email,
    password: adminInput.password,
    email_confirm: true,
  })
  if (createErr || !created.user) {
    await deleteOrg(admin, org.id)
    if (createErr?.message?.toLowerCase().includes('already')) {
      return { ok: false, error: 'admin_exists' }
    }
    return { ok: false, error: 'user_create_failed' }
  }
  const adminUserId = created.user.id

  // Steps 3-6 write dependent rows. Postgres gives us no cross-statement
  // transaction over the JS client, so if any step fails we compensate by
  // tearing down what we already created. This keeps the operation retryable:
  // a caller that hits an error can re-issue with the same slug/email instead
  // of tripping slug_taken/admin_exists on an orphaned half-tenant. Deleting
  // the auth user cascades to public.users and its dependent rows; deleting
  // the org cascades to memberships, org profiles, and role assignments.
  const rollback = async (): Promise<void> => {
    try {
      await admin.auth.admin.deleteUser(adminUserId)
      await deleteOrg(admin, org.id)
    } catch {
      // Best-effort: the namespaced teardown sweep is the backstop if this
      // compensation itself fails.
    }
  }

  // 3. Membership first — in v2 it is the anchor every org-scoped row hangs
  // off, including the admin role grant below.
  const { data: membership, error: mbErr } = await admin
    .from('organization_memberships')
    .insert({
      user_id: adminUserId,
      organization_id: org.id,
      status: 'active',
      joined_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (mbErr || !membership) {
    await rollback()
    return { ok: false, error: 'membership_failed' }
  }

  // 4. The person-scoped profile (one per user, reused across memberships).
  const { error: profileErr } = await admin.from('profiles').insert({
    user_id: adminUserId,
    display_name: adminInput.displayName?.trim() || adminInput.email.split('@')[0],
  })
  if (profileErr) {
    await rollback()
    return { ok: false, error: 'profile_failed' }
  }

  // 5. The per-membership overlay.
  const { error: orgProfileErr } = await admin.from('organization_profiles').insert({
    organization_membership_id: membership.id,
    organization_id: org.id,
  })
  if (orgProfileErr) {
    await rollback()
    return { ok: false, error: 'profile_failed' }
  }

  // 6. Grant super_admin to the membership. granted_by_membership_id stays
  // null: the platform, not a person, seeded this one.
  const { error: grantErr } = await admin.from('admin_role_assignments').insert({
    organization_id: org.id,
    organization_membership_id: membership.id,
    role: 'super_admin',
  })
  if (grantErr) {
    await rollback()
    return { ok: false, error: 'grant_failed' }
  }

  return {
    ok: true,
    organizationId: org.id,
    adminUserId,
    membershipId: membership.id,
  }
}

async function deleteOrg(admin: SupabaseClient<Database>, orgId: string): Promise<void> {
  await admin.from('organizations').delete().eq('id', orgId)
}
