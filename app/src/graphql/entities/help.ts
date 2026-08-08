import { type ResolveCursorConnectionArgs, resolveCursorConnection } from '@pothos/plugin-relay'
import { createHelpRepository } from '@/db/repositories/help'
import { getMemberContext } from '@/db/repositories/member-context'
import type {
  HelpAskDetail,
  HelpAskSummary,
  HelpHome,
  HelpProfilePreview,
  IdentifiedHelpProfile,
} from '@/lib/help/contracts'
import { decodeHelpCursor, encodeHelpCursor } from '@/lib/help/cursors'
import { builder } from '../builder'

/**
 * Help / Asks — the core loop, re-pointed onto v2. Delegates to
 * `db/repositories/help` (the `get_help_home` / `list_my_asks` /
 * `get_help_ask_detail` RPCs).
 *
 * `myAsksConnection` is the first **true cursor connection** in the graph: v2
 * already pages Help with `HelpCursor { createdAt, id }` and ships its own
 * codec, so the connection reuses `encodeHelpCursor`/`decodeHelpCursor` rather
 * than inventing a parallel cursor scheme. Forward pagination only — the
 * underlying RPC takes a single `cursor` + `limit` and has no backward mode.
 *
 * Scope: reads. The side-effecting commands (create/respond/retract/resolve,
 * offers, preferences) land in the Help mutations slice.
 */

const HelpAskKindEnum = builder.enumType('HelpAskKind', {
  values: ['DIRECT', 'CIRCLE'] as const,
})

const HelpAskStatusEnum = builder.enumType('HelpAskStatus', {
  values: ['WAITING', 'OPEN', 'ACCEPTED', 'DECLINED', 'RETRACTED', 'RESOLVED', 'CLOSED'] as const,
})

const HelpReachEnum = builder.enumType('HelpReach', {
  values: ['MATCHED', 'ORGANIZATION'] as const,
})

/**
 * Asker/recipient preview. v2 returns a discriminated union — an identified
 * member, or an anonymous stand-in for circle asks that stay anonymous until
 * accepted. Flattened to one type with `isAnonymous`; identity-bearing fields
 * are null in the anonymous case, which is the privacy contract.
 */
const HelpProfileRef = builder.objectRef<HelpProfilePreview>('HelpProfile')
HelpProfileRef.implement({
  description: 'A member preview on an Ask. Anonymous asks expose no identity fields.',
  fields: (t) => ({
    isAnonymous: t.boolean({ nullable: false, resolve: (p) => p.identity === 'anonymous' }),
    displayName: t.exposeString('displayName', { nullable: false }),
    graduationYear: t.exposeInt('graduationYear', { nullable: true }),
    userId: t.id({
      nullable: true,
      resolve: (p) => (p.identity === 'identified' ? p.userId : null),
    }),
    headline: t.string({
      nullable: true,
      resolve: (p) => (p.identity === 'identified' ? p.headline : null),
    }),
    avatarPath: t.string({
      nullable: true,
      resolve: (p) => (p.identity === 'identified' ? p.avatarPath : null),
    }),
  }),
})

// The recipient is always identified when present.
const identifiedToPreview = (r: IdentifiedHelpProfile): HelpProfilePreview => r

const HelpAskSummaryRef = builder.objectRef<HelpAskSummary>('HelpAskSummary')
HelpAskSummaryRef.implement({
  description: "A row in the member's own Ask history.",
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    organizationId: t.exposeID('organizationId', { nullable: false }),
    kind: t.field({
      type: HelpAskKindEnum,
      nullable: false,
      resolve: (a) => a.kind.toUpperCase() as Uppercase<HelpAskSummary['kind']>,
    }),
    status: t.field({
      type: HelpAskStatusEnum,
      nullable: false,
      resolve: (a) => a.status.toUpperCase() as Uppercase<HelpAskSummary['status']>,
    }),
    question: t.exposeString('question', { nullable: false }),
    recipient: t.field({
      type: HelpProfileRef,
      nullable: true,
      resolve: (a) => (a.recipient ? identifiedToPreview(a.recipient) : null),
    }),
    offerCount: t.exposeInt('offerCount', { nullable: false }),
    conversationId: t.exposeID('conversationId', { nullable: true }),
    createdAt: t.exposeString('createdAt', { nullable: false }),
    expiresAt: t.exposeString('expiresAt', { nullable: false }),
    endedAt: t.exposeString('endedAt', { nullable: true }),
  }),
})

