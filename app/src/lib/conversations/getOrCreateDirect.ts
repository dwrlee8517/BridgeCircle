import type { ConversationRepository, GetOrCreateDirectResult } from './contracts'

export async function getOrCreateDirect(
  otherUserId: string,
  repository: Pick<ConversationRepository, 'getOrCreateDirect'>,
): Promise<GetOrCreateDirectResult> {
  return repository.getOrCreateDirect(otherUserId)
}
