export type MessagesFilter = 'all' | 'unread' | 'my_circle' | 'open_asks'

export type MessagesCursor = {
  priority: 1 | 2 | 3
  activityAt: string
  conversationId: string
}

export type MessageCounterpart = {
  userId: string
  displayName: string
  preferredName: string | null
  avatarPath: string | null
  graduationYear: number | null
}

export type MessageConversationSummary = {
  conversationId: string
  kind: 'direct' | 'ask'
  organizationId: string | null
  askId: string | null
  counterpart: MessageCounterpart
  isConnected: boolean
  canSend: boolean
  readOnlyReason:
    | 'account_unavailable'
    | 'connection_required'
    | 'ask_unavailable'
    | 'not_available'
    | null
  askQuestion: string | null
  askStatus: 'accepted' | 'resolved' | null
  latestMessage: {
    id: number
    kind: 'user' | 'system'
    senderUserId: string | null
    body: string
    createdAt: string
  } | null
  unreadCount: number
  needsReply: boolean
  priority: 1 | 2 | 3
  activityAt: string
}

type MessagesWaitingBase = {
  organizationId: string
  counterpart: MessageCounterpart
  createdAt: string
}

export type DirectAskWaitingItem = MessagesWaitingBase & {
  kind: 'direct_ask'
  askId: string
  question: string
  requestMessage: string
}

export type ConnectionRequestWaitingItem = MessagesWaitingBase & {
  kind: 'connection_request'
  requestId: string
  introMessage: string | null
}

export type MessagesWaitingItem = DirectAskWaitingItem | ConnectionRequestWaitingItem

export type MessagesCounts = {
  all: number
  unread: number
  myCircle: number
  openAsks: number
  waiting: number
  attention: number
}

export type ListMessageConversationsInput = {
  filter?: MessagesFilter
  query?: string | null
  cursor?: MessagesCursor | null
  limit?: number
}

export type MessagesRepository = {
  listConversations(input: {
    filter: MessagesFilter
    query: string | null
    cursor: MessagesCursor | null
    limit: number
  }): Promise<MessageConversationSummary[]>
  listWaiting(): Promise<MessagesWaitingItem[]>
  getCounts(): Promise<MessagesCounts>
}

export type MessageConversationPage = {
  items: MessageConversationSummary[]
  nextCursor: MessagesCursor | null
}