const HelpAskDetailRef = builder.objectRef<HelpAskDetail>('HelpAsk')
HelpAskDetailRef.implement({
  description: 'Full Ask detail. Nested offers and history arrive with the Help detail slice.',
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    organizationId: t.exposeID('organizationId', { nullable: false }),
    kind: t.field({
      type: HelpAskKindEnum,
      nullable: false,
      resolve: (a) => a.kind.toUpperCase() as Uppercase<HelpAskDetail['kind']>,
    }),
    status: t.field({
      type: HelpAskStatusEnum,
      nullable: false,
      resolve: (a) => a.status.toUpperCase() as Uppercase<HelpAskDetail['status']>,
    }),
    question: t.exposeString('question', { nullable: false }),
    requestMessage: t.exposeString('requestMessage', { nullable: true }),
    reach: t.field({
      type: HelpReachEnum,
      nullable: true,
      resolve: (a) => (a.reach ? (a.reach.toUpperCase() as 'MATCHED' | 'ORGANIZATION') : null),
    }),
    anonymousUntilAccepted: t.exposeBoolean('anonymousUntilAccepted', { nullable: false }),
    asker: t.field({ type: HelpProfileRef, nullable: false, resolve: (a) => a.asker }),
    recipient: t.field({
      type: HelpProfileRef,
      nullable: true,
      resolve: (a) => (a.recipient ? identifiedToPreview(a.recipient) : null),
    }),
    declineReasonCode: t.exposeString('declineReasonCode', { nullable: true }),
    declineNote: t.exposeString('declineNote', { nullable: true }),
    closureReason: t.exposeString('closureReason', { nullable: true }),
    outcomeNote: t.exposeString('outcomeNote', { nullable: true }),
    conversationId: t.exposeID('conversationId', { nullable: true }),
    offerCount: t.int({ nullable: false, resolve: (a) => a.offers.length }),
    acceptedAt: t.exposeString('acceptedAt', { nullable: true }),
    endedAt: t.exposeString('endedAt', { nullable: true }),
    expiresAt: t.exposeString('expiresAt', { nullable: false }),
    createdAt: t.exposeString('createdAt', { nullable: false }),
  }),
})

const HelpHomeRef = builder.objectRef<HelpHome>('HelpHome')
HelpHomeRef.implement({
  description: "The viewer's Help hub state — capacity, availability, and pause status.",
  fields: (t) => ({
    membershipId: t.exposeID('membershipId', { nullable: false }),
    organizationId: t.exposeID('organizationId', { nullable: false }),
    activeAskCount: t.exposeInt('activeAskCount', { nullable: false }),
    activeAskLimit: t.exposeInt('activeAskLimit', { nullable: false }),
    openToHelp: t.exposeBoolean('openToHelp', { nullable: false }),
    pausedAt: t.exposeString('pausedAt', { nullable: true }),
    pauseReason: t.string({ nullable: true, resolve: (h) => h.pauseReason }),
    helperTopics: t.exposeStringList('helperTopics', { nullable: false }),
  }),
})

// Pothos supplies the connection's default page size; we only cap it.
const MAX_LIMIT = 50

async function viewerMembershipId(ctx: { supabase: Parameters<typeof getMemberContext>[0] }) {
  const context = await getMemberContext(ctx.supabase)
  return context.selectedMembershipId ?? context.memberships[0]?.membershipId ?? null
}

builder.queryFields((t) => ({
  /** The viewer's Help hub state, or null when unauthenticated / no membership. */
  helpHome: t.field({
    type: HelpHomeRef,
    nullable: true,
    resolve: async (_root, _args, ctx): Promise<HelpHome | null> => {
      if (!ctx.session) return null
      const membershipId = await viewerMembershipId(ctx)
      if (!membershipId) return null
      return createHelpRepository(ctx.supabase).getHome(membershipId)
    },
  }),

  /** A single Ask by id. RLS decides visibility; null when hidden or missing. */
  ask: t.field({
    type: HelpAskDetailRef,
    nullable: true,
    args: { id: t.arg.id({ required: true }) },
    resolve: async (_root, { id }, ctx): Promise<HelpAskDetail | null> => {
      if (!ctx.session) return null
      return createHelpRepository(ctx.supabase).getAskDetail(String(id))
    },
  }),

  /**
   * The viewer's own Asks, newest first, as a cursor connection over v2's
   * HelpCursor. Forward-only: the RPC accepts a single cursor + limit.
   */
  myAsksConnection: t.connection(
    {
      type: HelpAskSummaryRef,
      resolve: async (_root, args, ctx) => {
        const toCursor = (a: HelpAskSummary) =>
          encodeHelpCursor({ createdAt: a.createdAt, id: a.id })
        const empty = () => resolveCursorConnection({ args, toCursor }, () => [])
        if (!ctx.session) return empty()
        const membershipId = await viewerMembershipId(ctx)
        if (!membershipId) return empty()
        const repo = createHelpRepository(ctx.supabase)

        return resolveCursorConnection(
          { args, toCursor },
          ({ after, limit }: ResolveCursorConnectionArgs) =>
            repo.listMyAsks({
              membershipId,
              // Invalid/absent cursors decode to null — the repo treats that as
              // "from the beginning" rather than erroring.
              cursor: decodeHelpCursor(after),
              limit: Math.min(limit, MAX_LIMIT),
            }),
        )
      },
    },
    { name: 'HelpAskConnection' },
    { name: 'HelpAskEdge' },
  ),
}))
