import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'
import type {
  CreateHelpAskResult,
  CreateHelpOfferResult,
  GiveHelpItem,
  HelpAiBudgetResult,
  HelpAskDecisionResult,
  HelpAskDetail,
  HelpAskSummary,
  HelpCandidate,
  HelperPreferences,
  HelpHome,
  HelpOfferDecisionResult,
  HelpProfilePreview,
  HelpRepository,
  IdentifiedHelpProfile,
  SaveHelperPreferencesResult,
} from '@/lib/help/contracts'

const timestampSchema = z.string().refine((value) => Number.isFinite(Date.parse(value)))
const pauseReasonSchema = z.enum(['manual', 'unresponsive', 'admin']).nullable()
const askKindSchema = z.enum(['direct', 'circle'])
const askStatusSchema = z.enum([
  'waiting',
  'open',
  'accepted',
  'declined',
  'retracted',
  'resolved',
  'closed',
])
const offerStatusSchema = z.enum(['pending', 'accepted', 'declined', 'closed'])
const reachSchema = z.enum(['matched', 'organization'])

const identifiedProfileSchema = z
  .object({
    userId: z.guid(),
    displayName: z.string().min(1),
    headline: z.string().nullable(),
    avatarPath: z.string().nullable(),
    graduationYear: z.number().int().nullable(),
  })
  .strict()

const anonymousProfileSchema = z
  .object({
    displayName: z.literal('A member'),
    graduationYear: z.number().int().nullable(),
  })
  .strict()

const recentAskSchema = z
  .object({
    askId: z.guid(),
    kind: askKindSchema,
    status: askStatusSchema,
    question: z.string().min(1),
    createdAt: timestampSchema,
    expiresAt: timestampSchema,
  })
  .strict()

const directRequestSchema = z
  .object({
    askId: z.guid(),
    question: z.string().min(1),
    requestMessage: z.string().min(1),
    asker: identifiedProfileSchema,
    createdAt: timestampSchema,
    expiresAt: timestampSchema,
  })
  .strict()

const suggestedAskSchema = z
  .object({
    askId: z.guid(),
    question: z.string().min(1),
    anonymousUntilAccepted: z.boolean(),
    asker: z.union([identifiedProfileSchema, anonymousProfileSchema]),
    matchReason: z.string().min(1),
    createdAt: timestampSchema,
    expiresAt: timestampSchema,
  })
  .strict()

const homeRowSchema = z
  .object({
    membership_id: z.guid(),
    organization_id: z.guid(),
    active_ask_count: z.number().int().nonnegative(),
    active_ask_limit: z.number().int().positive(),
    open_to_help: z.boolean(),
    paused_at: timestampSchema.nullable(),
    pause_reason: pauseReasonSchema,
    helper_topics: z.array(z.string().min(1).max(100)).max(5),
    recent_asks: z.array(recentAskSchema),
    direct_requests: z.array(directRequestSchema),
    suggested_asks: z.array(suggestedAskSchema),
  })
  .strict()

const candidateRowSchema = z
  .object({
    helper_membership_id: z.guid(),
    helper_user_id: z.guid(),
    display_name: z.string().min(1),
    headline: z.string().nullable(),
    avatar_path: z.string().nullable(),
    graduation_year: z.number().int().nullable(),
    topics: z.array(z.string().min(1).max(100)).max(5),
    lexical_score: z.number().finite().nonnegative(),
    semantic_score: z.number().finite(),
    match_reason: z.string().min(1),
    evidence_chunk_ids: z.array(z.guid()),
  })
  .strict()

const offerSchema = z
  .object({
    offerId: z.guid(),
    status: offerStatusSchema,
    offerNote: z.string().min(1),
    declineReasonCode: z.string().nullable(),
    declineNote: z.string().nullable(),
    closureReason: z.string().nullable(),
    createdAt: timestampSchema,
    helper: identifiedProfileSchema,
  })
  .strict()

