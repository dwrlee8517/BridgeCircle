import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'
import type {
  MessageConversationSummary,
  MessagesCounts,
  MessagesRepository,
  MessagesWaitingItem,
} from '@/lib/messages/contracts'

const timestampSchema = z.string().refine((value) => Number.isFinite(Date.parse(value)))
const messageIdSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const conversationSummaryRowSchema = z
  .object({
    conversation_id: z.uuid(),
    conversation_kind: z.enum(['direct', 'ask']),
    organization_id: z.uuid().nullable(),
    ask_id: z.uuid().nullable(),
    counterpart_user_id: z.uuid(),
    counterpart_display_name: z.string().min(1),
    counterpart_preferred_name: z.string().min(1).nullable(),
    counterpart_avatar_path: z.string().nullable(),
    counterpart_graduation_year: z.number().int().nullable(),
    is_connected: z.boolean(),
    can_send: z.boolean(),
    read_only_reason: z
      .enum(['account_unavailable', 'connection_required', 'ask_unavailable', 'not_available'])
      .nullable(),
    ask_question: z.string().min(1).nullable(),
    ask_status: z.enum(['accepted', 'resolved']).nullable(),
    latest_message_id: messageIdSchema.nullable(),
    latest_message_kind: z.enum(['user', 'system']).nullable(),
    latest_sender_user_id: z.uuid().nullable(),
    latest_body: z.string().min(1).max(10_000).nullable(),
    latest_created_at: timestampSchema.nullable(),
    unread_count: z.number().int().nonnegative(),
    needs_reply: z.boolean(),
    priority_tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    activity_at: timestampSchema,
  })
  .strict()

const waitingRowSchema = z
  .object({
    item_kind: z.enum(['direct_ask', 'connection_request']),
    item_id: z.uuid(),
    organization_id: z.uuid(),
    counterpart_user_id: z.uuid(),
    counterpart_display_name: z.string().min(1),
    counterpart_preferred_name: z.string().min(1).nullable(),
    counterpart_avatar_path: z.string().nullable(),
    counterpart_graduation_year: z.number().int().nullable(),
    question: z.string().min(1).nullable(),
    message: z.string().min(1).nullable(),
    created_at: timestampSchema,
  })
  .strict()

const countsRowSchema = z
  .object({
    all_count: z.number().int().nonnegative(),
    unread_count: z.number().int().nonnegative(),
    my_circle_count: z.number().int().nonnegative(),
    open_asks_count: z.number().int().nonnegative(),
    waiting_count: z.number().int().nonnegative(),
  })
  .strict()

function contractError(operation: string, detail: string): never {
  throw new Error(`Messages ${operation} contract violated: ${detail}`)
}

function transportError(operation: string, error: { code?: string } | null): never {
  const code = error?.code ? ` (${error.code})` : ''
  throw new Error(`Messages ${operation} transport failed${code}`)
}

function counterpart(row: {
  counterpart_user_id: string
  counterpart_display_name: string
  counterpart_preferred_name: string | null
  counterpart_avatar_path: string | null
  counterpart_graduation_year: number | null
}) {
  return {
    userId: row.counterpart_user_id,
    displayName: row.counterpart_display_name,
    preferredName: row.counterpart_preferred_name,
    avatarPath: row.counterpart_avatar_path,
    graduationYear: row.counterpart_graduation_year,
  }
}

