import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'
import type {
  AcceptInviteResult,
  InviteAcceptanceRepository,
  InviteVerificationRepository,
  VerifyResult,
} from '@/lib/invite/contracts'

const verifyRowSchema = z.object({
  result_code: z.enum(['valid', 'not_found', 'expired', 'revoked', 'accepted']),
  invite_id: z.guid().nullable(),
  organization_id: z.guid().nullable(),
  email: z.email().nullable(),
  full_name: z.string().nullable(),
  graduation_year: z.number().int().nullable(),
  organization_name: z.string().nullable(),
  organization_slug: z.string().nullable(),
  expires_at: z.string().nullable(),
})

const acceptRowSchema = z.object({
  result_code: z.enum([
    'accepted',
    'accepted_by_other',
    'revoked',
    'expired',
    'not_found',
    'account_not_found',
    'email_mismatch',
    'membership_unavailable',
    'inconsistent_state',
  ]),
  membership_id: z.guid().nullable(),
  membership_status: z.enum(['active', 'pending', 'rejected', 'revoked']).nullable(),
})

export function parseVerifyInviteRow(row: unknown): VerifyResult {
  const parsed = verifyRowSchema.parse(row)
  if (parsed.result_code !== 'valid') {
    return { ok: false, error: parsed.result_code }
  }
  if (
    !parsed.invite_id ||
    !parsed.organization_id ||
    !parsed.email ||
    !parsed.organization_name ||
    !parsed.organization_slug ||
    !parsed.expires_at
  ) {
    throw new Error('verifyInvite: valid result omitted required safe fields')
  }
  return {
    ok: true,
    invite: {
      id: parsed.invite_id,
      organizationId: parsed.organization_id,
      email: parsed.email,
      fullName: parsed.full_name,
      graduationYear: parsed.graduation_year,
      organizationName: parsed.organization_name,
      organizationSlug: parsed.organization_slug,
      expiresAt: parsed.expires_at,
    },
  }
}

export function parseAcceptInviteRow(row: unknown): AcceptInviteResult {
  const parsed = acceptRowSchema.parse(row)
  if (
    parsed.result_code === 'accepted' &&
    parsed.membership_id &&
    (parsed.membership_status === 'active' || parsed.membership_status === 'pending')
  ) {
    return {
      ok: true,
      membershipId: parsed.membership_id,
      membershipStatus: parsed.membership_status,
    }
  }
  return { ok: false, error: parsed.result_code }
}

export function createInviteVerificationRepository(
  serviceClient: SupabaseClient<Database>,
): InviteVerificationRepository {
  return {
    async verify(token) {
      const { data, error } = await serviceClient
        .schema('api')
        .rpc('verify_invite', { p_token: token })
        .single()
      if (error) throw new Error(`verifyInvite: ${error.message}`)
      return parseVerifyInviteRow(data)
    },
  }
}

export function createInviteAcceptanceRepository(
  memberClient: SupabaseClient<Database>,
): InviteAcceptanceRepository {
  return {
    async accept(token) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('accept_invite', { p_token: token })
        .single()
      if (error) throw new Error(`acceptInvite: ${error.message}`)
      return parseAcceptInviteRow(data)
    },
  }
}
