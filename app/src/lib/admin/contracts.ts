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

// --- Members directory -------------------------------------------------------

export type AdminMemberStatus = 'pending' | 'active' | 'rejected' | 'revoked'

/** Roles the console can grant. super_admin stays a deliberate SQL-level act. */
export type GrantableAdminRole = 'admin' | 'event_moderator' | 'ambassador'

export type AdminMember = {
  membershipId: string
  userId: string
  displayName: string | null
  title: string | null
  employer: string | null
  city: string | null
  graduationYear: number | null
  status: AdminMemberStatus
  joinedAt: string | null
  createdAt: string
  accountState: 'active' | 'deletion_scheduled'
  lastSeenAt: string | null
  openToHelp: boolean
  roles: string[]
}

export type AdminMemberFilters = {
  search?: string | null
  classYear?: number | null
  status?: AdminMemberStatus | null
  openToHelp?: boolean | null
  /** Members whose last_seen_at is older than this many days (or never seen). */
  inactiveDays?: number | null
}

export type AdminMemberListResult =
  | { ok: true; total: number; items: AdminMember[] }
  | { ok: false; error: 'invalid_input' | 'not_available' }

export type AdminRoleChangeResult =
  | { ok: true; status: 'granted' | 'already_granted' | 'revoked' | 'not_found' }
  | { ok: false; error: 'invalid_input' | 'not_available' | 'forbidden' }

export type AdminMembersRepository = {
  list(
    input: { membershipId: string; limit?: number; offset?: number } & AdminMemberFilters,
  ): Promise<AdminMemberListResult>
  grantRole(input: {
    membershipId: string
    targetMembershipId: string
    role: GrantableAdminRole
  }): Promise<AdminRoleChangeResult>
  revokeRole(input: {
    membershipId: string
    targetMembershipId: string
    role: GrantableAdminRole
  }): Promise<AdminRoleChangeResult>
}
