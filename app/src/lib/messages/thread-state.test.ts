import { describe, expect, it } from 'vitest'
import type { ConversationMessage } from '@/lib/conversations/contracts'
import {
  beginSendAttempt,
  confirmSendAttempt,
  conversationReconnectDelayMs,
  discardSendAttempt,
  EMPTY_THREAD_COMPOSER,
  markSendUncertain,
  newestOutgoingReceiptId,
  readCandidate,
  rejectSendAttempt,
  restoreThreadComposer,
  serializeThreadComposer,
} from './thread-state'

const viewerUserId = '10000000-0000-4000-8000-000000000002'
const otherUserId = '10000000-0000-4000-8000-000000000004'
const nonce = '90000000-0000-4000-8000-000000000001'

function userMessage(id: number, senderUserId: string): ConversationMessage {
  return {
    id,
    conversationId: '50000000-0000-4000-8000-000000000001',
    kind: 'user',
    senderUserId,
    body: `Message ${id}`,
    createdAt: '2026-07-15T12:00:00.000Z',
  }
}

describe('Messages thread state', () => {
  it('recovers a durable draft without inventing a pending send', () => {
    const serialized = serializeThreadComposer({ draft: '  hello  ', pending: null })
    expect(restoreThreadComposer(serialized)).toEqual({ draft: '  hello  ', pending: null })
    expect(restoreThreadComposer('{broken')).toEqual(EMPTY_THREAD_COMPOSER)
  })

  it('retries an uncertain send with the same normalized body and nonce', () => {
    const first = beginSendAttempt({ draft: '  hello  ', pending: null }, () => nonce)
    expect(first?.attempt).toEqual({ body: 'hello', nonce, status: 'sending' })
    const uncertain = markSendUncertain(first?.state ?? EMPTY_THREAD_COMPOSER)
    const restored = restoreThreadComposer(serializeThreadComposer(uncertain))
    const retry = beginSendAttempt(restored, () => crypto.randomUUID())
    expect(retry?.attempt).toEqual({ body: 'hello', nonce, status: 'sending' })
  })

  it('preserves the body after a rejection or deliberate discard and clears on confirmation', () => {
    const sending = beginSendAttempt({ draft: 'hello', pending: null }, () => nonce)?.state
    expect(rejectSendAttempt(sending ?? EMPTY_THREAD_COMPOSER)).toEqual({
      draft: 'hello',
      pending: null,
    })
    expect(discardSendAttempt(markSendUncertain(sending ?? EMPTY_THREAD_COMPOSER))).toEqual({
      draft: 'hello',
      pending: null,
    })
    expect(confirmSendAttempt()).toEqual(EMPTY_THREAD_COMPOSER)
  })

  it('requires a visible end and a newest counterpart message before advancing read state', () => {
    const messages = [userMessage(1, viewerUserId), userMessage(2, otherUserId)]
    expect(
      readCandidate({
        messages,
        viewerUserId,
        currentReadMessageId: 1,
        documentVisible: true,
        endVisible: true,
      }),
    ).toBe(2)
    expect(
      readCandidate({
        messages,
        viewerUserId,
        currentReadMessageId: 1,
        documentVisible: false,
        endVisible: true,
      }),
    ).toBeNull()
    expect(
      readCandidate({
        messages,
        viewerUserId,
        currentReadMessageId: 1,
        documentVisible: true,
        endVisible: false,
      }),
    ).toBeNull()
    expect(
      readCandidate({
        messages: [...messages, userMessage(3, viewerUserId)],
        viewerUserId,
        currentReadMessageId: 1,
        documentVisible: true,
        endVisible: true,
      }),
    ).toBeNull()
  })

  it('shows a receipt only on the newest outgoing message and caps reconnect backoff', () => {
    expect(
      newestOutgoingReceiptId(
        [userMessage(1, viewerUserId), userMessage(2, viewerUserId), userMessage(3, otherUserId)],
        viewerUserId,
      ),
    ).toBe(2)
    expect([-2, 0, 1, 2, 3, 4, 99].map(conversationReconnectDelayMs)).toEqual([
      1_000, 1_000, 2_000, 5_000, 10_000, 30_000, 30_000,
    ])
  })
})
