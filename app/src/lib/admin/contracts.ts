export type MembershipDecision = 'approve' | 'reject'

export type MembershipDecisionResult =
  | { ok: true; membershipStatus: 'active' | 'rejected' }
  | {
      ok: false
      error: 'invalid_decision' | 'not_found' | 'not_authorized' | 'not_pending'
      membershipStatus: string | null
    }

export type MembershipDecisionRepository = {
  decide(membershipId: string, decision: MembershipDecision): Promise<MembershipDecisionResult>
}