const historySchema = z
  .object({
    eventId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    type: z.enum([
      'created',
      'reminded',
      'accepted',
      'declined',
      'retracted',
      'closed',
      'resolved',
      'offer_created',
      'offer_declined',
      'offer_closed',
    ]),
    createdAt: timestampSchema,
  })
  .strict()

const askDetailRowSchema = z
  .object({
    ask_id: z.guid(),
    organization_id: z.guid(),
    kind: askKindSchema,
    status: askStatusSchema,
    question: z.string().min(1),
    request_message: z.string().nullable(),
    reach: reachSchema.nullable(),
    anonymous_until_accepted: z.boolean(),
    asker_preview: z.union([identifiedProfileSchema, anonymousProfileSchema]),
    recipient_preview: identifiedProfileSchema.nullable(),
    decline_reason_code: z.string().nullable(),
    decline_note: z.string().nullable(),
    closure_reason: z.string().nullable(),
    outcome_note: z.string().nullable(),
    conversation_id: z.guid().nullable(),
    offers: z.array(offerSchema),
    history: z.array(historySchema),
    accepted_at: timestampSchema.nullable(),
    ended_at: timestampSchema.nullable(),
    expires_at: timestampSchema,
    created_at: timestampSchema,
  })
  .strict()

const askSummaryRowSchema = z
  .object({
    ask_id: z.guid(),
    organization_id: z.guid(),
    kind: askKindSchema,
    status: askStatusSchema,
    question: z.string().min(1),
    recipient_preview: identifiedProfileSchema.nullable(),
    offer_count: z.number().int().nonnegative(),
    conversation_id: z.guid().nullable(),
    created_at: timestampSchema,
    expires_at: timestampSchema,
    ended_at: timestampSchema.nullable(),
  })
  .strict()

const giveRowSchema = z
  .object({
    ask_id: z.guid(),
    organization_id: z.guid(),
    kind: askKindSchema,
    status: askStatusSchema,
    question: z.string().min(1),
    reach: reachSchema.nullable(),
    anonymous_until_accepted: z.boolean(),
    asker_user_id: z.guid().nullable(),
    asker_display_name: z.string().nullable(),
    asker_avatar_path: z.string().nullable(),
    asker_graduation_year: z.number().int().nullable(),
    match_reason: z.string().nullable(),
    my_offer_status: offerStatusSchema.nullable(),
    created_at: timestampSchema,
    expires_at: timestampSchema,
  })
  .strict()

const preferencesRowSchema = z
  .object({
    membership_id: z.guid(),
    organization_id: z.guid(),
    open_to_help: z.boolean(),
    max_pending_requests: z.number().int().positive(),
    consecutive_timeouts: z.number().int().min(0).max(3),
    paused_at: timestampSchema.nullable(),
    pause_reason: pauseReasonSchema,
    topics: z.array(z.string().min(1).max(100)).max(5),
  })
  .strict()

const createAskRowSchema = z
  .object({
    result_code: z.enum([
      'created',
      'existing',
      'idempotency_conflict',
      'active_limit_reached',
      'helper_limit_reached',
      'invalid_input',
      'not_available',
    ]),
    ask_id: z.guid().nullable(),
    active_count: z.number().int().nonnegative(),
    created: z.boolean(),
  })
  .strict()

const askDecisionRowSchema = z
  .object({
    result_code: z.enum([
      'accepted',
      'declined',
      'retracted',
      'resolved',
      'already_decided',
      'invalid_input',
      'not_available',
    ]),
    ask_id: z.guid().nullable(),
    conversation_id: z.guid().nullable(),
  })
  .strict()

const createOfferRowSchema = z
  .object({
    result_code: z.enum([
      'created',
      'existing',
      'idempotency_conflict',
      'invalid_input',
      'not_available',
    ]),
    ask_id: z.guid().nullable(),
    offer_id: z.guid().nullable(),
    created: z.boolean(),
  })
  .strict()

