import { type ResolveCursorConnectionArgs, resolveCursorConnection } from '@pothos/plugin-relay'
import { createNotificationRepository } from '@/db/repositories/notifications'
import { createSettingsRepository } from '@/db/repositories/settings'
import {
  isNotificationType,
  NOTIFICATION_TYPES,
  type NotificationRow,
} from '@/lib/notifications/types'
import { decodeKeysetCursor, encodeKeysetCursor } from '@/lib/pagination/keyset'
import type { BlockedMember, NotificationPreference } from '@/lib/settings/contracts'
import { builder } from '../builder'

/**
 * Notifications + settings — the bell and its preference surfaces, delegating
 * to `db/repositories/notifications` and `db/repositories/settings`. All of
 * these RPCs are `*_my_*` (user-scoped via RLS), so no membership resolution
 * is needed — the thinnest resolvers in the graph.
 *
 * The bell is a TRUE keyset connection: v2's `list_my_notifications` pages
 * newest-first over `(created_at, id)` with before-cursor args, so `after`
 * walks into OLDER notifications (forward-only, like the Help list). The
 * cursor reuses `lib/pagination/keyset`.
 *
 * `payload` is a free-form JSONB blob whose shape varies by type — exposed as
 * a JSON string (`payloadJson`) rather than inventing per-type object types;
 * clients that need structure parse it against the type they matched.
 *
 * Scope: bell + notification/communication preferences + blocked list.
 * Account deletion/export is a separate account-lifecycle slice.
 */

// Derived from NOTIFICATION_TYPES so the enum can never drift from the source
// vocabulary (20 values today).
const NotificationTypeEnum = builder.enumType('NotificationType', {
  values: NOTIFICATION_TYPES.map((v) => v.toUpperCase()),
})

const SavePreferenceStatus = builder.enumType('SavePreferenceStatus', {
  values: ['SAVED', 'INVALID_TYPE', 'NOT_AVAILABLE'] as const,
})

const SaveCommunicationStatus = builder.enumType('SaveCommunicationStatus', {
  values: ['SAVED', 'NOT_AVAILABLE'] as const,
})

const upper = <T extends string>(v: T) => v.toUpperCase() as Uppercase<T>

const NotificationRef = builder.objectRef<NotificationRow>('Notification')
NotificationRef.implement({
  description: 'A bell notification. payload shape varies by type; see payloadJson.',
  fields: (t) => ({
    id: t.exposeInt('id', { nullable: false }),
    type: t.field({
      type: NotificationTypeEnum,
      nullable: false,
      resolve: (n) => n.type.toUpperCase(),
    }),
    targetType: t.exposeString('targetType', { nullable: true }),
    targetId: t.exposeString('targetId', { nullable: true }),
    organizationId: t.id({ nullable: true, resolve: (n) => n.organizationId }),
    actorUserId: t.id({ nullable: true, resolve: (n) => n.actorUserId }),
    readAt: t.exposeString('readAt', { nullable: true }),
    createdAt: t.exposeString('createdAt', { nullable: false }),
    payloadJson: t.string({
      nullable: false,
      resolve: (n) => JSON.stringify(n.payload),
    }),
  }),
})

const NotificationPreferenceRef =
  builder.objectRef<NotificationPreference>('NotificationPreference')
NotificationPreferenceRef.implement({
  description: 'Per-type delivery toggles for in-app and email.',
  fields: (t) => ({
    type: t.field({
      type: NotificationTypeEnum,
      nullable: false,
      resolve: (p) => p.type.toUpperCase(),
    }),
    inAppEnabled: t.exposeBoolean('inAppEnabled', { nullable: false }),
    emailEnabled: t.exposeBoolean('emailEnabled', { nullable: false }),
    updatedAt: t.exposeString('updatedAt', { nullable: false }),
  }),
})

const CommunicationPreferencesRef = builder.objectRef<{
  schoolNewsletterEmailEnabled: boolean
  updatedAt: string
}>('CommunicationPreferences')
CommunicationPreferencesRef.implement({
  fields: (t) => ({
    schoolNewsletterEmailEnabled: t.exposeBoolean('schoolNewsletterEmailEnabled', {
      nullable: false,
    }),
    updatedAt: t.exposeString('updatedAt', { nullable: false }),
  }),
})

const BlockedMemberRef = builder.objectRef<BlockedMember>('BlockedMember')
BlockedMemberRef.implement({
  fields: (t) => ({
    userId: t.exposeID('userId', { nullable: false }),
    displayName: t.exposeString('displayName', { nullable: false }),
    avatarPath: t.exposeString('avatarPath', { nullable: true }),
    blockedAt: t.exposeString('blockedAt', { nullable: false }),
  }),
})

const MarkReadCountPayload = builder.objectRef<{ count: number }>('MarkNotificationsReadPayload')
MarkReadCountPayload.implement({
  fields: (t) => ({
    // How many rows actually flipped — already-read ids don't count.
    count: t.exposeInt('count', { nullable: false }),
  }),
})

