export type ConversationKind = 'direct' | 'ask'
export type ConversationSystemEventType = 'connection_accepted' | 'ask_accepted' | 'ask_resolved'

export type ConversationDetail = {
  id: string
  kind: ConversationKind
  organizationId: string | null
  askId: string | null
  createdAt: string
  lastMessageAt: string | null
  counterpart: {
    userId: string
    displayName: string
    preferredName: string | null
    avatarPath: string | null
    graduationYear: number | null
    headline: string | null
    currentEmployer: string | null
    currentTitle: string | null
    openToHelp: boolean
  }
  isConnected: boolean
  canSend: boolean
  readOnlyReason:
    | 'account_unavailable'
    | 'connection_required'
    | 'ask_unavailable'
    | 'not_available'
    | null
  connectionState: 'connected' | 'incoming_pending' | 'outgoing_pending' | 'none'
  pendingConnectionRequestId: string | null
  askContext: {
    question: string
    status: 'accepted' | 'resolved'
    outcomeNote: string | null
    outcomeSharing: {
      viewerShareStory: boolean
      viewerShareIdentity: boolean
      storyEligible: boolean
      identityEligible: boolean
    }
  } | null
  canRequestConnection: boolean
  viewerLastReadMessageId: number | null
  viewerLastReadAt: string | null
  counterpartLastReadMessageId: number | null
  counterpartLastReadAt: string | null
  latestMessageId: number | null
}

type ConversationMessageBase = {
  id: number
  conversationId: string
  body: string
  createdAt: string
}

export type ConversationUserMessage = ConversationMessageBase & {
  kind: 'user'
  senderUserId: string
}

export type ConversationSystemMessage = ConversationMessageBase & {
  kind: 'system'
  eventType: ConversationSystemEventType
  actorUserId: string | null
}

export type ConversationMessage = ConversationUserMessage | ConversationSystemMessage

export type GetOrCreateDirectResult =
  | { status: 'ready'; conversationId: string }
  | { status: 'connection_required' | 'not_available' }

export type SendMessageResult =
  | { status: 'sent' | 'duplicate'; messageId: number; createdAt: string }
  | { status: 'connection_required' | 'invalid_message' | 'not_available' }

export type MarkReadResult =
  | {
      status: 'advanced' | 'unchanged'
      lastReadMessageId: number
      lastReadAt: string
    }
  | { status: 'invalid_cursor' | 'not_available' }

export type PublishTypingResult =
  | { status: 'published' | 'throttled'; expiresAt: string }
  | { status: 'not_available' }

export type ConversationRepository = {
  getDetail(conversationId: string): Promise<ConversationDetail | null>
  listBefore(input: {
    conversationId: string
    beforeMessageId: number | null
    limit: number
  }): Promise<ConversationMessage[]>
  listAfter(input: {
    conversationId: string
    afterMessageId: number | null
    limit: number
  }): Promise<ConversationMessage[]>
  getOrCreateDirect(otherUserId: string): Promise<GetOrCreateDirectResult>
  send(input: {
    conversationId: string
    body: string
    clientNonce: string
  }): Promise<SendMessageResult>
  markRead(input: { conversationId: string; messageId: number }): Promise<MarkReadResult>
  publishTyping(input: { conversationId: string; isTyping: boolean }): Promise<PublishTypingResult>
}
