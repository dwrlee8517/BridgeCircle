import { createHelpRepository } from '@/db/repositories/help'
import { getMemberContext } from '@/db/repositories/member-context'
import type {
  CreateHelpAskResult,
  CreateHelpOfferResult,
  HelpAskDecisionResult,
  HelpOfferDecisionResult,
  HelpReach,
  SaveHelperPreferencesResult,
} from '@/lib/help/contracts'
import { builder } from '../builder'

/**
 * Help commands — the side-effecting half of the core loop, delegating to
 * `db/repositories/help` (create_direct_ask / create_circle_ask /
 * respond_to_direct_ask / retract_ask / resolve_ask / offer_to_help /
 * decide_offer / save_helper_preferences).
 *
 * Two contract decisions worth knowing:
 *
 * 1. **Status, not ok/error.** v2 returns `status`-discriminated results
 *    (`created` | `existing` | `idempotency_conflict` | `invalid_input` |
 *    `not_available` …). Those statuses ARE the contract, so payloads expose
 *    them verbatim (uppercased) rather than collapsing to a boolean — callers
 *    need to distinguish "already decided" from "invalid" from "created".
 * 2. **Client-supplied idempotency keys.** `clientRequestId` / `clientNonce`
 *    are required args, not server-generated: they only make retries safe if
 *    the *client* reuses the same key across attempts. The RPCs enforce this
 *    transactionally and report `IDEMPOTENCY_CONFLICT` on key reuse with
 *    different inputs.
 *
 * Every command runs under the caller's RLS-scoped client; the membership is
 * resolved server-side and never accepted from the client.
 */

// ACTIVE_LIMIT_REACHED / HELPER_LIMIT_REACHED are the capacity valves: v2
// enforces the active-ask cap transactionally, so clients must handle them as
// first-class outcomes rather than generic failures.
const CreateAskStatus = builder.enumType('CreateAskStatus', {
  values: [
    'CREATED',
    'EXISTING',
    'IDEMPOTENCY_CONFLICT',
    'ACTIVE_LIMIT_REACHED',
    'HELPER_LIMIT_REACHED',
    'INVALID_INPUT',
    'NOT_AVAILABLE',
  ] as const,
})

const AskDecisionStatus = builder.enumType('AskDecisionStatus', {
  values: [
    'ACCEPTED',
    'DECLINED',
    'RETRACTED',
    'RESOLVED',
    'ALREADY_DECIDED',
    'INVALID_INPUT',
    'NOT_AVAILABLE',
  ] as const,
})

const CreateOfferStatus = builder.enumType('CreateOfferStatus', {
  values: [
    'CREATED',
    'EXISTING',
    'IDEMPOTENCY_CONFLICT',
    'INVALID_INPUT',
    'NOT_AVAILABLE',
  ] as const,
})

const OfferDecisionStatus = builder.enumType('OfferDecisionStatus', {
  values: ['ACCEPTED', 'DECLINED', 'ALREADY_DECIDED', 'INVALID_INPUT', 'NOT_AVAILABLE'] as const,
})

const SavePreferencesStatus = builder.enumType('SavePreferencesStatus', {
  values: ['SAVED', 'INVALID_INPUT', 'NOT_AVAILABLE'] as const,
})

const HelpReachInput = builder.enumType('HelpReachInput', {
  values: ['MATCHED', 'ORGANIZATION'] as const,
})

const AskDecisionInput = builder.enumType('AskDecisionInput', {
  values: ['ACCEPT', 'DECLINE'] as const,
})

const AskDeclineReason = builder.enumType('AskDeclineReason', {
  values: ['UNAVAILABLE', 'OUTSIDE_EXPERTISE', 'OTHER'] as const,
})

const OfferDeclineReason = builder.enumType('OfferDeclineReason', {
  values: ['WENT_ANOTHER_DIRECTION', 'NOT_RIGHT_FIT', 'OTHER'] as const,
})

const upper = <T extends string>(v: T) => v.toUpperCase() as Uppercase<T>

const CreateAskPayload = builder.objectRef<CreateHelpAskResult>('CreateAskPayload')
CreateAskPayload.implement({
  fields: (t) => ({
    status: t.field({ type: CreateAskStatus, nullable: false, resolve: (r) => upper(r.status) }),
    askId: t.id({ nullable: true, resolve: (r) => r.askId }),
    activeCount: t.int({ nullable: false, resolve: (r) => r.activeCount }),
    created: t.boolean({ nullable: false, resolve: (r) => r.created }),
  }),
})

const AskDecisionPayload = builder.objectRef<HelpAskDecisionResult>('AskDecisionPayload')
AskDecisionPayload.implement({
  fields: (t) => ({
    status: t.field({ type: AskDecisionStatus, nullable: false, resolve: (r) => upper(r.status) }),
    askId: t.id({ nullable: true, resolve: (r) => r.askId }),
    // Set only when a decision opened a conversation (accept paths).
    conversationId: t.id({ nullable: true, resolve: (r) => r.conversationId }),
  }),
})