const offerDecisionRowSchema = z
  .object({
    result_code: z.enum([
      'accepted',
      'declined',
      'already_decided',
      'invalid_input',
      'not_available',
    ]),
    ask_id: z.guid().nullable(),
    offer_id: z.guid().nullable(),
    conversation_id: z.guid().nullable(),
  })
  .strict()

const savePreferencesRowSchema = z
  .object({
    result_code: z.enum(['saved', 'invalid_input', 'not_available']),
    open_to_help: z.boolean(),
    paused_at: timestampSchema.nullable(),
    pause_reason: pauseReasonSchema,
    topics: z.array(z.string().min(1).max(100)).max(5),
  })
  .strict()

const aiBudgetRowSchema = z
  .object({
    result_code: z.enum(['allowed', 'limited', 'not_available']),
    remaining: z.number().int().nonnegative(),
    resets_at: timestampSchema,
  })
  .strict()

function contractError(operation: string, detail: string): never {
  throw new Error(`Help ${operation} contract violated: ${detail}`)
}

function transportError(operation: string, error: { code?: string } | null): never {
  const code = error?.code ? ` (${error.code})` : ''
  throw new Error(`Help ${operation} transport failed${code}`)
}

function profile(value: unknown): HelpProfilePreview {
  const identified = identifiedProfileSchema.safeParse(value)
  if (identified.success) {
    return { identity: 'identified', ...identified.data }
  }
  const anonymous = anonymousProfileSchema.parse(value)
  return { identity: 'anonymous', ...anonymous }
}

function identifiedProfile(value: unknown): IdentifiedHelpProfile {
  return { identity: 'identified', ...identifiedProfileSchema.parse(value) }
}

export function parseHelpHomeRow(row: unknown): HelpHome {
  const parsed = homeRowSchema.parse(row)
  return {
    membershipId: parsed.membership_id,
    organizationId: parsed.organization_id,
    activeAskCount: parsed.active_ask_count,
    activeAskLimit: parsed.active_ask_limit,
    openToHelp: parsed.open_to_help,
    pausedAt: parsed.paused_at,
    pauseReason: parsed.pause_reason,
    helperTopics: parsed.helper_topics,
    recentAsks: parsed.recent_asks,
    directRequests: parsed.direct_requests.map((item) => ({
      ...item,
      asker: identifiedProfile(item.asker),
    })),
    suggestedAsks: parsed.suggested_asks.map((item) => ({ ...item, asker: profile(item.asker) })),
  }
}

export function parseHelpCandidateRow(row: unknown): HelpCandidate {
  const parsed = candidateRowSchema.parse(row)
  return {
    membershipId: parsed.helper_membership_id,
    userId: parsed.helper_user_id,
    displayName: parsed.display_name,
    headline: parsed.headline,
    avatarPath: parsed.avatar_path,
    graduationYear: parsed.graduation_year,
    topics: parsed.topics,
    lexicalScore: parsed.lexical_score,
    semanticScore: parsed.semantic_score,
    matchReason: parsed.match_reason,
    evidenceChunkIds: parsed.evidence_chunk_ids,
  }
}

export function parseHelpAskDetailRow(row: unknown): HelpAskDetail {
  const parsed = askDetailRowSchema.parse(row)
  return {
    id: parsed.ask_id,
    organizationId: parsed.organization_id,
    kind: parsed.kind,
    status: parsed.status,
    question: parsed.question,
    requestMessage: parsed.request_message,
    reach: parsed.reach,
    anonymousUntilAccepted: parsed.anonymous_until_accepted,
    asker: profile(parsed.asker_preview),
    recipient: parsed.recipient_preview ? identifiedProfile(parsed.recipient_preview) : null,
    declineReasonCode: parsed.decline_reason_code,
    declineNote: parsed.decline_note,
    closureReason: parsed.closure_reason,
    outcomeNote: parsed.outcome_note,
    conversationId: parsed.conversation_id,
    offers: parsed.offers.map((offer) => ({
      id: offer.offerId,
      status: offer.status,
      offerNote: offer.offerNote,
      declineReasonCode: offer.declineReasonCode,
      declineNote: offer.declineNote,
      closureReason: offer.closureReason,
      createdAt: offer.createdAt,
      helper: identifiedProfile(offer.helper),
    })),
    history: parsed.history.map((event) => ({
      id: event.eventId,
      type: event.type,
      createdAt: event.createdAt,
    })),
    acceptedAt: parsed.accepted_at,
    endedAt: parsed.ended_at,
    expiresAt: parsed.expires_at,
    createdAt: parsed.created_at,
  }
}

