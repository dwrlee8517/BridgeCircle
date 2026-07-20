import type { ConversationRepository, PublishTypingResult } from './contracts'

export async function publishTyping(
  input: { conversationId: string; isTyping: boolean },
  repository: Pick<ConversationRepository, 'publishTyping'>,
): Promise<PublishTypingResult> {
  return repository.publishTyping(input)
}
