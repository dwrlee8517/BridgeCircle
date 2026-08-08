import { type ResolveCursorConnectionArgs, resolveCursorConnection } from '@pothos/plugin-relay'
import { createConversationRepository } from '@/db/repositories/conversations'
import { createMessagesRepository } from '@/db/repositories/messages'
import type { ConversationDetail, ConversationMessage } from '@/lib/conversations/contracts'
import type {
  MessageConversationSummary,
  MessagesCounts,
  MessagesFilter,
} from '@/lib/messages/contracts'
import { decodeMessagesCursor, encodeMessagesCursor } from '@/lib/pagination/messages-cursor'
import { builder } from '../builder'

/**
 * Messages — the inbox and conversation reads, re-pointed onto v2. Two
 * repositories back this: `messages` (the inbox list + counts) and
 * `conversations` (a single conversation and its history).
 *
 * Two different cursors, both genuine:
 * - The inbox pages on a three-part composite `(priority, activityAt,
 *   conversationId)`, encoded by `lib/pagination/messages-cursor`.
 * - Message history pages on the numeric message id, and does so **backward** —
 *   `last`/`before` walks into older messages, which is how chat actually
 *   reads. Forward paging is not exposed here; catching up on new messages is
 *   realtime's job (v2 keeps `listAfter` for that), not a connection.
 *
 * Scope: reads. send / markRead / typing land in the messages commands slice.
 */

const MessagesFilterEnum = builder.enumType('MessagesFilter', {
  values: ['ALL', 'UNREAD', 'MY_CIRCLE', 'OPEN_ASKS'] as const,
})

const ConversationKindEnum = builder.enumType('ConversationKind', {
  values: ['DIRECT', 'ASK'] as const,
})

const ReadOnlyReasonEnum = builder.enumType('ConversationReadOnlyReason', {
  values: [
    'ACCOUNT_UNAVAILABLE',
    'CONNECTION_REQUIRED',
    'ASK_UNAVAILABLE',
    'NOT_AVAILABLE',
  ] as const,
})

const ConnectionStateEnum = builder.enumType('ConversationConnectionState', {
  values: ['CONNECTED', 'INCOMING_PENDING', 'OUTGOING_PENDING', 'NONE'] as const,
})

const MessageKindEnum = builder.enumType('ConversationMessageKind', {
  values: ['USER', 'SYSTEM'] as const,
})

const upper = <T extends string>(v: T) => v.toUpperCase() as Uppercase<T>

const MessagesCountsRef = builder.objectRef<MessagesCounts>('MessagesCounts')
MessagesCountsRef.implement({
  description: 'Inbox badge counts, one per filter plus the attention totals.',
  fields: (t) => ({
    all: t.exposeInt('all', { nullable: false }),
    unread: t.exposeInt('unread', { nullable: false }),
    myCircle: t.exposeInt('myCircle', { nullable: false }),
    openAsks: t.exposeInt('openAsks', { nullable: false }),
    waiting: t.exposeInt('waiting', { nullable: false }),
    attention: t.exposeInt('attention', { nullable: false }),
  }),
})

const CounterpartRef =
  builder.objectRef<MessageConversationSummary['counterpart']>('MessageCounterpart')
CounterpartRef.implement({
  fields: (t) => ({
    userId: t.exposeID('userId', { nullable: false }),
    displayName: t.exposeString('displayName', { nullable: false }),
    avatarPath: t.exposeString('avatarPath', { nullable: true }),
  }),
})

const LatestMessageRef =
  builder.objectRef<NonNullable<MessageConversationSummary['latestMessage']>>('LatestMessage')
LatestMessageRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id', { nullable: false }),
    kind: t.field({ type: MessageKindEnum, nullable: false, resolve: (m) => upper(m.kind) }),
    senderUserId: t.exposeID('senderUserId', { nullable: true }),
    body: t.exposeString('body', { nullable: false }),
    createdAt: t.exposeString('createdAt', { nullable: false }),
  }),
})

const ConversationSummaryRef = builder.objectRef<MessageConversationSummary>('ConversationSummary')
ConversationSummaryRef.implement({
  description: 'A row in the inbox list.',
  fields: (t) => ({
    conversationId: t.exposeID('conversationId', { nullable: false }),
    kind: t.field({ type: ConversationKindEnum, nullable: false, resolve: (c) => upper(c.kind) }),
    askId: t.exposeID('askId', { nullable: true }),
    counterpart: t.field({ type: CounterpartRef, nullable: false, resolve: (c) => c.counterpart }),
    isConnected: t.exposeBoolean('isConnected', { nullable: false }),
    canSend: t.exposeBoolean('canSend', { nullable: false }),
    readOnlyReason: t.field({
      type: ReadOnlyReasonEnum,
      nullable: true,
      resolve: (c) => (c.readOnlyReason ? upper(c.readOnlyReason) : null),
    }),
    askQuestion: t.exposeString('askQuestion', { nullable: true }),
    latestMessage: t.field({
      type: LatestMessageRef,
      nullable: true,
      resolve: (c) => c.latestMessage,
    }),
    unreadCount: t.exposeInt('unreadCount', { nullable: false }),
    needsReply: t.exposeBoolean('needsReply', { nullable: false }),
    priority: t.exposeInt('priority', { nullable: false }),
    activityAt: t.exposeString('activityAt', { nullable: false }),
  }),
})