const CreateOfferPayload = builder.objectRef<CreateHelpOfferResult>('CreateOfferPayload')
CreateOfferPayload.implement({
  fields: (t) => ({
    status: t.field({ type: CreateOfferStatus, nullable: false, resolve: (r) => upper(r.status) }),
    askId: t.id({ nullable: true, resolve: (r) => r.askId }),
    offerId: t.id({ nullable: true, resolve: (r) => r.offerId }),
    created: t.boolean({ nullable: false, resolve: (r) => r.created }),
  }),
})

const OfferDecisionPayload = builder.objectRef<HelpOfferDecisionResult>('OfferDecisionPayload')
OfferDecisionPayload.implement({
  fields: (t) => ({
    status: t.field({
      type: OfferDecisionStatus,
      nullable: false,
      resolve: (r) => upper(r.status),
    }),
    askId: t.id({ nullable: true, resolve: (r) => r.askId }),
    offerId: t.id({ nullable: true, resolve: (r) => r.offerId }),
    conversationId: t.id({ nullable: true, resolve: (r) => r.conversationId }),
  }),
})

const SavePreferencesPayload = builder.objectRef<SaveHelperPreferencesResult>(
  'SaveHelperPreferencesPayload',
)
SavePreferencesPayload.implement({
  fields: (t) => ({
    status: t.field({
      type: SavePreferencesStatus,
      nullable: false,
      resolve: (r) => upper(r.status),
    }),
    openToHelp: t.boolean({ nullable: false, resolve: (r) => r.openToHelp }),
    pausedAt: t.string({ nullable: true, resolve: (r) => r.pausedAt }),
    pauseReason: t.string({ nullable: true, resolve: (r) => r.pauseReason }),
    topics: t.stringList({ nullable: false, resolve: (r) => r.topics }),
  }),
})

/** Shape returned when the caller has no usable membership — mirrors v2's own
 * `not_available` terminal so clients handle one vocabulary, not two. */
const NO_MEMBERSHIP: {
  ask: CreateHelpAskResult
  offer: CreateHelpOfferResult
  prefs: SaveHelperPreferencesResult
} = {
  ask: { status: 'not_available', askId: null, activeCount: 0, created: false },
  offer: { status: 'not_available', askId: null, offerId: null, created: false },
  prefs: {
    status: 'not_available',
    openToHelp: false,
    pausedAt: null,
    pauseReason: null,
    topics: [],
  },
}

async function viewerMembershipId(supabase: Parameters<typeof getMemberContext>[0]) {
  const context = await getMemberContext(supabase)
  return context.selectedMembershipId ?? context.memberships[0]?.membershipId ?? null
}

builder.mutationType({})

