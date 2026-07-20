import type { ConversationMessage, ConversationRepository } from './contracts'

function boundedLimit(limit: number): number {
  if (!Number.isFinite(limit)) return 50
  return Math.max(1, Math.min(Math.trunc(limit), 100))
}

export async function listMessagesBefore(
  input: { conversationId: string; beforeMessageId: number | null; limit?: number },
  repository: Pick<ConversationRepository, 'listBefore'>,
): Promise<ConversationMessage[]> {
  const newestFirst = await repository.listBefore({
    conversationId: input.conversationId,
    beforeMessageId: input.beforeMessageId,
    limit: boundedLimit(input.limit ?? 50),
  })
  return [...newestFirst].reverse()
}

export async function drainMessagesAfter(
  input: { conversationId: string; afterMessageId: number | null },
  repository: Pick<ConversationRepository, 'listAfter'>,
): Promise<ConversationMessage[]> {
  const messages: ConversationMessage[] = []
  const seen = new Set<number>()
  let cursor = input.afterMessageId

  while (true) {
    const pageStartCursor = cursor
    const page = await repository.listAfter({
      conversationId: input.conversationId,
      afterMessageId: cursor,
      limit: 100,
    })
    for (const message of page) {
      if (seen.has(message.id)) continue
      if (cursor !== null && message.id <= cursor) {
        throw new Error('Conversation gap query returned a non-increasing message cursor')
      }
      seen.add(message.id)
      messages.push(message)
      cursor = message.id
    }
    if (page.length < 100) return messages
    if (cursor === pageStartCursor) {
      throw new Error('Conversation gap query did not advance')
    }
  }
}