export function parseHelpAskSummaryRow(row: unknown): HelpAskSummary {
  const parsed = askSummaryRowSchema.parse(row)
  return {
    id: parsed.ask_id,
    organizationId: parsed.organization_id,
    kind: parsed.kind,
    status: parsed.status,
    question: parsed.question,
    recipient: parsed.recipient_preview ? identifiedProfile(parsed.recipient_preview) : null,
    offerCount: parsed.offer_count,
    conversationId: parsed.conversation_id,
    createdAt: parsed.created_at,
    expiresAt: parsed.expires_at,
    endedAt: parsed.ended_at,
  }
}

export function parseGiveHelpRow(row: unknown): GiveHelpItem {
  const parsed = giveRowSchema.parse(row)
  let asker: HelpProfilePreview
  if (parsed.asker_user_id) {
    if (!parsed.asker_display_name)
      return contractError('giveHelp', 'identified asker without name')
    asker = {
      identity: 'identified',
      userId: parsed.asker_user_id,
      displayName: parsed.asker_display_name,
      headline: null,
      avatarPath: parsed.asker_avatar_path,
      graduationYear: parsed.asker_graduation_year,
    }
  } else {
    if (parsed.asker_display_name || parsed.asker_avatar_path) {
      return contractError('giveHelp', 'anonymous asker leaked identity fields')
    }
    asker = {
      identity: 'anonymous',
      displayName: 'A member',
      graduationYear: parsed.asker_graduation_year,
    }
  }
  return {
    id: parsed.ask_id,
    organizationId: parsed.organization_id,
    kind: parsed.kind,
    status: parsed.status,
    question: parsed.question,
    reach: parsed.reach,
    anonymousUntilAccepted: parsed.anonymous_until_accepted,
    asker,
    matchReason: parsed.match_reason,
    myOfferStatus: parsed.my_offer_status,
    createdAt: parsed.created_at,
    expiresAt: parsed.expires_at,
  }
}

export function parseHelperPreferencesRow(row: unknown): HelperPreferences {
  const parsed = preferencesRowSchema.parse(row)
  if ((parsed.paused_at === null) !== (parsed.pause_reason === null)) {
    return contractError('preferences', 'pause timestamp/reason mismatch')
  }
  return {
    membershipId: parsed.membership_id,
    organizationId: parsed.organization_id,
    openToHelp: parsed.open_to_help,
    maxPendingRequests: parsed.max_pending_requests,
    consecutiveTimeouts: parsed.consecutive_timeouts,
    pausedAt: parsed.paused_at,
    pauseReason: parsed.pause_reason,
    topics: parsed.topics,
  }
}

export function parseCreateHelpAskRow(row: unknown): CreateHelpAskResult {
  const parsed = createAskRowSchema.parse(row)
  if (parsed.result_code === 'created' || parsed.result_code === 'existing') {
    if (!parsed.ask_id || parsed.created !== (parsed.result_code === 'created')) {
      return contractError('createAsk', 'success shape')
    }
    return {
      status: parsed.result_code,
      askId: parsed.ask_id,
      activeCount: parsed.active_count,
      created: parsed.created,
    }
  }
  if (parsed.result_code === 'idempotency_conflict') {
    if (!parsed.ask_id || parsed.created) return contractError('createAsk', 'conflict shape')
    return {
      status: 'idempotency_conflict',
      askId: parsed.ask_id,
      activeCount: parsed.active_count,
      created: false,
    }
  }
  if (parsed.ask_id || parsed.created) return contractError('createAsk', 'denial leaked Ask')
  return {
    status: parsed.result_code,
    askId: null,
    activeCount: parsed.active_count,
    created: false,
  }
}

