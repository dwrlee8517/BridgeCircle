export type MembershipDecision = 'approve' | 'reject'

export type MembershipRejectionReason =
  | 'could_not_verify'
  | 'not_eligible'
  | 'duplicate_request'
  | 'other'

export type MembershipDecisionInput =
  | {
      membershipId: string
      decision: 'approve'
      reasonCode?: null
      privateNote?: null
    }
  | {
      membershipId: string
      decision: 'reject'
      reasonCode: MembershipRejectionReason
      privateNote?: string | null
    }

export type MembershipDecisionRequest = {
  membershipId: string
  decision: MembershipDecision
  reasonCode?: MembershipRejectionReason | null
  privateNote?: string | null
}

export type MembershipDecisionResult =
  | { ok: true; membershipStatus: 'active' | 'rejected' }
  | {
      ok: false
      error:
        | 'invalid_decision'
        | 'invalid_reason'
        | 'not_found'
        | 'not_authorized'
        | 'not_available'
        | 'not_pending'
      membershipStatus: string | null
    }

export type MembershipDecisionRepository = {
  decide(input: MembershipDecisionInput): Promise<MembershipDecisionResult>
}

export type AdminReportStatus = 'open' | 'reviewing' | 'actioned' | 'dismissed'
export type AdminReportQueueFilter = 'open' | 'reviewing' | 'closed'
export type AdminReportDecision = 'start_review' | 'dismiss' | 'mark_actioned'

export type AdminReportLatestAction = {
  type: string
  note: string | null
  createdAt: string
}

export type AdminReport = {
  id: string
  status: AdminReportStatus
  reason: 'harassment' | 'spam' | 'inappropriate' | 'impersonation' | 'other'
  note: string | null
  targetType: 'ask' | 'offer' | 'message' | 'profile'
  targetId: string
  reporterName: string | null
  reportedName: string | null
  evidence: Record<string, unknown>
  assignedToUserId: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
  latestAction: AdminReportLatestAction | null
}

export type AdminReportListResult =
  | { ok: true; items: AdminReport[] }
  | { ok: false; error: 'invalid_input' | 'not_available' }

export type AdminReportDecisionResult =
  | { ok: true; status: 'reviewing' | 'dismissed' | 'actioned' }
  | { ok: false; error: 'stale' | 'invalid_input' | 'not_available' }

export type AdminModerationRepository = {
  list(input: {
    membershipId: string
    status?: AdminReportStatus | null
    limit?: number
  }): Promise<AdminReportListResult>
  decide(input: {
    membershipId: string
    reportId: string
    decision: AdminReportDecision
    note?: string | null
  }): Promise<AdminReportDecisionResult>
}
