import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { createHelpRepository } from '@/db/repositories/help'
import { getMemberContext } from '@/db/repositories/member-context'
import { createMessagesRepository } from '@/db/repositories/messages'
import { createNotificationRepository } from '@/db/repositories/notifications'
import { createPeopleRepository } from '@/db/repositories/people'
import { createSchoolRepository } from '@/db/repositories/school'
import { createSettingsRepository } from '@/db/repositories/settings'
import type { CookieJar } from '../../harness/cookieJar'
import type { ParityWorld } from './world'

/**
 * Executable parity cases — one per operation in `PARITY_MANIFEST`.
 *
 * The manifest states each operation's repository equivalent in prose
 * (`argsNote`, `shapeNotes`). That prose is the contract; this file is the
 * contract *executed*. Each case says three things the prose implies:
 *
 * - `variables` — how the manifest document's variables bind to this world.
 * - `repository` — the same call, as code, against a client scoped to the
 *   same user (the `argsNote`).
 * - `fromGraphql` / `fromRepository` — the two results normalized to a common
 *   shape (the `shapeNotes`). These may rename keys, uppercase enums, and
 *   narrow to the document's selection set. They must NOT compute values: the
 *   moment a projection derives something neither side returned, it stops
 *   testing parity and starts asserting its own opinion.
 *
 * An operation with no case here must appear in `PARITY_PENDING` with a
 * reason. `parity.int.test.ts` fails on any manifest entry that is in neither,
 * so a new slice cannot land without declaring what its parity story is.
 */

type Db = SupabaseClient<Database>

export type ParityCase = {
  /** Whose session runs both sides. Defaults to the viewer. */
  identity?: (world: ParityWorld) => CookieJar
  /**
   * Why this operation legitimately returns nothing in this world.
   *
   * Set it only when emptiness is the real answer. An empty result compares
   * equal to an empty result, so without this guard a case can pass while
   * proving nothing — which is the failure mode that made the manifest look
   * covered when it was not.
   */
  allowEmpty?: string
  variables?: (world: ParityWorld) => Record<string, unknown>
  repository: (world: ParityWorld, db: Db) => Promise<unknown>
  fromGraphql: (data: Record<string, unknown>, world: ParityWorld) => unknown
  fromRepository: (result: never, world: ParityWorld) => unknown
}

/** The membership the resolvers pick: the selected one, else the first. */
async function selectedMembership(db: Db) {
  const context = await getMemberContext(db)
  return (
    context.memberships.find((m) => m.membershipId === context.selectedMembershipId) ??
    context.memberships[0] ??
    null
  )
}

const upper = (value: string) => value.toUpperCase()

// biome-ignore lint/suspicious/noExplicitAny: projections narrow untyped GraphQL data by design.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any

