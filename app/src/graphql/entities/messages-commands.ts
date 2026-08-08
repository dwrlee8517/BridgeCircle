import { createConversationRepository } from '@/db/repositories/conversations'
import type {
  GetOrCreateDirectResult,
  MarkReadResult,
  PublishTypingResult,
  SendMessageResult,
} from '@/lib/conversations/contracts'
import { builder } from '../builder'

/**
 * Messages commands — the write half of conversations, delegating to
 * `db/repositories/conversations` (get_or_create_direct_conversation /
 * send_message / mark_conversation_read / publish_conversation_typing).
 *
 * Follows the Help-commands conventions: v2's status vocabularies are exposed
 * verbatim (uppercased) per command — `DUPLICATE` on a replayed clientNonce,
 * `RATE_LIMITED`, `THROTTLED`, `ALREADY`-style outcomes are contract, not
 * errors. `sendMessage.clientNonce` is a required client-supplied idempotency
 * key. Unauthenticated calls map to each command's own NOT_AVAILABLE terminal.
 */

const StartConversationStatus = builder.enumType('StartConversationStatus', {
  values: ['READY', 'CONNECTION_REQUIRED', 'NOT_AVAILABLE'] as const,
})

const SendMessageStatus = builder.enumType('SendMessageStatus', {
  values: [
    'SENT',
    'DUPLICATE',
    'CONNECTION_REQUIRED',
    'INVALID_MESSAGE',
    'RATE_LIMITED',
    'NOT_AVAILABLE',
  ] as const,
})

const MarkReadStatus = builder.enumType('MarkReadStatus', {
  values: ['ADVANCED', 'UNCHANGED', 'INVALID_CURSOR', 'NOT_AVAILABLE'] as const,
})

const PublishTypingStatus = builder.enumType('PublishTypingStatus', {
  values: ['PUBLISHED', 'THROTTLED', 'NOT_AVAILABLE'] as const,
})

const upper = <T extends string>(v: T) => v.toUpperCase() as Uppercase<T>

const StartConversationPayload = builder.objectRef<GetOrCreateDirectResult>(
  'StartConversationPayload',
)
StartConversationPayload.implement({
  fields: (t) => ({
    status: t.field({
      type: StartConversationStatus,
      nullable: false,
      resolve: (r) => upper(r.status),
    }),
    conversationId: t.id({
      nullable: true,
      resolve: (r) => (r.status === 'ready' ? r.conversationId : null),
    }),
  }),
})

const SendMessagePayload = builder.objectRef<SendMessageResult>('SendMessagePayload')
SendMessagePayload.implement({
  fields: (t) => ({
    status: t.field({ type: SendMessageStatus, nullable: false, resolve: (r) => upper(r.status) }),
    // Set for SENT and DUPLICATE — a replayed nonce returns the original row.
    messageId: t.int({
      nullable: true,
      resolve: (r) => (r.status === 'sent' || r.status === 'duplicate' ? r.messageId : null),
    }),
    createdAt: t.string({
      nullable: true,
      resolve: (r) => (r.status === 'sent' || r.status === 'duplicate' ? r.createdAt : null),
    }),
  }),
})

const MarkReadPayload = builder.objectRef<MarkReadResult>('MarkReadPayload')
MarkReadPayload.implement({
  fields: (t) => ({
    status: t.field({ type: MarkReadStatus, nullable: false, resolve: (r) => upper(r.status) }),
    lastReadMessageId: t.int({
      nullable: true,
      resolve: (r) =>
        r.status === 'advanced' || r.status === 'unchanged' ? r.lastReadMessageId : null,
    }),
    lastReadAt: t.string({
      nullable: true,
      resolve: (r) => (r.status === 'advanced' || r.status === 'unchanged' ? r.lastReadAt : null),
    }),
  }),
})

const PublishTypingPayload = builder.objectRef<PublishTypingResult>('PublishTypingPayload')
PublishTypingPayload.implement({
  fields: (t) => ({
    status: t.field({
      type: PublishTypingStatus,
      nullable: false,
      resolve: (r) => upper(r.status),
    }),
    expiresAt: t.string({
      nullable: true,
      resolve: (r) => (r.status === 'not_available' ? null : r.expiresAt),
    }),
  }),
})

builder.mutationFields((t) => ({
  /** Open (or return) the direct conversation with another member. Gated on a
   * mutual connection — CONNECTION_REQUIRED otherwise. */
  startDirectConversation: t.field({
    type: StartConversationPayload,
    nullable: false,
    args: { otherUserId: t.arg.id({ required: true }) },
    resolve: async (_root, args, ctx): Promise<GetOrCreateDirectResult> => {
      if (!ctx.session) return { status: 'not_available' }
      return createConversationRepository(ctx.supabase).getOrCreateDirect(String(args.otherUserId))
    },
  }),

  /** Send a message. `clientNonce` is the idempotency key — replaying it
   * returns DUPLICATE with the original messageId, never a second row. */
  sendMessage: t.field({
    type: SendMessagePayload,
    nullable: false,
    args: {
      conversationId: t.arg.id({ required: true }),
      body: t.arg.string({ required: true }),
      clientNonce: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx): Promise<SendMessageResult> => {
      if (!ctx.session) return { status: 'not_available' }
      return createConversationRepository(ctx.supabase).send({
        conversationId: String(args.conversationId),
        body: args.body,
        clientNonce: args.clientNonce,
      })
    },
  }),

  /** Advance the viewer's read cursor. Monotonic — an older messageId returns
   * UNCHANGED rather than moving the cursor backward. */
  markConversationRead: t.field({
    type: MarkReadPayload,
    nullable: false,
    args: {
      conversationId: t.arg.id({ required: true }),
      messageId: t.arg.int({ required: true }),
    },
    resolve: async (_root, args, ctx): Promise<MarkReadResult> => {
      if (!ctx.session) return { status: 'not_available' }
      return createConversationRepository(ctx.supabase).markRead({
        conversationId: String(args.conversationId),
        messageId: args.messageId,
      })
    },
  }),

  /** Broadcast a typing indicator. Server-throttled; THROTTLED is normal
   * operation, not an error. */
  publishTyping: t.field({
    type: PublishTypingPayload,
    nullable: false,
    args: {
      conversationId: t.arg.id({ required: true }),
      isTyping: t.arg.boolean({ required: true }),
    },
    resolve: async (_root, args, ctx): Promise<PublishTypingResult> => {
      if (!ctx.session) return { status: 'not_available' }
      return createConversationRepository(ctx.supabase).publishTyping({
        conversationId: String(args.conversationId),
        isTyping: args.isTyping,
      })
    },
  }),
}))
