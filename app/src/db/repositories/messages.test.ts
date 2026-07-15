import { describe, expect, it, vi } from 'vitest'
import {
  createMessagesRepository,
  parseConversationSummaryRow,
  parseMessagesCountsRow,
  parseMessagesWaitingRow,
} from './messages'

const conversationId = '50000000-0000-4000-8000-000000000001'
const userId = '10000000-0000-4000-8000-000000000002'
const organizationId = '20000000-0000-4000-8000-000000000001'
const timestamp = '2026-07-15T12:00:00.000Z'

function summaryRow() {
  return {
    conversation_id: conversationId,
    conversation_kind: 'direct',
    organization_id: null,
    ask_id: null,
    counterpart_user_id: userId,
    counterpart_display_name: 'Maya Chen',
    counterpart_preferred_name: 'Maya',
    counterpart_avatar_path: null,
    counterpart_graduation_year: 2018,
    is_connected: true,
    can_send: true,
    read_only_reason: null,
    ask_question: null,
    ask_status: null,
    latest_message_id: 42,
    latest_message_kind: 'user',
    latest_sender_user_id: userId,
    latest_body: 'Hello',
    latest_created_at: timestamp,
    unread_count: 1,
    needs_reply: true,
    priority_tier: 1,
    activity_at: timestamp,
  }
}

describe('Messages repository projections', () => {
  it('strictly maps a complete conversation summary', () => {
    expect(parseConversationSummaryRow(summaryRow())).toMatchObject({
      conversationId,
      kind: 'direct',
      latestMessage: { id: 42, body: 'Hello', senderUserId: userId },
      unreadCount: 1,
      priority: 1,
    })
  })

  it('rejects partial previews and impossible cross-kind data', () => {
    expect(() => parseConversationSummaryRow({ ...summaryRow(), latest_body: null })).toThrow(
      'partial latest message',
    )
    expect(() => parseConversationSummaryRow({ ...summaryRow(), ask_status: 'accepted' })).toThrow(
      'direct conversation with Ask context',
    )
    expect(() => parseConversationSummaryRow({ ...summaryRow(), extra: true })).toThrow()
  })

  it('maps the Waiting discriminant and canonical attention count', () => {
    expect(
      parseMessagesWaitingRow({
        item_kind: 'direct_ask',
        item_id: conversationId,
        organization_id: organizationId,
        counterpart_user_id: userId,
        counterpart_display_name: 'Maya Chen',
        counterpart_preferred_name: 'Maya',
        counterpart_avatar_path: null,
        counterpart_graduation_year: 2018,
        question: 'Could you advise me?',
        message: 'I value your perspective.',
        created_at: timestamp,
      }),
    ).toMatchObject({ kind: 'direct_ask', askId: conversationId })
    expect(
      parseMessagesCountsRow({
        all_count: 7,
        unread_count: 2,
        my_circle_count: 3,
        open_asks_count: 1,
        waiting_count: 4,
      }),
    ).toEqual({ all: 7, unread: 2, myCircle: 3, openAsks: 1, waiting: 4, attention: 6 })
  })
})

describe('Messages repository RPC boundary', () => {
  it('uses only the fixed summary function with exact keyset arguments', async () => {
    const rpc = vi.fn(async () => ({ data: [], error: null }))
    const client = { schema: vi.fn(() => ({ rpc })) }
    const repository = createMessagesRepository(client as never)
    await repository.listConversations({
      filter: 'unread',
      query: 'Maya',
      cursor: { priority: 1, activityAt: timestamp, conversationId },
      limit: 20,
    })
    expect(client.schema).toHaveBeenCalledWith('api')
    expect(rpc).toHaveBeenCalledWith('list_conversation_summaries', {
      p_filter: 'unread',
      p_query: 'Maya',
      p_before_priority: 1,
      p_before_activity_at: timestamp,
      p_before_conversation_id: conversationId,
      p_limit: 20,
    })
  })

  it('uses the fixed Waiting and counts functions without arguments', async () => {
    const waitingRpc = vi.fn(async () => ({ data: [], error: null }))
    const waitingClient = { schema: vi.fn(() => ({ rpc: waitingRpc })) }
    await createMessagesRepository(waitingClient as never).listWaiting()
    expect(waitingRpc).toHaveBeenCalledWith('list_messages_waiting')

    const single = vi.fn(async () => ({
      data: {
        all_count: 0,
        unread_count: 0,
        my_circle_count: 0,
        open_asks_count: 0,
        waiting_count: 0,
      },
      error: null,
    }))
    const countsRpc = vi.fn(() => ({ single }))
    const countsClient = { schema: vi.fn(() => ({ rpc: countsRpc })) }
    await createMessagesRepository(countsClient as never).getCounts()
    expect(countsRpc).toHaveBeenCalledWith('get_messages_counts')
    expect(single).toHaveBeenCalledOnce()
  })
})
