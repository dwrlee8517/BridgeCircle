export type HelpAskKind = 'direct' | 'circle'
export type HelpAskStatus =
  | 'waiting'
  | 'open'
  | 'accepted'
  | 'declined'
  | 'retracted'
  | 'resolved'
  | 'closed'
export type HelpOfferStatus = 'pending' | 'accepted' | 'declined' | 'closed'
export type HelpGiveArm = 'direct' | 'suggested' | 'search'
export type HelpReach = 'matched' | 'organization'
export type HelpReportReason = 'harassment' | 'spam' | 'inappropriate' | 'impersonation' | 'other'

export type HelpCursor = {
  createdAt: string
  id: string
}

export type IdentifiedHelpProfile = {
  identity: 'identified'
  userId: string
  displayName: string
  headline: string | null
  avatarPath: string | null
  graduationYear: number | null
}

export type AnonymousHelpProfile = {
  identity: 'anonymous'
  displayName: 'A member'
  graduationYear: number | null
}

export type HelpProfilePreview = IdentifiedHelpProfile | AnonymousHelpProfile

export type HelpHomeRecentAsk = {
  askId: string
  kind: HelpAskKind
  status: HelpAskStatus
  question: string
  createdAt: string
  expiresAt: string
}

export type HelpDirectRequest = {
  askId: string
  question: string
  requestMessage: string
  asker: IdentifiedHelpProfile
  createdAt: string
  expiresAt: string
}

export type HelpSuggestedAsk = {
  askId: string
  question: string
  anonymousUntilAccepted: boolean
  asker: HelpProfilePreview
  matchReason: string
  createdAt: string
  expiresAt: string
}

export type HelpHome = {
  membershipId: string
  organizationId: string
  activeAskCount: number
  activeAskLimit: number
  openToHelp: boolean
  pausedAt: string | null
  pauseReason: 'manual' | 'unresponsive' | 'admin' | null
  helperTopics: string[]
  recentAsks: HelpHomeRecentAsk[]
  directRequests: HelpDirectRequest[]
  suggestedAsks: HelpSuggestedAsk[]
}

export type HelpCandidate = {
  membershipId: string
  userId: string
  displayName: string
  headline: string | null
  avatarPath: string | null
  graduationYear: number | null
  topics: string[]
  lexicalScore: number
  semanticScore: number
  matchReason: string
  evidenceChunkIds: string[]
}

export type HelpOffer = {
  id: string
  status: HelpOfferStatus
  offerNote: string
  declineReasonCode: string | null
  declineNote: string | null
  closureReason: string | null
  createdAt: string
  helper: IdentifiedHelpProfile
}

export type HelpHistoryEvent = {
  id: number
  type:
    | 'created'
    | 'reminded'
    | 'accepted'
    | 'declined'
    | 'retracted'
    | 'closed'
    | 'resolved'
    | 'offer_created'
    | 'offer_declined'
    | 'offer_closed'
  createdAt: string
}

export type HelpAskDetail = {
  id: string
  organizationId: string
  kind: HelpAskKind
  status: HelpAskStatus
  question: string
  requestMessage: string | null
  reach: HelpReach | null
  anonymousUntilAccepted: boolean
  asker: HelpProfilePreview
  recipient: IdentifiedHelpProfile | null
  declineReasonCode: string | null
  declineNote: string | null
  closureReason: string | null
  outcomeNote: string | null
  conversationId: string | null
  offers: HelpOffer[]
  history: HelpHistoryEvent[]
  acceptedAt: string | null
  endedAt: string | null
  expiresAt: string
  createdAt: string
}

export type HelpAskSummary = {
  id: string
  organizationId: string
  kind: HelpAskKind
  status: HelpAskStatus
  question: string
  recipient: IdentifiedHelpProfile | null
  offerCount: number
  conversationId: string | null
  createdAt: string
  expiresAt: string
  endedAt: string | null
}

export type GiveHelpItem = {
  id: string
  organizationId: string
  kind: HelpAskKind
  status: HelpAskStatus
  question: string
  reach: HelpReach | null
  anonymousUntilAccepted: boolean
  asker: HelpProfilePreview
  matchReason: string | null
  myOfferStatus: HelpOfferStatus | null
  createdAt: string
  expiresAt: string
}

export type HelperPreferences = {
  membershipId: string
  organizationId: string
  openToHelp: boolean
  maxPendingRequests: number
  consecutiveTimeouts: number
  pausedAt: string | null
  pauseReason: 'manual' | 'unresponsive' | 'admin' | null
  topics: string[]
}