export const PARITY_CASES: Record<string, ParityCase> = {
  'query:me': {
    repository: async (_w, db) => {
      const context = await getMemberContext(db)
      const selected =
        context.memberships.find((m) => m.membershipId === context.selectedMembershipId) ??
        context.memberships[0]
      return selected ?? null
    },
    fromGraphql: (data) => data.me,
    fromRepository: (selected: Any, world) =>
      selected === null
        ? null
        : {
            id: selected.membershipId,
            userId: world.viewer.userId,
            displayName: selected.profile.displayName,
            preferredName: selected.profile.preferredName,
            // `name` is the one derived field on Member: preferred, else display.
            name: selected.profile.preferredName ?? selected.profile.displayName,
            avatarPath: selected.profile.avatarPath,
            graduationYear: selected.profile.graduationYear,
            bio: selected.profile.bio,
            organizationName: selected.organization.name,
          },
  },

  'query:accountStatus': {
    repository: (_w, db) => getMemberContext(db),
    fromGraphql: (data) => data.accountStatus,
    fromRepository: (context: Any) => ({
      accountState: upper(context.accountState),
      deleteScheduledFor: context.deleteScheduledFor,
      deleteInitiatedByAdmin: context.deleteInitiatedByAdmin,
    }),
  },

  'query:helpHome': {
    repository: async (_w, db) => {
      const membership = await selectedMembership(db)
      return membership ? createHelpRepository(db).getHome(membership.membershipId) : null
    },
    fromGraphql: (data) => data.helpHome,
    fromRepository: (home: Any) =>
      home === null
        ? null
        : {
            membershipId: home.membershipId,
            organizationId: home.organizationId,
            activeAskCount: home.activeAskCount,
            activeAskLimit: home.activeAskLimit,
            openToHelp: home.openToHelp,
            pausedAt: home.pausedAt,
            pauseReason: home.pauseReason === null ? null : upper(home.pauseReason),
            helperTopics: home.helperTopics,
          },
  },

  'query:messagesCounts': {
    repository: (_w, db) => createMessagesRepository(db).getCounts(),
    fromGraphql: (data) => data.messagesCounts,
    fromRepository: (counts: Any) => counts,
  },

  'query:notificationPreferences': {
    repository: (_w, db) => createSettingsRepository(db).listNotificationPreferences(),
    fromGraphql: (data) => data.notificationPreferences,
    fromRepository: (preferences: Any) =>
      preferences.map((preference: Any) => ({
        type: upper(preference.type),
        inAppEnabled: preference.inAppEnabled,
        emailEnabled: preference.emailEnabled,
        updatedAt: preference.updatedAt,
      })),
  },

  'query:notificationsConnection': {
    variables: () => ({ first: 30, unreadOnly: false }),
    repository: (_w, db) =>
      createNotificationRepository(db).list({ limit: 30, unreadOnly: false }),
    fromGraphql: (data) => (data.notificationsConnection as Any).edges.map((e: Any) => e.node),
    fromRepository: (rows: Any) =>
      rows.map((row: Any) => ({
        id: row.id,
        type: upper(row.type),
        readAt: row.readAt,
        createdAt: row.createdAt,
        payloadJson: JSON.stringify(row.payload),
      })),
  },

  'query:myAsksConnection': {
    variables: () => ({ first: 20 }),
    repository: async (_w, db) => {
      const membership = await selectedMembership(db)
      if (!membership) return []
      return createHelpRepository(db).listMyAsks({
        membershipId: membership.membershipId,
        cursor: null,
        limit: 20,
      })
    },
    fromGraphql: (data) => (data.myAsksConnection as Any).edges.map((e: Any) => e.node),
    fromRepository: (asks: Any) =>
      asks.map((ask: Any) => ({
        id: ask.id,
        status: upper(ask.status),
        question: ask.question,
        createdAt: ask.createdAt,
      })),
  },

  'query:conversationsConnection': {
    variables: () => ({ filter: 'ALL', first: 20 }),
    repository: (_w, db) =>
      createMessagesRepository(db).listConversations({
        filter: 'all',
        query: null,
        cursor: null,
        limit: 20,
      }),
    fromGraphql: (data) => (data.conversationsConnection as Any).edges.map((e: Any) => e.node),
    fromRepository: (conversations: Any) =>
      conversations.map((conversation: Any) => ({
        conversationId: conversation.conversationId,
        kind: upper(conversation.kind),
        unreadCount: conversation.unreadCount,
        needsReply: conversation.needsReply,
        priority: conversation.priority,
        activityAt: conversation.activityAt,
        counterpart: {
          userId: conversation.counterpart.userId,
          displayName: conversation.counterpart.displayName,
        },
      })),
  },

  'query:peopleSearch': {
    variables: () => ({ scope: 'ALL', first: 25 }),
    repository: async (_w, db) => {
      const membership = await selectedMembership(db)
      if (!membership) return null
      return createPeopleRepository(db).list({
        membershipId: membership.membershipId,
        query: null,
        scope: 'all',
        // The resolver defaults every filter key to null; mirror that exactly
        // rather than leaning on a partial object, so both sides send one input.
        filters: {
          industry: null,
          classYearStart: null,
          classYearEnd: null,
          location: null,
          employer: null,
          education: null,
          topic: null,
        },
        queryEmbedding: null,
        limit: 25,
      })
    },
    fromGraphql: (data) => data.peopleSearch,
    fromRepository: (result: Any) =>
      result === null
        ? null
        : {
            totalCount: result.totalCount,
            capped: result.capped,
            items: result.items.map((item: Any) => ({
              membershipId: item.membershipId,
              userId: item.userId,
              displayName: item.displayName,
              openToHelp: item.openToHelp,
              helperTopics: item.helperTopics,
              relationship: { state: upper(item.relationship.state) },
              matchEvidence: item.matchEvidence.map((e: Any) => ({ kind: upper(e.kind) })),
              rankScore: item.rankScore,
            })),
          },
  },

  'query:schoolAnnouncements': {
    variables: () => ({ filter: 'ALL' }),
    repository: async (_w, db) => {
      const membership = await selectedMembership(db)
      if (!membership) return null
      return createSchoolRepository(db).listAnnouncements(membership.membershipId, 'all')
    },
    fromGraphql: (data) => data.schoolAnnouncements,
    fromRepository: (announcements: Any) =>
      announcements === null
        ? null
        : announcements.map((announcement: Any) => ({
            id: announcement.id,
            tag: upper(announcement.tag),
            title: announcement.title,
            summary: announcement.summary,
            pinned: announcement.pinned,
            publishedAt: announcement.publishedAt,
            unread: announcement.unread,
          })),
  },
}

