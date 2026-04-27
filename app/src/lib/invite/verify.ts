import 'server-only'
import { createAdminClient } from '@/db/admin'

export type VerifiedInvite = {
  id: string
  organizationId: string
  email: string
  fullName: string | null
  graduationYear: number | null
  organizationName: string
  organizationSlug: string
}

export type VerifyResult =
  | { ok: true; invite: VerifiedInvite }
  | { ok: false; error: 'not_found' | 'expired' | 'revoked' | 'accepted' }

/**
 * Validate an invite token. Uses the admin client because the user is not yet
 * authenticated (no JWT) and RLS would otherwise hide the row. The token
 * itself is the authorization here — random 32 bytes, unguessable.
 */
export async function verifyInviteToken(token: string): Promise<VerifyResult> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('invites')
    .select(
      'id, organization_id, email, status, full_name, graduation_year, expires_at, organizations(name, slug)',
    )
    .eq('token', token)
    .maybeSingle()

  if (error || !data) {
    return { ok: false, error: 'not_found' }
  }

  if (data.status === 'revoked') return { ok: false, error: 'revoked' }
  if (data.status === 'accepted') return { ok: false, error: 'accepted' }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { ok: false, error: 'expired' }
  }

  const org = data.organizations as { name: string; slug: string } | null
  if (!org) return { ok: false, error: 'not_found' }

  return {
    ok: true,
    invite: {
      id: data.id,
      organizationId: data.organization_id,
      email: data.email,
      fullName: data.full_name,
      graduationYear: data.graduation_year,
      organizationName: org.name,
      organizationSlug: org.slug,
    },
  }
}
