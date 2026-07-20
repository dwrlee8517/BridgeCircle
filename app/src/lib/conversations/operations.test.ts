import { describe, expect, it, vi } from 'vitest'
import { getOrCreateDirect } from './getOrCreateDirect'
import { markRead } from './markRead'
import { publishTyping } from './publishTyping'
import { sendMessage } from './sendMessage'

const conversationId = '50000000-0000-4000-8000-000000000001'
const userId = '10000000-0000-4000-8000-000000000004'
const clientNonce = '90000000-0000-4000-8000-000000000001'
const timestamp = '2026-07-14T23:00:00.000Z'

describe('conversation operations', () => {
  it('preserves ready and expected direct-creation denial results', async () => {
    const ready = vi.fn(async () => ({ status: 'ready' as const, conversationId }))
    await expect(getOrCreateDirect(userId, { getOrCreateDirect: ready })).resolves.toEqual({
      status: 'ready',
      conversationId,
    })

    const denied = vi.fn(async () => ({ status: 'connection_required' as const }))
    await expect(getOrCreateDirect(userId, { getOrCreateDirect: denied })).resolves.toEqual({
      status: 'connection_required',
    })
  })

  it('treats a duplicate send as the same durable success and validates locally', async () => {
    const duplicate = vi.fn(async () => ({
      status: 'duplicate' as const,
      messageId: 41,
      createdAt: timestamp,
    }))
    await expect(
      sendMessage({ conversationId, body: 'Hello', clientNonce }, { send: duplicate }),
    ).resolves.toEqual({ status: 'duplicate', messageId: 41, createdAt: timestamp })

    const shouldNotRun = vi.fn()
    await expect(
      sendMessage({ conversationId, body: '   ', clientNonce }, { send: shouldNotRun }),
    ).resolves.toEqual({ status: 'invalid_message' })
    expect(shouldNotRun).not.toHaveBeenCalled()
  })

  it('preserves monotonic-read and non-fatal typing outcomes', async () => {
    const unchanged = vi.fn(async () => ({
      status: 'unchanged' as const,
      lastReadMessageId: 41,
      lastReadAt: timestamp,
    }))
    await expect(
      markRead({ conversationId, messageId: 41 }, { markRead: unchanged }),
    ).resolves.toEqual({ status: 'unchanged', lastReadMessageId: 41, lastReadAt: timestamp })

    const throttled = vi.fn(async () => ({ status: 'throttled' as const, expiresAt: timestamp }))
    await expect(
      publishTyping({ conversationId, isTyping: true }, { publishTyping: throttled }),
    ).resolves.toEqual({ status: 'throttled', expiresAt: timestamp })
  })

  it('does not hide unexpected dependency failures', async () => {
    const failure = new Error('dependency failed')
    const send = vi.fn(async () => {
      throw failure
    })
    await expect(
      sendMessage({ conversationId, body: 'Hello', clientNonce }, { send }),
    ).rejects.toBe(failure)
  })
})
