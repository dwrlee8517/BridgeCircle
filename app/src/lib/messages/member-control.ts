export type MemberControlEvent =
  | { type: 'help.changed'; id: string; askId: string; offerId?: string }
  | { type: 'messages.changed'; id: string; conversationId: string }
  | {
      type: 'connections.changed'
      id: string
      requestId?: string
      conversationId?: string
    }
  | { type: 'conversation.permissions_changed'; id: string; conversationId: string }
  | { type: 'conversation.revoked'; id: string; conversationId: string }

export type ConversationControl = {
  sequence: number
  type: 'conversation.permissions_changed' | 'conversation.revoked'
  conversationId: string
}

export type MemberControlState = {
  revision: number
  helpRevision: number
  messagesRevision: number
  connectionsRevision: number
  conversationControl: ConversationControl | null
}

export const INITIAL_MEMBER_CONTROL_STATE: MemberControlState = {
  revision: 0,
  helpRevision: 0,
  messagesRevision: 0,
  connectionsRevision: 0,
  conversationControl: null,
}

export type MemberControlAction =
  | { type: 'subscribed' }
  | { type: 'event'; event: MemberControlEvent }

export function reduceMemberControl(
  state: MemberControlState,
  action: MemberControlAction,
): MemberControlState {
  if (action.type === 'subscribed') {
    return {
      ...state,
      revision: state.revision + 1,
      helpRevision: state.helpRevision + 1,
      messagesRevision: state.messagesRevision + 1,
      connectionsRevision: state.connectionsRevision + 1,
    }
  }

  const { event } = action
  if (event.type === 'help.changed') {
    return {
      ...state,
      revision: state.revision + 1,
      helpRevision: state.helpRevision + 1,
      messagesRevision: state.messagesRevision + 1,
    }
  }
  if (event.type === 'messages.changed') {
    return {
      ...state,
      revision: state.revision + 1,
      messagesRevision: state.messagesRevision + 1,
    }
  }
  if (event.type === 'connections.changed') {
    return {
      ...state,
      revision: state.revision + 1,
      messagesRevision: state.messagesRevision + 1,
      connectionsRevision: state.connectionsRevision + 1,
    }
  }
  return {
    ...state,
    revision: state.revision + 1,
    messagesRevision: state.messagesRevision + 1,
    conversationControl: {
      sequence: (state.conversationControl?.sequence ?? 0) + 1,
      type: event.type,
      conversationId: event.conversationId,
    },
  }
}

const RECONNECT_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000] as const

export function reconnectDelayMs(attempt: number): number {
  const index = Math.max(0, Math.min(Math.trunc(attempt), RECONNECT_DELAYS_MS.length - 1))
  return RECONNECT_DELAYS_MS[index]
}
