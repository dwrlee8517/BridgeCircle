import type { ConversationRepository, MarkReadResult } from './contracts'

export async function markRead(
  input: { conversationId: string; messageId: number },
  repository: Pick<ConversationRepository, 'markRead'>,
): Promise<MarkReadResult> {
  if (!Number.isSafeInteger(input.messageId) || input.messageId <= 0) {
    return { status: 'invalid_cursor' }
  }
  return repository.markRead(input)
}