builder.mutationFields((t) => ({
  /** Ask a specific member directly. `clientRequestId` makes retries idempotent. */
  createDirectAsk: t.field({
    type: CreateAskPayload,
    nullable: false,
    args: {
      recipientMembershipId: t.arg.id({ required: true }),
      question: t.arg.string({ required: true }),
      requestMessage: t.arg.string({ required: true }),
      clientRequestId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx): Promise<CreateHelpAskResult> => {
      if (!ctx.session) return NO_MEMBERSHIP.ask
      const membershipId = await viewerMembershipId(ctx.supabase)
      if (!membershipId) return NO_MEMBERSHIP.ask
      return createHelpRepository(ctx.supabase).createDirectAsk({
        membershipId,
        recipientMembershipId: String(args.recipientMembershipId),
        question: args.question,
        requestMessage: args.requestMessage,
        clientRequestId: args.clientRequestId,
      })
    },
  }),

  /** Ask the circle. `reach` decides matched-only vs org-wide fan-out. */
  createCircleAsk: t.field({
    type: CreateAskPayload,
    nullable: false,
    args: {
      question: t.arg.string({ required: true }),
      reach: t.arg({ type: HelpReachInput, required: true }),
      anonymousUntilAccepted: t.arg.boolean({ required: true }),
      clientRequestId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx): Promise<CreateHelpAskResult> => {
      if (!ctx.session) return NO_MEMBERSHIP.ask
      const membershipId = await viewerMembershipId(ctx.supabase)
      if (!membershipId) return NO_MEMBERSHIP.ask
      return createHelpRepository(ctx.supabase).createCircleAsk({
        membershipId,
        question: args.question,
        reach: args.reach.toLowerCase() as HelpReach,
        anonymousUntilAccepted: args.anonymousUntilAccepted,
        clientRequestId: args.clientRequestId,
      })
    },
  }),

  /** Accept or decline a direct Ask addressed to the caller. */
  respondToDirectAsk: t.field({
    type: AskDecisionPayload,
    nullable: false,
    args: {
      askId: t.arg.id({ required: true }),
      decision: t.arg({ type: AskDecisionInput, required: true }),
      openingMessage: t.arg.string({ required: false }),
      declineReasonCode: t.arg({ type: AskDeclineReason, required: false }),
      declineNote: t.arg.string({ required: false }),
      clientNonce: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx): Promise<HelpAskDecisionResult> => {
      if (!ctx.session) {
        return { status: 'not_available', askId: null, conversationId: null }
      }
      return createHelpRepository(ctx.supabase).respondToDirectAsk({
        askId: String(args.askId),
        decision: args.decision === 'ACCEPT' ? 'accept' : 'decline',
        openingMessage: args.openingMessage ?? null,
        declineReasonCode: args.declineReasonCode
          ? (args.declineReasonCode.toLowerCase() as 'unavailable' | 'outside_expertise' | 'other')
          : null,
        declineNote: args.declineNote ?? null,
        clientNonce: args.clientNonce ?? null,
      })
    },
  }),

  /** Withdraw the caller's own Ask. */
  retractAsk: t.field({
    type: AskDecisionPayload,
    nullable: false,
    args: { askId: t.arg.id({ required: true }) },
    resolve: async (_root, args, ctx): Promise<HelpAskDecisionResult> => {
      if (!ctx.session) {
        return { status: 'not_available', askId: null, conversationId: null }
      }
      return createHelpRepository(ctx.supabase).retractAsk(String(args.askId))
    },
  }),

  /** Close out an Ask the caller opened, optionally recording an outcome. */
  resolveAsk: t.field({
    type: AskDecisionPayload,
    nullable: false,
    args: {
      askId: t.arg.id({ required: true }),
      outcomeNote: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx): Promise<HelpAskDecisionResult> => {
      if (!ctx.session) {
        return { status: 'not_available', askId: null, conversationId: null }
      }
      return createHelpRepository(ctx.supabase).resolveAsk({
        askId: String(args.askId),
        outcomeNote: args.outcomeNote ?? null,
      })
    },
  }),

  /** Offer to help on a circle Ask. */
  offerToHelp: t.field({
    type: CreateOfferPayload,
    nullable: false,
    args: {
      askId: t.arg.id({ required: true }),
      offerNote: t.arg.string({ required: true }),
      clientRequestId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx): Promise<CreateHelpOfferResult> => {
      if (!ctx.session) return NO_MEMBERSHIP.offer
      const membershipId = await viewerMembershipId(ctx.supabase)
      if (!membershipId) return NO_MEMBERSHIP.offer
      return createHelpRepository(ctx.supabase).offerToHelp({
        askId: String(args.askId),
        membershipId,
        offerNote: args.offerNote,
        clientRequestId: args.clientRequestId,
      })
    },
  }),

  /** Accept or decline an offer on the caller's Ask. */
  decideOffer: t.field({
    type: OfferDecisionPayload,
    nullable: false,
    args: {
      offerId: t.arg.id({ required: true }),
      decision: t.arg({ type: AskDecisionInput, required: true }),
      openingMessage: t.arg.string({ required: false }),
      declineReasonCode: t.arg({ type: OfferDeclineReason, required: false }),
      declineNote: t.arg.string({ required: false }),
      clientNonce: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx): Promise<HelpOfferDecisionResult> => {
      if (!ctx.session) {
        return { status: 'not_available', askId: null, offerId: null, conversationId: null }
      }
      return createHelpRepository(ctx.supabase).decideOffer({
        offerId: String(args.offerId),
        decision: args.decision === 'ACCEPT' ? 'accept' : 'decline',
        openingMessage: args.openingMessage ?? null,
        declineReasonCode: args.declineReasonCode
          ? (args.declineReasonCode.toLowerCase() as
              | 'went_another_direction'
              | 'not_right_fit'
              | 'other')
          : null,
        declineNote: args.declineNote ?? null,
        clientNonce: args.clientNonce ?? null,
      })
    },
  }),

  /** Set the caller's Help availability and topics. */
  saveHelperPreferences: t.field({
    type: SavePreferencesPayload,
    nullable: false,
    args: {
      openToHelp: t.arg.boolean({ required: true }),
      topics: t.arg.stringList({ required: true }),
    },
    resolve: async (_root, args, ctx): Promise<SaveHelperPreferencesResult> => {
      if (!ctx.session) return NO_MEMBERSHIP.prefs
      const membershipId = await viewerMembershipId(ctx.supabase)
      if (!membershipId) return NO_MEMBERSHIP.prefs
      return createHelpRepository(ctx.supabase).saveHelperPreferences({
        membershipId,
        openToHelp: args.openToHelp,
        topics: args.topics,
      })
    },
  }),
}))
