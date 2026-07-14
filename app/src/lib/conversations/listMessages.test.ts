import { describe, expect, it, vi } from 'vitest'
import type { ConversationMessage } from './contracts'
import { drainMessagesAfter, listMessagesBefore } from './listMessages'

const conversationId = '50000000-0000-4000-8000-000000000001'
const userId = '10000000-0000-4000-8000-000000000002'

function message(id: number): ConversationMessage {
  return {
    id,
    conversationId,
    kind: 'user',
    senderUserId: userId,
    body: `Message ${id}`,
    createdAt: '2026-07-14T23:00:00.000Z',
  }
}

describe('conversation message pagination', () => {
  it('clamps older-history pages and reverses them for chronological rendering', async () => {
    const listBefore = vi.fn(async () => [message(3), message(2), message(1)])
    await expect(
      listMessagesBefore({ conversationId, beforeMessageId: null, limit: 500 }, { listBefore }),
    ).resolves.toEqual([message(1), message(2), message(3)])
    expect(listBefore).toHaveBeenCalledWith({
      conversationId,
      beforeMessageId: null,
      limit: 100,
    })
  })

  it('drains more than 100 missed rows with ascending keyset pages', async () => {
    const rows = Array.from({ length: 205 }, (_, index) => message(index + 1))
    const listAfter = vi.fn(async (input: { afterMessageId: number | null; limit: number }) => {
      const start = input.afterMessageId ?? 0
      return rows.filter((row) => row.id > start).slice(0, input.limit)
    })

    const result = await drainMessagesAfter({ conversationId, afterMessageId: null }, { listAfter })
    expect(result).toHaveLength(205)
    expect(result[0]?.id).toBe(1)
    expect(result[204]?.id).toBe(205)
    expect(listAfter).toHaveBeenCalledTimes(3)
    expect(listAfter).toHaveBeenNthCalledWith(2, {
      conversationId,
      afterMessageId: 100,
      limit: 100,
    })
  })

  it('fails instead of looping when a dependency returns a non-increasing cursor', async () => {
    const listAfter = vi.fn(async () => Array.from({ length: 100 }, () => message(10)))
    await expect(
      drainMessagesAfter({ conversationId, afterMessageId: 10 }, { listAfter }),
    ).rejects.toThrow('non-increasing')
  })
})
