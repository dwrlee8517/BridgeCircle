import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'
import type {
  ConversationDetail,
  ConversationMessage,
  ConversationRepository,
  GetOrCreateDirectResult,
  MarkReadResult,
  PublishTypingResult,
  SendMessageResult,
} from '@/lib/conversations/contracts'

const timestampSchema = z.string().refine((value) => Number.isFinite(Date.parse(value)))
const messageIdSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)

const conversationDetailRowSchema = z
  .object({
    conversation_id: z.uuid(),
    kind: z.enum(['direct', 'ask']),
    organization_id: z.uuid().nullable(),
    ask_id: z.uuid().nullable(),
    created_at: timestampSchema,
    last_message_at: timestampSchema.nullable(),
    counterpart_user_id: z.uuid(),
    counterpart_display_name: z.string().min(1),
    counterpart_avatar_path: z.string().nullable(),
    counterpart_graduation_year: z.number().int().nullable(),
    can_send: z.boolean(),
    viewer_last_read_message_id: messageIdSchema.nullable(),
    viewer_last_read_at: timestampSchema.nullable(),
    counterpart_last_read_message_id: messageIdSchema.nullable(),
    counterpart_last_read_at: timestampSchema.nullable(),
    latest_message_id: messageIdSchema.nullable(),
  })
  .strict()

const conversationMessageRowSchema = z
  .object({
    id: messageIdSchema,
    conversation_id: z.uuid(),
    sender_user_id: z.uuid().nullable(),
    kind: z.enum(['user', 'system']),
    body: z.string().min(1).max(10_000),
    system_event_type: z.enum(['connection_accepted', 'ask_accepted', 'ask_resolved']).nullable(),
    system_actor_user_id: z.uuid().nullable(),
    created_at: timestampSchema,
  })
  .strict()

const getOrCreateRowSchema = z
  .object({
    result_code: z.enum(['ready', 'connection_required', 'not_available']),
    conversation_id: z.uuid().nullable(),
  })
  .strict()

const sendRowSchema = z
  .object({
    result_code: z.enum([
      'sent',
      'duplicate',
      'connection_required',
      'invalid_message',
      'not_available',
    ]),
    message_id: messageIdSchema.nullable(),
    created_at: timestampSchema.nullable(),
  })
  .strict()

const markReadRowSchema = z
  .object({
    result_code: z.enum(['advanced', 'unchanged', 'invalid_cursor', 'not_available']),
    last_read_message_id: messageIdSchema.nullable(),
    last_read_at: timestampSchema.nullable(),
  })
  .strict()

const typingRowSchema = z
  .object({
    result_code: z.enum(['published', 'throttled', 'not_available']),
    expires_at: timestampSchema.nullable(),
  })
  .strict()

function contractError(operation: string, detail: string): never {
  throw new Error(`Conversation ${operation} contract violated: ${detail}`)
}

function transportError(operation: string, error: { code?: string } | null): never {
  const code = error?.code ? ` (${error.code})` : ''
  throw new Error(`Conversation ${operation} transport failed${code}`)
}

export function parseConversationDetailRow(row: unknown): ConversationDetail {
  const parsed = conversationDetailRowSchema.parse(row)
  return {
    id: parsed.conversation_id,
    kind: parsed.kind,
    organizationId: parsed.organization_id,
    askId: parsed.ask_id,
    createdAt: parsed.created_at,
    lastMessageAt: parsed.last_message_at,
    counterpart: {
      userId: parsed.counterpart_user_id,
      displayName: parsed.counterpart_display_name,
      avatarPath: parsed.counterpart_avatar_path,
      graduationYear: parsed.counterpart_graduation_year,
    },
    canSend: parsed.can_send,
    viewerLastReadMessageId: parsed.viewer_last_read_message_id,
    viewerLastReadAt: parsed.viewer_last_read_at,
    counterpartLastReadMessageId: parsed.counterpart_last_read_message_id,
    counterpartLastReadAt: parsed.counterpart_last_read_at,
    latestMessageId: parsed.latest_message_id,
  }
}

export function parseConversationMessageRow(row: unknown): ConversationMessage {
  const parsed = conversationMessageRowSchema.parse(row)
  if (parsed.kind === 'user') {
    if (!parsed.sender_user_id || parsed.system_event_type || parsed.system_actor_user_id) {
      return contractError('message', 'user-message shape')
    }
    return {
      id: parsed.id,
      conversationId: parsed.conversation_id,
      kind: 'user',
      senderUserId: parsed.sender_user_id,
      body: parsed.body,
      createdAt: parsed.created_at,
    }
  }

  if (parsed.sender_user_id || !parsed.system_event_type) {
    return contractError('message', 'system-message shape')
  }
  return {
    id: parsed.id,
    conversationId: parsed.conversation_id,
    kind: 'system',
    eventType: parsed.system_event_type,
    actorUserId: parsed.system_actor_user_id,
    body: parsed.body,
    createdAt: parsed.created_at,
  }
}