export function parseConversationSummaryRow(row: unknown): MessageConversationSummary {
  const parsed = conversationSummaryRowSchema.parse(row)
  const latestFields = [
    parsed.latest_message_id,
    parsed.latest_message_kind,
    parsed.latest_body,
    parsed.latest_created_at,
  ]
  const hasLatest = latestFields.every((value) => value !== null)
  if (!hasLatest && latestFields.some((value) => value !== null)) {
    return contractError('summary', 'partial latest message')
  }
  if (!hasLatest && parsed.latest_sender_user_id) {
    return contractError('summary', 'sender without latest message')
  }
  if (parsed.latest_message_kind === 'user' && !parsed.latest_sender_user_id) {
    return contractError('summary', 'user preview without sender')
  }
  if (parsed.latest_message_kind === 'system' && parsed.latest_sender_user_id) {
    return contractError('summary', 'system preview with sender')
  }
  if (parsed.conversation_kind === 'ask') {
    if (!parsed.organization_id || !parsed.ask_id || !parsed.ask_question || !parsed.ask_status) {
      return contractError('summary', 'Ask conversation without Ask context')
    }
  } else if (parsed.organization_id || parsed.ask_id || parsed.ask_question || parsed.ask_status) {
    return contractError('summary', 'direct conversation with Ask context')
  }
  if (parsed.can_send !== (parsed.read_only_reason === null)) {
    return contractError('summary', 'send permission and reason disagree')
  }
  const expectedPriority = parsed.needs_reply ? 1 : parsed.can_send ? 2 : 3
  if (parsed.priority_tier !== expectedPriority) {
    return contractError('summary', 'attention and priority disagree')
  }
  if (
    parsed.needs_reply &&
    (parsed.unread_count < 1 ||
      parsed.latest_message_kind !== 'user' ||
      parsed.latest_sender_user_id !== parsed.counterpart_user_id)
  ) {
    return contractError('summary', 'needs-reply row lacks counterpart unread message')
  }
  if (!hasLatest && (parsed.unread_count > 0 || parsed.needs_reply)) {
    return contractError('summary', 'empty conversation has attention')
  }

  return {
    conversationId: parsed.conversation_id,
    kind: parsed.conversation_kind,
    organizationId: parsed.organization_id,
    askId: parsed.ask_id,
    counterpart: counterpart(parsed),
    isConnected: parsed.is_connected,
    canSend: parsed.can_send,
    readOnlyReason: parsed.read_only_reason,
    askQuestion: parsed.ask_question,
    askStatus: parsed.ask_status,
    latestMessage: hasLatest
      ? {
          id: parsed.latest_message_id as number,
          kind: parsed.latest_message_kind as 'user' | 'system',
          senderUserId: parsed.latest_sender_user_id,
          body: parsed.latest_body as string,
          createdAt: parsed.latest_created_at as string,
        }
      : null,
    unreadCount: parsed.unread_count,
    needsReply: parsed.needs_reply,
    priority: parsed.priority_tier,
    activityAt: parsed.activity_at,
  }
}

export function parseMessagesWaitingRow(row: unknown): MessagesWaitingItem {
  const parsed = waitingRowSchema.parse(row)
  const base = {
    organizationId: parsed.organization_id,
    counterpart: counterpart(parsed),
    createdAt: parsed.created_at,
  }
  if (parsed.item_kind === 'direct_ask') {
    if (!parsed.question || !parsed.message) {
      return contractError('waiting', 'direct Ask without request content')
    }
    return {
      ...base,
      kind: 'direct_ask',
      askId: parsed.item_id,
      question: parsed.question,
      requestMessage: parsed.message,
    }
  }
  if (parsed.question) return contractError('waiting', 'Connection request with Ask question')
  return {
    ...base,
    kind: 'connection_request',
    requestId: parsed.item_id,
    introMessage: parsed.message,
  }
}

export function parseMessagesCountsRow(row: unknown): MessagesCounts {
  const parsed = countsRowSchema.parse(row)
  if (
    parsed.unread_count > parsed.all_count ||
    parsed.my_circle_count > parsed.all_count ||
    parsed.open_asks_count > parsed.all_count
  ) {
    return contractError('counts', 'filter count exceeds all conversations')
  }
  return {
    all: parsed.all_count,
    unread: parsed.unread_count,
    myCircle: parsed.my_circle_count,
    openAsks: parsed.open_asks_count,
    waiting: parsed.waiting_count,
    attention: parsed.unread_count + parsed.waiting_count,
  }
}

export function createMessagesRepository(
  memberClient: SupabaseClient<Database>,
): MessagesRepository {
  return {
    async listConversations(input) {
      const cursorArgs = input.cursor
        ? {
            p_before_priority: input.cursor.priority,
            p_before_activity_at: input.cursor.activityAt,
            p_before_conversation_id: input.cursor.conversationId,
          }
        : {}
      const { data, error } = await memberClient.schema('api').rpc('list_conversation_summaries', {
        p_filter: input.filter,
        ...(input.query ? { p_query: input.query } : {}),
        ...cursorArgs,
        p_limit: input.limit,
      })
      if (error) transportError('listConversations', error)
      return z.array(z.unknown()).parse(data).map(parseConversationSummaryRow)
    },

    async listWaiting() {
      const { data, error } = await memberClient.schema('api').rpc('list_messages_waiting')
      if (error) transportError('listWaiting', error)
      return z.array(z.unknown()).parse(data).map(parseMessagesWaitingRow)
    },

    async getCounts() {
      const { data, error } = await memberClient.schema('api').rpc('get_messages_counts').single()
      if (error) transportError('getCounts', error)
      return parseMessagesCountsRow(data)
    },
  }
}