export function parseHelpAskDecisionRow(row: unknown): HelpAskDecisionResult {
  const parsed = askDecisionRowSchema.parse(row)
  if (
    parsed.result_code === 'accepted' ||
    parsed.result_code === 'declined' ||
    parsed.result_code === 'retracted' ||
    parsed.result_code === 'resolved'
  ) {
    if (!parsed.ask_id) return contractError('askDecision', 'success without Ask')
    if (
      (parsed.result_code === 'accepted' || parsed.result_code === 'resolved') &&
      !parsed.conversation_id
    ) {
      return contractError('askDecision', 'conversation success without conversation')
    }
    if (
      (parsed.result_code === 'declined' || parsed.result_code === 'retracted') &&
      parsed.conversation_id
    ) {
      return contractError('askDecision', 'terminal result included conversation')
    }
    return {
      status: parsed.result_code,
      askId: parsed.ask_id,
      conversationId: parsed.conversation_id,
    }
  }
  if (parsed.result_code === 'already_decided') {
    if (!parsed.ask_id || parsed.conversation_id)
      return contractError('askDecision', 'already-decided shape')
    return { status: 'already_decided', askId: parsed.ask_id, conversationId: null }
  }
  if (parsed.result_code !== 'invalid_input' && parsed.result_code !== 'not_available') {
    return contractError('askDecision', 'unknown denial')
  }
  if (parsed.ask_id || parsed.conversation_id)
    return contractError('askDecision', 'denial leaked IDs')
  return { status: parsed.result_code, askId: null, conversationId: null }
}

export function parseCreateHelpOfferRow(row: unknown): CreateHelpOfferResult {
  const parsed = createOfferRowSchema.parse(row)
  if (parsed.result_code === 'created' || parsed.result_code === 'existing') {
    if (
      !parsed.ask_id ||
      !parsed.offer_id ||
      parsed.created !== (parsed.result_code === 'created')
    ) {
      return contractError('createOffer', 'success shape')
    }
    return {
      status: parsed.result_code,
      askId: parsed.ask_id,
      offerId: parsed.offer_id,
      created: parsed.created,
    }
  }
  if (parsed.result_code === 'idempotency_conflict') {
    if (!parsed.ask_id || parsed.offer_id || parsed.created) {
      return contractError('createOffer', 'conflict shape')
    }
    return { status: 'idempotency_conflict', askId: parsed.ask_id, offerId: null, created: false }
  }
  if (parsed.ask_id || parsed.offer_id || parsed.created) {
    return contractError('createOffer', 'denial leaked IDs')
  }
  return { status: parsed.result_code, askId: null, offerId: null, created: false }
}

export function parseHelpOfferDecisionRow(row: unknown): HelpOfferDecisionResult {
  const parsed = offerDecisionRowSchema.parse(row)
  if (parsed.result_code === 'accepted' || parsed.result_code === 'declined') {
    if (!parsed.ask_id || !parsed.offer_id)
      return contractError('offerDecision', 'success without IDs')
    if (parsed.result_code === 'accepted' && !parsed.conversation_id) {
      return contractError('offerDecision', 'accept without conversation')
    }
    if (parsed.result_code === 'declined' && parsed.conversation_id) {
      return contractError('offerDecision', 'decline included conversation')
    }
    return {
      status: parsed.result_code,
      askId: parsed.ask_id,
      offerId: parsed.offer_id,
      conversationId: parsed.conversation_id,
    }
  }
  if (parsed.result_code === 'already_decided') {
    if (!parsed.ask_id || !parsed.offer_id || parsed.conversation_id) {
      return contractError('offerDecision', 'already-decided shape')
    }
    return {
      status: 'already_decided',
      askId: parsed.ask_id,
      offerId: parsed.offer_id,
      conversationId: null,
    }
  }
  if (parsed.ask_id || parsed.offer_id || parsed.conversation_id) {
    return contractError('offerDecision', 'denial leaked IDs')
  }
  return { status: parsed.result_code, askId: null, offerId: null, conversationId: null }
}