/**
 * Manifest operations with no executable case yet, and why.
 *
 * This list is the honest edge of the harness. Anything here is covered by the
 * schema-shape guard in `src/graphql/schema.test.ts` and by nothing else — its
 * resolver has never been diffed against the repository path.
 */
const MUTATION_REASON =
  'Mutations cannot be diffed by running both sides: the first call consumes the state the second would act on, so the same input yields a different terminal (DUPLICATE, ALREADY_DECIDED, capacity valves). Parity for a command means running each side against equivalent-but-distinct subjects and comparing the status vocabulary plus resulting state — a different harness shape, not another entry in this table.'

export const PARITY_PENDING: Record<string, string> = {
  'query:memberProfile':
    'Needs a fully-populated profile on the target member (experiences, education, links, shared context). Onboarding writes none of it, so a real profile has to be built through the profile actions first.',
  'query:ask':
    'Ask detail exposes the asker/recipient privacy union; diffing it needs an accepted ask so the identified branch is exercised, not just the anonymous one.',
  'query:conversation':
    'Needs an open conversation, which needs an accepted offer or connection — world-building beyond this fixture.',
  'query:conversation.messagesConnection':
    'Nested under conversation; same prerequisite, plus the 3-part message cursor deserves its own pagination case.',
  'query:schoolHome':
    'Needs at least one event, announcement, and newsletter issue; all three are admin-authored and none exist in a fresh tenant.',
  'query:schoolEvent': 'Needs an admin-created event.',
  'query:schoolEventAttendees': 'Needs an admin-created event with RSVPs.',
  'query:schoolAnnouncement': 'Needs an admin-published announcement.',
  'query:newsletterIssue': 'Needs a published newsletter issue.',

  // Mutations, all for the same structural reason.
  'mutation:createDirectAsk': MUTATION_REASON,
  'mutation:createCircleAsk': MUTATION_REASON,
  'mutation:respondToDirectAsk': MUTATION_REASON,
  'mutation:retractAsk': MUTATION_REASON,
  'mutation:resolveAsk': MUTATION_REASON,
  'mutation:offerToHelp': MUTATION_REASON,
  'mutation:decideOffer': MUTATION_REASON,
  'mutation:saveHelperPreferences': MUTATION_REASON,
  'mutation:startDirectConversation': MUTATION_REASON,
  'mutation:sendMessage': MUTATION_REASON,
  'mutation:markConversationRead': MUTATION_REASON,
  'mutation:publishTyping': MUTATION_REASON,
  'mutation:respondToSchoolEvent': MUTATION_REASON,
  'mutation:markAnnouncementRead': MUTATION_REASON,
  'mutation:sendConnectionRequest': MUTATION_REASON,
  'mutation:respondToConnectionRequest': MUTATION_REASON,
  'mutation:disconnect': MUTATION_REASON,
  'mutation:markNotificationsRead': MUTATION_REASON,
  'mutation:markAllNotificationsRead': MUTATION_REASON,
  'mutation:saveNotificationPreference': MUTATION_REASON,
  'mutation:scheduleAccountDeletion': MUTATION_REASON,
  'mutation:cancelAccountDeletion': MUTATION_REASON,
  'mutation:requestAccountExport': MUTATION_REASON,
}
