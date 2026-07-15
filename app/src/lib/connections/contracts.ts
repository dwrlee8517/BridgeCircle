export type SendConnectionRequestResult =
  | { status: 'created' | 'existing' | 'incoming_pending'; requestId: string }
  | {
      status: 'already_connected' | 'not_available' | 'invalid_input' | 'idempotency_conflict'
    }

export type RespondToConnectionRequestResult =
  | { status: 'accepted'; connectionId: string; conversationId: string }
  | {
      status: 'already_decided'
      connectionId: string | null
      conversationId: string | null
    }
  | { status: 'declined' | 'not_available' | 'invalid_input' }

export type DisconnectResult = { status: 'disconnected' | 'unchanged' | 'not_available' }

export type ConnectionsRepository = {
  sendRequest(input: {
    recipientUserId: string
    originOrganizationId: string
    introMessage: string | null
    clientRequestId: string
  }): Promise<SendConnectionRequestResult>
  respondToRequest(input: {
    requestId: string
    decision: 'accept' | 'decline'
  }): Promise<RespondToConnectionRequestResult>
  disconnect(otherUserId: string): Promise<DisconnectResult>
}