export function parseSaveHelperPreferencesRow(row: unknown): SaveHelperPreferencesResult {
  const parsed = savePreferencesRowSchema.parse(row)
  if ((parsed.paused_at === null) !== (parsed.pause_reason === null)) {
    return contractError('savePreferences', 'pause timestamp/reason mismatch')
  }
  return {
    status: parsed.result_code,
    openToHelp: parsed.open_to_help,
    pausedAt: parsed.paused_at,
    pauseReason: parsed.pause_reason,
    topics: parsed.topics,
  }
}

export function parseHelpAiBudgetRow(row: unknown): HelpAiBudgetResult {
  const parsed = aiBudgetRowSchema.parse(row)
  if (parsed.result_code !== 'allowed' && parsed.remaining !== 0) {
    return contractError('aiBudget', 'denial retained budget')
  }
  if (parsed.result_code === 'allowed') {
    return { status: 'allowed', remaining: parsed.remaining, resetsAt: parsed.resets_at }
  }
  return { status: parsed.result_code, remaining: 0, resetsAt: parsed.resets_at }
}

export function createHelpRepository(memberClient: SupabaseClient<Database>): HelpRepository {
  return {
    async getHome(membershipId) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('get_help_home', { p_membership_id: membershipId })
        .maybeSingle()
      if (error) transportError('getHome', error)
      return data ? parseHelpHomeRow(data) : null
    },

    async searchCandidates(input) {
      const args = {
        p_membership_id: input.membershipId,
        p_question: input.question,
        p_limit: input.limit,
        ...(input.queryEmbedding ? { p_query_embedding: input.queryEmbedding } : {}),
      }
      const { data, error } = await memberClient.schema('api').rpc('search_help_candidates', args)
      if (error) transportError('searchCandidates', error)
      return z.array(z.unknown()).parse(data).map(parseHelpCandidateRow)
    },

    async getAskDetail(askId) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('get_help_ask_detail', { p_ask_id: askId })
        .maybeSingle()
      if (error) transportError('getAskDetail', error)
      return data ? parseHelpAskDetailRow(data) : null
    },

    async listMyAsks(input) {
      const args = {
        p_membership_id: input.membershipId,
        p_limit: input.limit,
        ...(input.cursor
          ? { p_before_created_at: input.cursor.createdAt, p_before_id: input.cursor.id }
          : {}),
      }
      const { data, error } = await memberClient.schema('api').rpc('list_my_asks', args)
      if (error) transportError('listMyAsks', error)
      return z.array(z.unknown()).parse(data).map(parseHelpAskSummaryRow)
    },

    async listGiveHelp(input) {
      const args = {
        p_membership_id: input.membershipId,
        p_arm: input.arm,
        p_limit: input.limit,
        ...(input.query ? { p_query: input.query } : {}),
        ...(input.cursor
          ? { p_before_created_at: input.cursor.createdAt, p_before_id: input.cursor.id }
          : {}),
      }
      const { data, error } = await memberClient.schema('api').rpc('list_give_help', args)
      if (error) transportError('listGiveHelp', error)
      return z.array(z.unknown()).parse(data).map(parseGiveHelpRow)
    },

    async getHelperPreferences(membershipId) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('get_helper_preferences', { p_membership_id: membershipId })
        .maybeSingle()
      if (error) transportError('getHelperPreferences', error)
      return data ? parseHelperPreferencesRow(data) : null
    },

    async saveHelperPreferences(input) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('save_helper_preferences', {
          p_membership_id: input.membershipId,
          p_open_to_help: input.openToHelp,
          p_topics: input.topics,
        })
        .single()
      if (error) transportError('saveHelperPreferences', error)
      return parseSaveHelperPreferencesRow(data)
    },

    async consumeAiBudget(action) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('consume_help_ai_budget', { p_action: action })
        .single()
      if (error) transportError('consumeAiBudget', error)
      return parseHelpAiBudgetRow(data)
    },

    async createDirectAsk(input) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('create_direct_ask', {
          p_asker_membership_id: input.membershipId,
          p_recipient_membership_id: input.recipientMembershipId,
          p_question: input.question,
          p_request_message: input.requestMessage,
          p_client_request_id: input.clientRequestId,
        })
        .single()
      if (error) transportError('createDirectAsk', error)
      return parseCreateHelpAskRow(data)
    },

    async createCircleAsk(input) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('create_circle_ask', {
          p_asker_membership_id: input.membershipId,
          p_question: input.question,
          p_reach: input.reach,
          p_anonymous_until_accepted: input.anonymousUntilAccepted,
          p_client_request_id: input.clientRequestId,
        })
        .single()
      if (error) transportError('createCircleAsk', error)
      return parseCreateHelpAskRow(data)
    },

    async respondToDirectAsk(input) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('respond_to_direct_ask', {
          p_ask_id: input.askId,
          p_decision: input.decision,
          p_opening_message: input.openingMessage ?? undefined,
          p_decline_reason_code: input.declineReasonCode ?? undefined,
          p_decline_note: input.declineNote ?? undefined,
          p_client_nonce: input.clientNonce ?? undefined,
        })
        .single()
      if (error) transportError('respondToDirectAsk', error)
      return parseHelpAskDecisionRow(data)
    },

    async retractAsk(askId) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('retract_ask', { p_ask_id: askId })
        .single()
      if (error) transportError('retractAsk', error)
      return parseHelpAskDecisionRow(data)
    },

    async resolveAsk(input) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('resolve_ask', {
          p_ask_id: input.askId,
          p_outcome_note: input.outcomeNote ?? undefined,
        })
        .single()
      if (error) transportError('resolveAsk', error)
      return parseHelpAskDecisionRow(data)
    },

    async offerToHelp(input) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('offer_to_help', {
          p_ask_id: input.askId,
          p_helper_membership_id: input.membershipId,
          p_offer_note: input.offerNote,
          p_client_request_id: input.clientRequestId,
        })
        .single()
      if (error) transportError('offerToHelp', error)
      return parseCreateHelpOfferRow(data)
    },

    async decideOffer(input) {
      const { data, error } = await memberClient
        .schema('api')
        .rpc('decide_offer', {
          p_offer_id: input.offerId,
          p_decision: input.decision,
          p_opening_message: input.openingMessage ?? undefined,
          p_decline_reason_code: input.declineReasonCode ?? undefined,
          p_decline_note: input.declineNote ?? undefined,
          p_client_nonce: input.clientNonce ?? undefined,
        })
        .single()
      if (error) transportError('decideOffer', error)
      return parseHelpOfferDecisionRow(data)
    },

    async reportOffer(input) {
      const { data, error } = await memberClient.schema('api').rpc('submit_report', {
        p_target_type: 'offer',
        p_target_id: input.offerId,
        p_reason: input.reason,
        p_note: input.note ?? undefined,
      })
      if (error) transportError('reportOffer', error)
      return { reportId: z.guid().parse(data) }
    },

    async reportAsk(input) {
      const { data, error } = await memberClient.schema('api').rpc('submit_report', {
        p_target_type: 'ask',
        p_target_id: input.askId,
        p_reason: input.reason,
        p_note: input.note ?? undefined,
      })
      if (error) transportError('reportAsk', error)
      return { reportId: z.guid().parse(data) }
    },

    async reportMessage(input) {
      const { data, error } = await memberClient.schema('api').rpc('submit_report', {
        p_target_type: 'message',
        p_target_id: String(input.messageId),
        p_reason: input.reason,
        p_note: input.note ?? undefined,
      })
      if (error) transportError('reportMessage', error)
      return { reportId: z.guid().parse(data) }
    },
  }
}
