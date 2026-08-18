import { createAccountAuthRepository } from '@/db/repositories/account-auth'
import { createAccountExportStorage } from '@/db/repositories/account-export-storage'
import { getMemberContext } from '@/db/repositories/member-context'
import { createSettingsRepository } from '@/db/repositories/settings'
import type { AccountExport } from '@/lib/settings/contracts'
import { createAccountExportDownload } from '@/lib/settings/operations'
import { builder } from '../builder'

/**
 * Account lifecycle — deletion scheduling, data export, and email change,
 * delegating to `db/repositories/settings` (+ account-auth / export-storage).
 * Split from the notifications/settings slice on purpose: these commands are a
 * different risk class (they end or exfiltrate an account), so they get their
 * own review surface.
 *
 * - Deletion is a grace-period schedule, not an immediate delete: schedule →
 *   deletion_scheduled with a date; cancel is possible until the worker
 *   finalizes (TOO_LATE after). The read side is `accountStatus`, sourced from
 *   the same get_my_member_context the app shell uses.
 * - Export download is a time-limited signed URL, produced by the same
 *   `createAccountExportDownload` composition the settings page uses — the
 *   graph never exposes raw bucket/path.
 */

const AccountStateEnum = builder.enumType('AccountState', {
  values: ['ACTIVE', 'DELETION_SCHEDULED', 'DELETED'] as const,
})

const ExportStatusEnum = builder.enumType('AccountExportStatus', {
  values: ['QUEUED', 'PROCESSING', 'READY', 'FAILED', 'EXPIRED'] as const,
})

const ScheduleDeletionStatus = builder.enumType('ScheduleDeletionStatus', {
  values: ['SCHEDULED', 'NOT_AVAILABLE'] as const,
})

const CancelDeletionStatus = builder.enumType('CancelDeletionStatus', {
  values: ['CANCELLED', 'ACTIVE', 'TOO_LATE', 'NOT_AVAILABLE'] as const,
})

const ChangeEmailStatus = builder.enumType('ChangeEmailStatus', {
  values: ['CHANGED', 'FAILED', 'NOT_AVAILABLE'] as const,
})

const upper = <T extends string>(v: T) => v.toUpperCase() as Uppercase<T>

type AccountStatus = {
  accountState: 'active' | 'deletion_scheduled' | 'deleted'
  deleteScheduledFor: string | null
  deleteInitiatedByAdmin: boolean
}

const AccountStatusRef = builder.objectRef<AccountStatus>('AccountStatus')
AccountStatusRef.implement({
  description: "The viewer's account lifecycle state.",
  fields: (t) => ({
    accountState: t.field({
      type: AccountStateEnum,
      nullable: false,
      resolve: (s) => upper(s.accountState),
    }),
    deleteScheduledFor: t.exposeString('deleteScheduledFor', { nullable: true }),
    deleteInitiatedByAdmin: t.exposeBoolean('deleteInitiatedByAdmin', { nullable: false }),
  }),
})

const AccountExportRef = builder.objectRef<AccountExport>('AccountExport')
AccountExportRef.implement({
  description: 'A data-export job. Download via accountExportDownloadUrl once READY.',
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    status: t.field({
      type: ExportStatusEnum,
      nullable: false,
      resolve: (e) => upper(e.status),
    }),
    createdAt: t.exposeString('createdAt', { nullable: false }),
    completedAt: t.exposeString('completedAt', { nullable: true }),
    expiresAt: t.exposeString('expiresAt', { nullable: true }),
  }),
})

type ScheduleDeletionResult = Awaited<
  ReturnType<ReturnType<typeof createSettingsRepository>['scheduleDeletion']>
>
const ScheduleDeletionPayload = builder.objectRef<ScheduleDeletionResult>('ScheduleDeletionPayload')
ScheduleDeletionPayload.implement({
  fields: (t) => ({
    status: t.field({
      type: ScheduleDeletionStatus,
      nullable: false,
      resolve: (r) => upper(r.result_code),
    }),
    deleteScheduledFor: t.string({ nullable: true, resolve: (r) => r.delete_scheduled_for }),
  }),
})

