import type {
  ConnectionsRepository,
  DisconnectResult,
  RespondToConnectionRequestResult,
  SendConnectionRequestResult,
} from './contracts'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function sendConnectionRequest(
  input: {
    recipientUserId: string
    originOrganizationId: string
    introMessage: string | null
    clientRequestId: string
  },
  repository: Pick<ConnectionsRepository, 'sendRequest'>,
): Promise<SendConnectionRequestResult> {
  const introMessage = input.introMessage?.trim() || null
  if (
    !UUID_PATTERN.test(input.recipientUserId) ||
    !UUID_PATTERN.test(input.originOrganizationId) ||
    !UUID_PATTERN.test(input.clientRequestId) ||
    (introMessage?.length ?? 0) > 2_000
  ) {
    return { status: 'invalid_input' }
  }
  return repository.sendRequest({ ...input, introMessage })
}

export async function respondToConnectionRequest(
  input: { requestId: string; decision: 'accept' | 'decline' },
  repository: Pick<ConnectionsRepository, 'respondToRequest'>,
): Promise<RespondToConnectionRequestResult> {
  if (!UUID_PATTERN.test(input.requestId) || !['accept', 'decline'].includes(input.decision)) {
    return { status: 'invalid_input' }
  }
  return repository.respondToRequest(input)
}

export async function disconnectMember(
  otherUserId: string,
  repository: Pick<ConnectionsRepository, 'disconnect'>,
): Promise<DisconnectResult> {
  if (!UUID_PATTERN.test(otherUserId)) return { status: 'not_available' }
  return repository.disconnect(otherUserId)
}