export function parseGetOrCreateDirectRow(row: unknown): GetOrCreateDirectResult {
  const parsed = getOrCreateRowSchema.parse(row)
  if (parsed.result_code === 'ready') {
    if (!parsed.conversation_id) return contractError('getOrCreateDirect', 'ready without ID')
    return { status: 'ready', conversationId: parsed.conversation_id }
  }
  if (parsed.conversation_id) return contractError('getOrCreateDirect', 'denial included ID')
  return { status: parsed.result_code }
}

export function parseSendMessageRow(row: unknown): SendMessageResult {
  const parsed = sendRowSchema.parse(row)
  if (parsed.result_code === 'sent' || parsed.result_code === 'duplicate') {
    if (!parsed.message_id || !parsed.created_at) {
      return contractError('send', 'success without durable message fields')
    }
    return {
      status: parsed.result_code,
      messageId: parsed.message_id,
      createdAt: parsed.created_at,
    }
  }
  if (parsed.message_id || parsed.created_at)
    return contractError('send', 'denial included message')
  return { status: parsed.result_code }
}

export function parseMarkReadRow(row: unknown): MarkReadResult {
  const parsed = markReadRowSchema.parse(row)
  if (parsed.result_code === 'advanced' || parsed.result_code === 'unchanged') {
    if (!parsed.last_read_message_id || !parsed.last_read_at) {
      return contractError('markRead', 'success without cursor fields')
    }
    return {
      status: parsed.result_code,
      lastReadMessageId: parsed.last_read_message_id,
      lastReadAt: parsed.last_read_at,
    }
  }
  if (parsed.last_read_message_id || parsed.last_read_at) {
    return contractError('markRead', 'denial included cursor')
  }
  return { status: parsed.result_code }
}

export function parsePublishTypingRow(row: unknown): PublishTypingResult {
  const parsed = typingRowSchema.parse(row)
  if (parsed.result_code === 'published' || parsed.result_code === 'throttled') {
    if (!parsed.expires_at) return contractError('publishTyping', 'success without expiry')
    return { status: parsed.result_code, expiresAt: parsed.expires_at }
  }
  if (parsed.expires_at) return contractError('publishTyping', 'denial included expiry')
  return { status: 'not_available' }
}

export function createConversationRepository(
  memberClient: SupabaseClient<Database>,
): ConversationRepository {
  return {
    async getDetail(conversationId) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('get_conversation_detail', { p_conversation_id: conversationId })
        .maybeSingle()
      if (error) transportError('getDetail', error)
      return data ? parseConversationDetailRow(data) : null
    },

    async listBefore(input) {
      const args = {
        p_conversation_id: input.conversationId,
        p_limit: input.limit,
        ...(input.beforeMessageId === null ? {} : { p_before_id: input.beforeMessageId }),
      }
      const { data, error } = await memberClient
        .schema('api')
        .rpc('list_conversation_messages_before', args)
      if (error) transportError('listBefore', error)
      return z.array(z.unknown()).parse(data).map(parseConversationMessageRow)
    },

    async listAfter(input) {
      const args = {
        p_conversation_id: input.conversationId,
        p_limit: input.limit,
        ...(input.afterMessageId === null ? {} : { p_after_id: input.afterMessageId }),
      }
      const { data, error } = await memberClient
        .schema('api')
        .rpc('list_conversation_messages_after', args)
      if (error) transportError('listAfter', error)
      return z.array(z.unknown()).parse(data).map(parseConversationMessageRow)
    },

    async getOrCreateDirect(otherUserId) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('get_or_create_direct_conversation', { p_other_user_id: otherUserId })
        .single()
      if (error) transportError('getOrCreateDirect', error)
      return parseGetOrCreateDirectRow(data)
    },

    async send(input) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('send_message', {
          p_conversation_id: input.conversationId,
          p_body: input.body,
          p_client_nonce: input.clientNonce,
        })
        .single()
      if (error) transportError('send', error)
      return parseSendMessageRow(data)
    },

    async markRead(input) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('mark_conversation_read', {
          p_conversation_id: input.conversationId,
          p_message_id: input.messageId,
        })
        .single()
      if (error) transportError('markRead', error)
      return parseMarkReadRow(data)
    },

    async publishTyping(input) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('publish_conversation_typing', {
          p_conversation_id: input.conversationId,
          p_is_typing: input.isTyping,
        })
        .single()
      if (error) transportError('publishTyping', error)
      return parsePublishTypingRow(data)
    },
  }
}
