import type { ConversationRepository, SendMessageResult } from './contracts'

export async function sendMessage(
  input: { conversationId: string; body: string; clientNonce: string },
  repository: Pick<ConversationRepository, 'send'>,
): Promise<SendMessageResult> {
  if (
    input.clientNonce.length === 0 ||
    input.body.trim().length === 0 ||
    input.body.length > 10_000
  ) {
    return { status: 'invalid_message' }
  }
  return repository.send(input)
}
