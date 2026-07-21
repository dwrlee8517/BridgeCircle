import { describe, expect, it } from 'vitest'
import {
  parseCreateHelpAskRow,
  parseCreateHelpOfferRow,
  parseDirectAskTargetRow,
  parseGiveHelpRow,
  parseHelpAiBudgetRow,
  parseHelpAskDecisionRow,
  parseHelpAskDetailRow,
  parseHelpAskSummaryRow,
  parseHelpCandidateRow,
  parseHelperPreferencesRow,
  parseHelpHomeRow,
  parseHelpOfferDecisionRow,
  parseSaveHelperPreferencesRow,
} from './help'

const askId = '30000000-0000-4000-8000-000000000001'
const offerId = '40000000-0000-4000-8000-000000000001'
const conversationId = '50000000-0000-4000-8000-000000000001'
// Stable RFC-4122-shaped identifier from the deterministic local seed.
const organizationId = '11111111-1111-4111-8111-111111111111'
const membershipId = '20000000-0000-4000-8000-000000000003'
const userId = '10000000-0000-4000-8000-000000000003'
const timestamp = '2026-07-15T01:00:00.000Z'

function identifiedProfile() {
  return {
    userId,
    displayName: 'Mark Chen',
    headline: 'Product leader',
    avatarPath: null,
    graduationYear: 2001,
  }
}

describe('Help repository projections', () => {
  it('fails closed for unavailable or malformed direct Ask targets', () => {
    const target = {
      membershipId,
      userId,
      displayName: 'Mark Chen',
      headline: 'Product leader',
      avatarPath: null,
      graduationYear: 2001,
      topics: ['Product'],
    }
    expect(parseDirectAskTargetRow({ result_code: 'ok', recipient: target })).toEqual(target)
    expect(parseDirectAskTargetRow({ result_code: 'not_available', recipient: null })).toBeNull()
    expect(() =>
      parseDirectAskTargetRow({ result_code: 'not_available', recipient: target }),
    ).toThrow('unavailable target has recipient')
  })

  it('parses one bounded Help home snapshot', () => {
    expect(
      parseHelpHomeRow({
        membership_id: membershipId,
        organization_id: organizationId,
        active_ask_count: 2,
        active_ask_limit: 5,
        open_to_help: true,
        paused_at: null,
        pause_reason: null,
        helper_topics: ['Product'],
        recent_asks: [
          {
            askId,
            kind: 'direct',
            status: 'waiting',
            question: 'Could you review this?',
            createdAt: timestamp,
            expiresAt: timestamp,
          },
        ],
        direct_requests: [
          {
            askId,
            question: 'Could you review this?',
            requestMessage: 'I would value your perspective.',
            asker: identifiedProfile(),
            createdAt: timestamp,
            expiresAt: timestamp,
          },
        ],
        suggested_asks: [
          {
            askId,
            question: 'How should I approach this?',
            anonymousUntilAccepted: true,
            asker: { displayName: 'A member', graduationYear: 2004 },
            matchReason: 'Speaks to Product',
            createdAt: timestamp,
            expiresAt: timestamp,
          },
        ],
      }),
    ).toMatchObject({
      membershipId,
      activeAskCount: 2,
      directRequests: [{ asker: { identity: 'identified', userId } }],
      suggestedAsks: [{ asker: { identity: 'anonymous', displayName: 'A member' } }],
    })
  })

  it('rejects unknown home fields and malformed identity previews', () => {
    expect(() =>
      parseHelpHomeRow({
        membership_id: membershipId,
        organization_id: organizationId,
        active_ask_count: 0,
        active_ask_limit: 5,
        open_to_help: true,
        paused_at: null,
        pause_reason: null,
        helper_topics: [],
        recent_asks: [],
        direct_requests: [],
        suggested_asks: [],
        leaked: true,
      }),
    ).toThrow()
  })

  it('maps permission-safe candidate evidence without raw content', () => {
    expect(
      parseHelpCandidateRow({
        helper_membership_id: membershipId,
        helper_user_id: userId,
        display_name: 'Mark Chen',
        headline: null,
        avatar_path: null,
        graduation_year: 2001,
        topics: ['Product'],
        lexical_score: 0.4,
        semantic_score: 0.8,
        match_reason: 'Speaks to Product',
        evidence_chunk_ids: ['70000000-0000-4000-8000-000000000001'],
      }),
    ).toEqual({
      membershipId,
      userId,
      displayName: 'Mark Chen',
      headline: null,
      avatarPath: null,
      graduationYear: 2001,
      topics: ['Product'],
      lexicalScore: 0.4,
      semanticScore: 0.8,
      matchReason: 'Speaks to Product',
      evidenceChunkIds: ['70000000-0000-4000-8000-000000000001'],
    })
  })

  it('preserves anonymous Ask detail and safe offer/history shapes', () => {
    const detail = parseHelpAskDetailRow({
      ask_id: askId,
      organization_id: organizationId,
      kind: 'circle',
      status: 'open',
      question: 'Could someone help?',
      request_message: null,
      reach: 'matched',
      anonymous_until_accepted: true,
      asker_preview: { displayName: 'A member', graduationYear: 2004 },
      recipient_preview: null,
      decline_reason_code: null,
      decline_note: null,
      closure_reason: null,
      outcome_note: null,
      conversation_id: null,
      offers: [
        {
          offerId,
          status: 'pending',
          offerNote: 'Happy to compare notes.',
          declineReasonCode: null,
          declineNote: null,
          closureReason: null,
          createdAt: timestamp,
          helper: identifiedProfile(),
        },
      ],
      history: [{ eventId: 41, type: 'offer_created', createdAt: timestamp }],
      accepted_at: null,
      ended_at: null,
      expires_at: timestamp,
      created_at: timestamp,
    })
    expect(detail.asker).toEqual({
      identity: 'anonymous',
      displayName: 'A member',
      graduationYear: 2004,
    })
    expect(detail.offers[0]?.helper.identity).toBe('identified')
    expect(detail.history).toEqual([{ id: 41, type: 'offer_created', createdAt: timestamp }])
  })

  it('parses the complete recipient preview returned by owned Ask history', () => {
    expect(
      parseHelpAskSummaryRow({
        ask_id: askId,
        organization_id: organizationId,
        kind: 'direct',
        status: 'waiting',
        question: 'Could you review this?',
        recipient_preview: identifiedProfile(),
        offer_count: 0,
        conversation_id: null,
        created_at: timestamp,
        expires_at: timestamp,
        ended_at: null,
      }),
    ).toMatchObject({
      id: askId,
      recipient: { identity: 'identified', userId, graduationYear: 2001 },
    })
  })

  it('fails closed if an anonymous Give row includes identity fields', () => {
    const row = {
      ask_id: askId,
      organization_id: organizationId,
      kind: 'circle',
      status: 'open',
      question: 'Could someone help?',
      reach: 'matched',
      anonymous_until_accepted: true,
      asker_user_id: null,
      asker_display_name: null,
      asker_avatar_path: null,
      asker_graduation_year: 2004,
      match_reason: 'Speaks to Product',
      my_offer_status: null,
      created_at: timestamp,
      expires_at: timestamp,
    }
    expect(parseGiveHelpRow(row).asker.identity).toBe('anonymous')
    expect(() => parseGiveHelpRow({ ...row, asker_display_name: 'Leaked name' })).toThrow(
      'anonymous asker leaked identity fields',
    )
  })

  it('enforces coherent preference pause pairs', () => {
    expect(
      parseHelperPreferencesRow({
        membership_id: membershipId,
        organization_id: organizationId,
        open_to_help: false,
        max_pending_requests: 10,
        consecutive_timeouts: 3,
        paused_at: timestamp,
        pause_reason: 'unresponsive',
        topics: ['Product'],
      }),
    ).toMatchObject({ openToHelp: false, pauseReason: 'unresponsive' })
    expect(() =>
      parseHelperPreferencesRow({
        membership_id: membershipId,
        organization_id: organizationId,
        open_to_help: false,
        max_pending_requests: 10,
        consecutive_timeouts: 3,
        paused_at: timestamp,
        pause_reason: null,
        topics: [],
      }),
    ).toThrow('pause timestamp/reason mismatch')
  })
})