/**
 * A message in a thread. v2 returns a user|system union; flattened to one type
 * with a `kind` discriminator — `senderUserId` is set for user messages,
 * `eventType`/`actorUserId` for system ones.
 */
const ConversationMessageRef = builder.objectRef<ConversationMessage>('ConversationMessage')
ConversationMessageRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id', { nullable: false }),
    conversationId: t.exposeID('conversationId', { nullable: false }),
    kind: t.field({ type: MessageKindEnum, nullable: false, resolve: (m) => upper(m.kind) }),
    body: t.exposeString('body', { nullable: false }),
    createdAt: t.exposeString('createdAt', { nullable: false }),
    senderUserId: t.id({
      nullable: true,
      resolve: (m) => (m.kind === 'user' ? m.senderUserId : null),
    }),
    eventType: t.string({
      nullable: true,
      resolve: (m) => (m.kind === 'system' ? m.eventType : null),
    }),
    actorUserId: t.id({
      nullable: true,
      resolve: (m) => (m.kind === 'system' ? m.actorUserId : null),
    }),
  }),
})

const MAX_LIMIT = 50

const ConversationRef = builder.objectRef<ConversationDetail>('Conversation')
ConversationRef.implement({
  description: 'A single conversation, with its message history.',
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    kind: t.field({ type: ConversationKindEnum, nullable: false, resolve: (c) => upper(c.kind) }),
    askId: t.exposeID('askId', { nullable: true }),
    createdAt: t.exposeString('createdAt', { nullable: false }),
    lastMessageAt: t.exposeString('lastMessageAt', { nullable: true }),
    isConnected: t.exposeBoolean('isConnected', { nullable: false }),
    canSend: t.exposeBoolean('canSend', { nullable: false }),
    readOnlyReason: t.field({
      type: ReadOnlyReasonEnum,
      nullable: true,
      resolve: (c) => (c.readOnlyReason ? upper(c.readOnlyReason) : null),
    }),
    connectionState: t.field({
      type: ConnectionStateEnum,
      nullable: false,
      resolve: (c) => upper(c.connectionState),
    }),
    canRequestConnection: t.exposeBoolean('canRequestConnection', { nullable: false }),
    viewerLastReadMessageId: t.exposeInt('viewerLastReadMessageId', { nullable: true }),
    counterpartLastReadMessageId: t.exposeInt('counterpartLastReadMessageId', { nullable: true }),
    latestMessageId: t.exposeInt('latestMessageId', { nullable: true }),

    /**
     * Message history, newest last. Backward-only: `last`/`before` walks into
     * older messages (the chat idiom). The cursor is the numeric message id.
     */
    messagesConnection: t.connection(
      {
        type: ConversationMessageRef,
        resolve: (conversation, args, ctx) =>
          resolveCursorConnection(
            { args, toCursor: (m: ConversationMessage) => String(m.id) },
            ({ before, limit }: ResolveCursorConnectionArgs) =>
              createConversationRepository(ctx.supabase)
                .listBefore({
                  conversationId: conversation.id,
                  beforeMessageId: before ? Number(before) : null,
                  limit: Math.min(limit, MAX_LIMIT),
                })
                // The RPC returns newest-first; the connection reads oldest-first.
                .then((messages) => [...messages].reverse()),
          ),
      },
      { name: 'ConversationMessageConnection' },
      { name: 'ConversationMessageEdge' },
    ),
  }),
})

builder.queryFields((t) => ({
  /** Inbox badge counts. Zeroed when unauthenticated. */
  messagesCounts: t.field({
    type: MessagesCountsRef,
    nullable: true,
    resolve: async (_root, _args, ctx): Promise<MessagesCounts | null> => {
      if (!ctx.session) return null
      return createMessagesRepository(ctx.supabase).getCounts()
    },
  }),

  /** A single conversation. RLS decides visibility; null when hidden/missing. */
  conversation: t.field({
    type: ConversationRef,
    nullable: true,
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_root, { id }, ctx): Promise<ConversationDetail | null> => {
      if (!ctx.session) return null
      return createConversationRepository(ctx.supabase).getDetail(String(id))
    },
  }),

  /** The inbox, priority-ordered, as a cursor connection. Forward-only. */
  conversationsConnection: t.connection(
    {
      type: ConversationSummaryRef,
      args: {
        filter: t.arg({ type: MessagesFilterEnum, required: false }),
        query: t.arg.string({ required: false }),
      },
      resolve: async (_root, args, ctx) => {
        const toCursor = (c: MessageConversationSummary) =>
          encodeMessagesCursor({
            priority: c.priority,
            activityAt: c.activityAt,
            conversationId: c.conversationId,
          })
        const empty = () => resolveCursorConnection({ args, toCursor }, () => [])
        if (!ctx.session) return empty()
        const repo = createMessagesRepository(ctx.supabase)
        const filter = (args.filter?.toLowerCase() ?? 'all') as MessagesFilter

        return resolveCursorConnection(
          { args, toCursor },
          ({ after, limit }: ResolveCursorConnectionArgs) =>
            repo.listConversations({
              filter,
              query: args.query ?? null,
              cursor: decodeMessagesCursor(after),
              limit: Math.min(limit, MAX_LIMIT),
            }),
        )
      },
    },
    { name: 'ConversationConnection' },
    { name: 'ConversationEdge' },
  ),
}))
