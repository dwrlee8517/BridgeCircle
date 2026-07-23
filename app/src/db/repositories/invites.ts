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

const adminInviteMutationRowSchema = z.object({
  result_code: z.enum([
    'issued',
    'already_pending',
    'resent',
    'revoked',
    'accepted',
    'expired',
    'not_available',
    'invalid_input',
  ]),
  invite_id: z.guid().nullable(),
  invite_status: z.enum(['pending', 'accepted', 'expired', 'revoked']).nullable(),
  expires_at: z.string().nullable(),
})

const adminInviteRowSchema = z.object({
  invite_id: z.guid(),
  email: z.email(),
  full_name: z.string().nullable(),
  graduation_year: z.number().int().nullable(),
  status: z.enum(['pending', 'accepted', 'expired', 'revoked']),
  expires_at: z.string(),
  created_at: z.string(),
})

export type AdminInvite = {
  id: string
  email: string
  fullName: string | null
  graduationYear: number | null
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  expiresAt: string
  createdAt: string
}

export type AdminInviteMutationResult =
  | {
      ok: true
      result: 'issued' | 'already_pending' | 'resent' | 'revoked'
      inviteId: string
      status: 'pending' | 'accepted' | 'expired' | 'revoked'
      expiresAt: string
    }
  | {
      ok: false
      error: 'accepted' | 'expired' | 'not_available' | 'invalid_input'
    }

export type AdminInviteRepository = {
  issue(input: {
    organizationId: string
    email: string
    fullName?: string | null
    graduationYear?: number | null
    requestId: string
  }): Promise<AdminInviteMutationResult>
  list(input: {
    organizationId: string
    beforeCreatedAt?: string
    beforeId?: string
    limit?: number
  }): Promise<AdminInvite[]>
  resend(inviteId: string, requestId: string): Promise<AdminInviteMutationResult>
  revoke(inviteId: string, requestId: string): Promise<AdminInviteMutationResult>
}

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

export function parseAdminInviteMutationRow(row: unknown): AdminInviteMutationResult {
  const parsed = adminInviteMutationRowSchema.parse(row)
  if (
    ['issued', 'already_pending', 'resent', 'revoked'].includes(parsed.result_code) &&
    parsed.invite_id &&
    parsed.invite_status &&
    parsed.expires_at
  ) {
    return {
      ok: true,
      result: parsed.result_code as 'issued' | 'already_pending' | 'resent' | 'revoked',
      inviteId: parsed.invite_id,
      status: parsed.invite_status,
      expiresAt: parsed.expires_at,
    }
  }
  if (
    parsed.result_code === 'accepted' ||
    parsed.result_code === 'expired' ||
    parsed.result_code === 'not_available' ||
    parsed.result_code === 'invalid_input'
  ) {
    return { ok: false, error: parsed.result_code }
  }
  throw new Error('adminInvite: successful result omitted required fields')
}

export function parseAdminInviteRow(row: unknown): AdminInvite {
  const parsed = adminInviteRowSchema.parse(row)
  return {
    id: parsed.invite_id,
    email: parsed.email,
    fullName: parsed.full_name,
    graduationYear: parsed.graduation_year,
    status: parsed.status,
    expiresAt: parsed.expires_at,
    createdAt: parsed.created_at,
  }
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

export function createAdminInviteRepository(
  client: SupabaseClient<Database>,
): AdminInviteRepository {
  const mutate = async (
    operation: 'resend_invite' | 'revoke_invite',
    inviteId: string,
    requestId: string,
  ) => {
    const { data, error } = await client
      .schema('api')
      .rpc(operation, { p_invite_id: inviteId, p_request_id: requestId })
      .single()
    if (error) throw new Error(`${operation}: ${error.message}`)
    return parseAdminInviteMutationRow(data)
  }

  return {
    async issue(input) {
      const { data, error } = await client
        .schema('api')
        .rpc('issue_invite', {
          p_organization_id: input.organizationId,
          p_email: input.email,
          p_full_name: input.fullName ?? '',
          // The fixed SQL contract maps 0 to NULL so the generated RPC type
          // stays scalar while graduation year remains optional to admins.
          p_graduation_year: input.graduationYear ?? 0,
          p_request_id: input.requestId,
        })
        .single()
      if (error) throw new Error(`issueInvite: ${error.message}`)
      return parseAdminInviteMutationRow(data)
    },

    async list(input) {
      const { data, error } = await client.schema('api').rpc('list_invites', {
        p_organization_id: input.organizationId,
        p_before_created_at: input.beforeCreatedAt,
        p_before_id: input.beforeId,
        p_limit: input.limit,
      })
      if (error) throw new Error(`listInvites: ${error.message}`)
      return (data ?? []).map(parseAdminInviteRow)
    },

    resend(inviteId, requestId) {
      return mutate('resend_invite', inviteId, requestId)
    },

    revoke(inviteId, requestId) {
      return mutate('revoke_invite', inviteId, requestId)
    },
  }
}