describe('Help repository command results', () => {
  it('maps payload-aware Ask creation and rejects inconsistent rows', () => {
    expect(
      parseCreateHelpAskRow({
        result_code: 'created',
        ask_id: askId,
        active_count: 2,
        created: true,
      }),
    ).toEqual({ status: 'created', askId, activeCount: 2, created: true })
    expect(
      parseCreateHelpAskRow({
        result_code: 'idempotency_conflict',
        ask_id: askId,
        active_count: 2,
        created: false,
      }),
    ).toMatchObject({ status: 'idempotency_conflict', askId })
    expect(() =>
      parseCreateHelpAskRow({
        result_code: 'created',
        ask_id: null,
        active_count: 2,
        created: true,
      }),
    ).toThrow('success shape')
  })

  it('maps Ask and offer decisions without accepting leaked IDs', () => {
    expect(
      parseHelpAskDecisionRow({
        result_code: 'accepted',
        ask_id: askId,
        conversation_id: conversationId,
      }),
    ).toEqual({ status: 'accepted', askId, conversationId })
    expect(
      parseHelpOfferDecisionRow({
        result_code: 'already_decided',
        ask_id: askId,
        offer_id: offerId,
        conversation_id: null,
      }),
    ).toEqual({ status: 'already_decided', askId, offerId, conversationId: null })
    expect(() =>
      parseHelpOfferDecisionRow({
        result_code: 'not_available',
        ask_id: askId,
        offer_id: null,
        conversation_id: null,
      }),
    ).toThrow('denial leaked IDs')
  })

  it('maps offer creation, preferences, and AI budget discriminants', () => {
    expect(
      parseCreateHelpOfferRow({
        result_code: 'existing',
        ask_id: askId,
        offer_id: offerId,
        created: false,
      }),
    ).toEqual({ status: 'existing', askId, offerId, created: false })
    expect(
      parseSaveHelperPreferencesRow({
        result_code: 'saved',
        open_to_help: true,
        paused_at: null,
        pause_reason: null,
        topics: ['Product'],
      }),
    ).toEqual({
      status: 'saved',
      openToHelp: true,
      pausedAt: null,
      pauseReason: null,
      topics: ['Product'],
    })
    expect(
      parseHelpAiBudgetRow({ result_code: 'limited', remaining: 0, resets_at: timestamp }),
    ).toEqual({ status: 'limited', remaining: 0, resetsAt: timestamp })
    expect(() =>
      parseHelpAiBudgetRow({ result_code: 'limited', remaining: 1, resets_at: timestamp }),
    ).toThrow('denial retained budget')
  })
})
