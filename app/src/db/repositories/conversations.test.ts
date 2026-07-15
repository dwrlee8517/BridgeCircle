import { describe, expect, it } from 'vitest'
import {
  parseConversationDetailRow,
  parseConversationMessageRow,
  parseGetOrCreateDirectRow,
  parseMarkReadRow,
  parsePublishTypingRow,
  parseSendMessageRow,
} from './conversations'

const conversationId = '50000000-0000-4000-8000-000000000001'
const userId = '10000000-0000-4000-8000-000000000002'
const otherUserId = '10000000-0000-4000-8000-000000000004'
const timestamp = '2026-07-14T23:00:00.000Z'

function detailRow() {
  return {
    conversation_id: conversationId,
    kind: 'direct',
    organization_id: null,
    ask_id: null,
    created_at: timestamp,
    last_message_at: timestamp,
    counterpart_user_id: otherUserId,
    counterpart_display_name: 'Mei Park',
    counterpart_avatar_path: null,
    counterpart_graduation_year: 2010,
    counterpart_preferred_name: 'Mei',
    counterpart_headline: 'Climate investor',
    counterpart_current_employer: 'Future Fund',
    counterpart_current_title: 'Partner',
    counterpart_open_to_help: true,
    is_connected: true,
    can_send: true,
    read_only_reason: null,
    connection_state: 'connected',
    pending_connection_request_id: null,
    ask_question: null,
    ask_status: null,
    ask_outcome_note: null,
    can_request_connection: false,
    viewer_last_read_message_id: 40,
    viewer_last_read_at: timestamp,
    counterpart_last_read_message_id: null,
    counterpart_last_read_at: null,
    latest_message_id: 41,
  }
}

describe('conversation repository projections', () => {
  it('maps the exact nullable conversation-detail projection', () => {
    expect(parseConversationDetailRow(detailRow())).toEqual({
      id: conversationId,
      kind: 'direct',
      organizationId: null,
      askId: null,
      createdAt: timestamp,
      lastMessageAt: timestamp,
      counterpart: {
        userId: otherUserId,
        displayName: 'Mei Park',
        preferredName: 'Mei',
        avatarPath: null,
        graduationYear: 2010,
        headline: 'Climate investor',
        currentEmployer: 'Future Fund',
        currentTitle: 'Partner',
        openToHelp: true,
      },
      isConnected: true,
      canSend: true,
      readOnlyReason: null,
      connectionState: 'connected',
      pendingConnectionRequestId: null,
      askContext: null,
      canRequestConnection: false,
      viewerLastReadMessageId: 40,
      viewerLastReadAt: timestamp,
      counterpartLastReadMessageId: null,
      counterpartLastReadAt: null,
      latestMessageId: 41,
    })
  })

  it('fails loudly on projection nullability or field drift', () => {
    expect(() =>
      parseConversationDetailRow({ ...detailRow(), counterpart_display_name: null }),
    ).toThrow()
    expect(() => parseConversationDetailRow({ ...detailRow(), unexpected: true })).toThrow()
  })

  it('maps user and structured system messages without transport-only fields', () => {
    expect(
      parseConversationMessageRow({
        id: 41,
        conversation_id: conversationId,
        sender_user_id: userId,
        kind: 'user',
        body: 'Hello',
        system_event_type: null,
        system_actor_user_id: null,
        created_at: timestamp,
      }),
    ).toEqual({
      id: 41,
      conversationId,
      senderUserId: userId,
      kind: 'user',
      body: 'Hello',
      createdAt: timestamp,
    })
    expect(
      parseConversationMessageRow({
        id: 42,
        conversation_id: conversationId,
        sender_user_id: null,
        kind: 'system',
        body: 'Connection accepted.',
        system_event_type: 'connection_accepted',
        system_actor_user_id: userId,
        created_at: timestamp,
      }),
    ).toEqual({
      id: 42,
      conversationId,
      kind: 'system',
      eventType: 'connection_accepted',
      actorUserId: userId,
      body: 'Connection accepted.',
      createdAt: timestamp,
    })
  })

  it('rejects impossible user/system message combinations', () => {
    expect(() =>
      parseConversationMessageRow({
        id: 41,
        conversation_id: conversationId,
        sender_user_id: null,
        kind: 'user',
        body: 'Impossible',
        system_event_type: null,
        system_actor_user_id: null,
        created_at: timestamp,
      }),
    ).toThrow('user-message shape')
  })
})

describe('conversation repository command mappings', () => {
  it('maps direct creation outcomes and rejects malformed success', () => {
    expect(
      parseGetOrCreateDirectRow({ result_code: 'ready', conversation_id: conversationId }),
    ).toEqual({ status: 'ready', conversationId })
    expect(
      parseGetOrCreateDirectRow({ result_code: 'connection_required', conversation_id: null }),
    ).toEqual({ status: 'connection_required' })
    expect(() =>
      parseGetOrCreateDirectRow({ result_code: 'ready', conversation_id: null }),
    ).toThrow('ready without ID')
  })

  it('maps sent, duplicate, and expected send denials', () => {
    expect(
      parseSendMessageRow({ result_code: 'sent', message_id: 41, created_at: timestamp }),
    ).toEqual({ status: 'sent', messageId: 41, createdAt: timestamp })
    expect(
      parseSendMessageRow({ result_code: 'duplicate', message_id: 41, created_at: timestamp }),
    ).toEqual({ status: 'duplicate', messageId: 41, createdAt: timestamp })
    expect(
      parseSendMessageRow({
        result_code: 'connection_required',
        message_id: null,
        created_at: null,
      }),
    ).toEqual({ status: 'connection_required' })
  })

  it('maps monotonic read and typing results', () => {
    expect(
      parseMarkReadRow({
        result_code: 'unchanged',
        last_read_message_id: 41,
        last_read_at: timestamp,
      }),
    ).toEqual({ status: 'unchanged', lastReadMessageId: 41, lastReadAt: timestamp })
    expect(parsePublishTypingRow({ result_code: 'throttled', expires_at: timestamp })).toEqual({
      status: 'throttled',
      expiresAt: timestamp,
    })
    expect(parsePublishTypingRow({ result_code: 'not_available', expires_at: null })).toEqual({
      status: 'not_available',
    })
  })

  it('throws on unknown result codes and inconsistent denial rows', () => {
    expect(() =>
      parseSendMessageRow({ result_code: 'maybe', message_id: null, created_at: null }),
    ).toThrow()
    expect(() =>
      parseMarkReadRow({
        result_code: 'not_available',
        last_read_message_id: 41,
        last_read_at: timestamp,
      }),
    ).toThrow('denial included cursor')
  })
})
