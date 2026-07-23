import { describe, expect, it, vi } from 'vitest'
import type { MessageConversationSummary } from './contracts'
import {
  listMessageConversations,
  loadMessagesOverview,
  mergeConversationPages,
} from './operations'

const conversationId = '50000000-0000-4000-8000-000000000001'
const otherConversationId = '50000000-0000-4000-8000-000000000002'
const timestamp = '2026-07-15T12:00:00.000Z'

function summary(
  id: string,
  priority: 1 | 2 | 3,
  activityAt = timestamp,
): MessageConversationSummary {
  return {
    conversationId: id,
    kind: 'direct',
    organizationId: null,
    askId: null,
    counterpart: {
      userId: '10000000-0000-4000-8000-000000000002',
      displayName: 'Maya Chen',
      preferredName: 'Maya',
      avatarPath: null,
      graduationYear: 2018,
    },
    isConnected: true,
    canSend: true,
    readOnlyReason: null,
    askQuestion: null,
    askStatus: null,
    latestMessage: null,
    unreadCount: 0,
    needsReply: false,
    priority,
    activityAt,
  }
}

describe('Messages list operations', () => {
  it('normalizes bounded input and emits a complete keyset cursor', async () => {
    const items = [summary(conversationId, 1)]
    const listConversations = vi.fn(async () => items)
    await expect(
      listMessageConversations(
        { filter: 'unread', query: '  Maya  ', limit: 1 },
        { listConversations },
      ),
    ).resolves.toEqual({
      status: 'ok',
      page: {
        items,
        nextCursor: { priority: 1, activityAt: timestamp, conversationId },
      },
    })
    expect(listConversations).toHaveBeenCalledWith({
      filter: 'unread',
      query: 'Maya',
      cursor: null,
      limit: 1,
    })
  })

  it('rejects malformed limits and cursors without repository I/O', async () => {
    const listConversations = vi.fn()
    await expect(listMessageConversations({ limit: 51 }, { listConversations })).resolves.toEqual({
      status: 'invalid_input',
    })
    await expect(
      listMessageConversations(
        {
          cursor: { priority: 2, activityAt: 'not-a-date', conversationId },
        },
        { listConversations },
      ),
    ).resolves.toEqual({ status: 'invalid_input' })
    expect(listConversations).not.toHaveBeenCalled()
  })

  it('merges by ID and restores canonical priority/activity/ID order', () => {
    const older = summary(conversationId, 2, '2026-07-14T12:00:00.000Z')
    const refreshed = summary(conversationId, 1, timestamp)
    const tied = summary(otherConversationId, 1, timestamp)
    expect(mergeConversationPages([older], [refreshed, tied])).toEqual([tied, refreshed])
  })

  it('loads independent overview reads in parallel', async () => {
    let waitingResolved = false
    const listWaiting = vi.fn(async () => {
      await Promise.resolve()
      waitingResolved = true
      return []
    })
    const getCounts = vi.fn(async () => {
      expect(waitingResolved).toBe(false)
      return { all: 0, unread: 0, myCircle: 0, openAsks: 0, waiting: 0, attention: 0 }
    })
    await expect(loadMessagesOverview({ listWaiting, getCounts })).resolves.toEqual({
      waiting: [],
      counts: { all: 0, unread: 0, myCircle: 0, openAsks: 0, waiting: 0, attention: 0 },
    })
  })
})