export type CreateHelpAskResult =
  | {
      status: 'created' | 'existing'
      askId: string
      activeCount: number
      created: boolean
    }
  | {
      status: 'idempotency_conflict'
      askId: string
      activeCount: number
      created: false
    }
  | {
      status: 'active_limit_reached' | 'helper_limit_reached' | 'invalid_input' | 'not_available'
      askId: null
      activeCount: number
      created: false
    }

export type HelpAskDecisionResult =
  | {
      status: 'accepted' | 'declined' | 'retracted' | 'resolved'
      askId: string
      conversationId: string | null
    }
  | {
      status: 'already_decided'
      askId: string
      conversationId: null
    }
  | {
      status: 'invalid_input' | 'not_available'
      askId: null
      conversationId: null
    }

export type CreateHelpOfferResult =
  | { status: 'created' | 'existing'; askId: string; offerId: string; created: boolean }
  | { status: 'idempotency_conflict'; askId: string; offerId: null; created: false }
  | { status: 'invalid_input' | 'not_available'; askId: null; offerId: null; created: false }

export type HelpOfferDecisionResult =
  | {
      status: 'accepted' | 'declined'
      askId: string
      offerId: string
      conversationId: string | null
    }
  | {
      status: 'already_decided'
      askId: string
      offerId: string
      conversationId: null
    }
  | {
      status: 'invalid_input' | 'not_available'
      askId: null
      offerId: null
      conversationId: null
    }

export type SaveHelperPreferencesResult =
  | {
      status: 'saved'
      openToHelp: boolean
      pausedAt: string | null
      pauseReason: 'manual' | 'unresponsive' | 'admin' | null
      topics: string[]
    }
  | {
      status: 'invalid_input' | 'not_available'
      openToHelp: boolean
      pausedAt: string | null
      pauseReason: 'manual' | 'unresponsive' | 'admin' | null
      topics: string[]
    }

export type HelpAiBudgetResult =
  | { status: 'allowed'; remaining: number; resetsAt: string }
  | { status: 'limited' | 'not_available'; remaining: 0; resetsAt: string }

export type HelpRepository = {
  getHome(membershipId: string): Promise<HelpHome | null>
  searchCandidates(input: {
    membershipId: string
    question: string
    queryEmbedding: string | null
    limit: number
  }): Promise<HelpCandidate[]>
  getAskDetail(askId: string): Promise<HelpAskDetail | null>
  listMyAsks(input: {
    membershipId: string
    cursor: HelpCursor | null
    limit: number
  }): Promise<HelpAskSummary[]>
  listGiveHelp(input: {
    membershipId: string
    arm: HelpGiveArm
    query: string | null
    cursor: HelpCursor | null
    limit: number
  }): Promise<GiveHelpItem[]>
  getHelperPreferences(membershipId: string): Promise<HelperPreferences | null>
  saveHelperPreferences(input: {
    membershipId: string
    openToHelp: boolean
    topics: string[]
  }): Promise<SaveHelperPreferencesResult>
  consumeAiBudget(
    action: 'ask_draft' | 'match_explanation' | 'decline_note',
  ): Promise<HelpAiBudgetResult>
  createDirectAsk(input: {
    membershipId: string
    recipientMembershipId: string
    question: string
    requestMessage: string
    clientRequestId: string
  }): Promise<CreateHelpAskResult>
  createCircleAsk(input: {
    membershipId: string
    question: string
    reach: HelpReach
    anonymousUntilAccepted: boolean
    clientRequestId: string
  }): Promise<CreateHelpAskResult>
  respondToDirectAsk(input: {
    askId: string
    decision: 'accept' | 'decline'
    openingMessage: string | null
    declineReasonCode: 'unavailable' | 'outside_expertise' | 'other' | null
    declineNote: string | null
    clientNonce: string | null
  }): Promise<HelpAskDecisionResult>
  retractAsk(askId: string): Promise<HelpAskDecisionResult>
  resolveAsk(input: { askId: string; outcomeNote: string | null }): Promise<HelpAskDecisionResult>
  offerToHelp(input: {
    askId: string
    membershipId: string
    offerNote: string
    clientRequestId: string
  }): Promise<CreateHelpOfferResult>
  decideOffer(input: {
    offerId: string
    decision: 'accept' | 'decline'
    openingMessage: string | null
    declineReasonCode: 'went_another_direction' | 'not_right_fit' | 'other' | null
    declineNote: string | null
    clientNonce: string | null
  }): Promise<HelpOfferDecisionResult>
  reportOffer(input: {
    offerId: string
    reason: HelpReportReason
    note: string | null
  }): Promise<{ reportId: string }>
}