const MAX_LIMIT = 100

builder.queryFields((t) => ({
  /**
   * The bell, newest first. A true keyset connection over `(createdAt, id)`;
   * `after` pages into older notifications (forward-only — there is no
   * backward mode on the RPC).
   */
  notificationsConnection: t.connection(
    {
      type: NotificationRef,
      args: {
        unreadOnly: t.arg.boolean({ required: false }),
      },
      resolve: (_root, args, ctx) => {
        const toCursor = (n: NotificationRow) => encodeKeysetCursor(n.createdAt, String(n.id))
        const empty = () => resolveCursorConnection({ args, toCursor }, () => [])
        if (!ctx.session) return empty()
        const repo = createNotificationRepository(ctx.supabase)

        return resolveCursorConnection(
          { args, toCursor },
          ({ after, limit }: ResolveCursorConnectionArgs) => {
            const cursor = after ? decodeKeysetCursor(after) : null
            return repo.list({
              beforeCreatedAt: cursor?.sortValue,
              beforeId: cursor ? Number(cursor.id) : undefined,
              limit: Math.min(limit, MAX_LIMIT),
              unreadOnly: args.unreadOnly ?? false,
            })
          },
        )
      },
    },
    { name: 'NotificationConnection' },
    { name: 'NotificationEdge' },
  ),

  /** Per-type delivery preferences. Null when unauthenticated. */
  notificationPreferences: t.field({
    type: [NotificationPreferenceRef],
    nullable: { list: true, items: false },
    resolve: async (_root, _args, ctx): Promise<NotificationPreference[] | null> => {
      if (!ctx.session) return null
      return createSettingsRepository(ctx.supabase).listNotificationPreferences()
    },
  }),

  /** Non-notification email toggles (school newsletter). */
  communicationPreferences: t.field({
    type: CommunicationPreferencesRef,
    nullable: true,
    resolve: async (_root, _args, ctx) => {
      if (!ctx.session) return null
      return createSettingsRepository(ctx.supabase).getCommunicationPreferences()
    },
  }),

  /** Members the viewer has blocked. */
  blockedMembers: t.field({
    type: [BlockedMemberRef],
    nullable: { list: true, items: false },
    resolve: async (_root, _args, ctx): Promise<BlockedMember[] | null> => {
      if (!ctx.session) return null
      return createSettingsRepository(ctx.supabase).listBlockedMembers()
    },
  }),
}))

builder.mutationFields((t) => ({
  /** Mark specific notifications read. Returns how many rows flipped. */
  markNotificationsRead: t.field({
    type: MarkReadCountPayload,
    nullable: false,
    args: { notificationIds: t.arg.intList({ required: true }) },
    resolve: async (_root, args, ctx): Promise<{ count: number }> => {
      if (!ctx.session) return { count: 0 }
      const count = await createNotificationRepository(ctx.supabase).markRead(args.notificationIds)
      return { count }
    },
  }),

  /** Mark everything at or before `before` (ISO timestamp) read. */
  markAllNotificationsRead: t.field({
    type: MarkReadCountPayload,
    nullable: false,
    args: { before: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx): Promise<{ count: number }> => {
      if (!ctx.session) return { count: 0 }
      const count = await createNotificationRepository(ctx.supabase).markAllRead(args.before)
      return { count }
    },
  }),

  /** Set the in-app/email toggles for one notification type. */
  saveNotificationPreference: t.field({
    type: SavePreferenceStatus,
    nullable: false,
    args: {
      type: t.arg({ type: NotificationTypeEnum, required: true }),
      inAppEnabled: t.arg.boolean({ required: true }),
      emailEnabled: t.arg.boolean({ required: true }),
    },
    resolve: async (_root, args, ctx): Promise<'SAVED' | 'INVALID_TYPE' | 'NOT_AVAILABLE'> => {
      if (!ctx.session) return 'NOT_AVAILABLE'
      const type = String(args.type).toLowerCase()
      // The repo re-validates, but reject unknown values before the RPC call.
      if (!isNotificationType(type)) return 'INVALID_TYPE'
      const result = await createSettingsRepository(ctx.supabase).saveNotificationPreference(
        type,
        args.inAppEnabled,
        args.emailEnabled,
      )
      return upper(result)
    },
  }),

  /** Toggle the school-newsletter email. */
  saveCommunicationPreferences: t.field({
    type: SaveCommunicationStatus,
    nullable: false,
    args: { schoolNewsletterEmailEnabled: t.arg.boolean({ required: true }) },
    resolve: async (_root, args, ctx): Promise<'SAVED' | 'NOT_AVAILABLE'> => {
      if (!ctx.session) return 'NOT_AVAILABLE'
      const result = await createSettingsRepository(ctx.supabase).saveCommunicationPreferences(
        args.schoolNewsletterEmailEnabled,
      )
      return upper(result)
    },
  }),
}))
