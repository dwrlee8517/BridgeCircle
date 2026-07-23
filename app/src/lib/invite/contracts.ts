export type VerifiedInvite = {
  id: string
  organizationId: string
  email: string
  fullName: string | null
  graduationYear: number | null
  organizationName: string
  organizationSlug: string
  expiresAt: string
}

export type VerifyResult =
  | { ok: true; invite: VerifiedInvite }
  | { ok: false; error: 'not_found' | 'expired' | 'revoked' | 'accepted' }

export type AcceptInviteResult =
  | { ok: true; membershipId: string; membershipStatus: 'active' | 'pending' }
  | {
      ok: false
      error:
        | 'accepted'
        | 'accepted_by_other'
        | 'revoked'
        | 'expired'
        | 'not_found'
        | 'account_not_found'
        | 'email_mismatch'
        | 'membership_unavailable'
        | 'inconsistent_state'
    }

export type InviteVerificationRepository = {
  verify(token: string): Promise<VerifyResult>
}

export type InviteAcceptanceRepository = {
  accept(token: string): Promise<AcceptInviteResult>
}