type CancelDeletionResult = Awaited<
  ReturnType<ReturnType<typeof createSettingsRepository>['cancelDeletion']>
>
const CancelDeletionPayload = builder.objectRef<CancelDeletionResult>('CancelDeletionPayload')
CancelDeletionPayload.implement({
  fields: (t) => ({
    status: t.field({
      type: CancelDeletionStatus,
      nullable: false,
      resolve: (r) => upper(r.result_code),
    }),
    accountState: t.field({
      type: AccountStateEnum,
      nullable: true,
      resolve: (r) => (r.account_state ? upper(r.account_state) : null),
    }),
  }),
})

builder.queryFields((t) => ({
  /** The viewer's account lifecycle state (active / deletion scheduled). */
  accountStatus: t.field({
    type: AccountStatusRef,
    nullable: true,
    resolve: async (_root, _args, ctx): Promise<AccountStatus | null> => {
      if (!ctx.session) return null
      const context = await getMemberContext(ctx.supabase)
      return {
        accountState: context.accountState,
        deleteScheduledFor: context.deleteScheduledFor,
        deleteInitiatedByAdmin: context.deleteInitiatedByAdmin,
      }
    },
  }),

  /** The viewer's latest data-export job, or null when none was requested. */
  accountExport: t.field({
    type: AccountExportRef,
    nullable: true,
    resolve: async (_root, _args, ctx): Promise<AccountExport | null> => {
      if (!ctx.session) return null
      return createSettingsRepository(ctx.supabase).getExport()
    },
  }),

  /**
   * A time-limited signed URL for the READY export, or null when there is
   * nothing downloadable. Same composition as the settings page — the raw
   * storage bucket/path never crosses the graph.
   */
  accountExportDownloadUrl: t.string({
    nullable: true,
    resolve: async (_root, _args, ctx): Promise<string | null> => {
      if (!ctx.session) return null
      return createAccountExportDownload(
        createSettingsRepository(ctx.supabase),
        createAccountExportStorage(ctx.supabase),
      )
    },
  }),
}))

builder.mutationFields((t) => ({
  /** Schedule account deletion (grace period; cancellable until finalized). */
  scheduleAccountDeletion: t.field({
    type: ScheduleDeletionPayload,
    nullable: false,
    resolve: async (_root, _args, ctx): Promise<ScheduleDeletionResult> => {
      if (!ctx.session) return { result_code: 'not_available', delete_scheduled_for: null }
      return createSettingsRepository(ctx.supabase).scheduleDeletion()
    },
  }),

  /** Cancel a scheduled deletion. TOO_LATE once the worker has finalized;
   * ACTIVE when nothing was scheduled. */
  cancelAccountDeletion: t.field({
    type: CancelDeletionPayload,
    nullable: false,
    resolve: async (_root, _args, ctx): Promise<CancelDeletionResult> => {
      if (!ctx.session) return { result_code: 'not_available', account_state: null }
      return createSettingsRepository(ctx.supabase).cancelDeletion()
    },
  }),

  /** Request a data export. `clientRequestId` is the idempotency key —
   * replaying it returns the existing job rather than queueing a second. */
  requestAccountExport: t.field({
    type: AccountExportRef,
    nullable: true,
    args: { clientRequestId: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx): Promise<AccountExport | null> => {
      if (!ctx.session) return null
      return createSettingsRepository(ctx.supabase).requestExport(args.clientRequestId)
    },
  }),

  /** Change the sign-in email. Supabase Auth sends the confirmation flow;
   * CHANGED means the request was accepted, not that the email is live. */
  changeAccountEmail: t.field({
    type: ChangeEmailStatus,
    nullable: false,
    args: { email: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx): Promise<'CHANGED' | 'FAILED' | 'NOT_AVAILABLE'> => {
      if (!ctx.session) return 'NOT_AVAILABLE'
      const result = await createAccountAuthRepository(ctx.supabase).changeEmail(args.email)
      return upper(result)
    },
  }),
}))
