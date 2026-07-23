import type { ConversationDetail, ConversationRepository } from './contracts'

export async function getConversation(
  conversationId: string,
  repository: Pick<ConversationRepository, 'getDetail'>,
): Promise<ConversationDetail | null> {
  return repository.getDetail(conversationId)
}
