import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { saveHelpPreferencesAction } from '@/app/(member)/help/help-preferences-actions'
import { POST as offerRoute } from '@/app/api/help/asks/[askId]/offer/route'
import { POST as resolveRoute } from '@/app/api/help/asks/[askId]/resolve/route'
import { POST as circleAskRoute } from '@/app/api/help/asks/circle/route'
import { POST as offerDecisionRoute } from '@/app/api/help/offers/[offerId]/decision/route'
import { callAction, callRoute, createMember, type Member } from '../harness/apiClient'
import { bootstrapTenant, TEST_PASSWORD, type Tenant } from '../harness/bootstrapTenant'
import { CookieJar } from '../harness/cookieJar'
import { teardownScope } from '../harness/resetDb'
import { SeedScope } from '../harness/seedScope'

const scope = new SeedScope()
let tenant: Tenant
let asker: Member
let helper: Member

beforeAll(async () => {
  tenant = await bootstrapTenant(scope)
  asker = await createMember(tenant.admin.jar, scope.email('asker'), TEST_PASSWORD, {
    fullName: 'Asker IT',
  })
  helper = await createMember(tenant.admin.jar, scope.email('helper'), TEST_PASSWORD, {
    fullName: 'Helper IT',
  })

  // Offering requires the helper to be open to helping (helper_preferences
  // gate in offer_to_help). Opt in through the real preferences action.
  const fd = new FormData()
  fd.set('openToHelp', 'on')
  fd.set('topics', 'career switching')
  const saved = await callAction(helper.jar, () => saveHelpPreferencesAction({}, fd))
  if (saved.kind === 'return' && saved.value && 'error' in saved.value && saved.value.error) {
    throw new Error(`saveHelpPreferences failed: ${JSON.stringify(saved.value)}`)
  }
})
afterAll(async () => {
  await teardownScope(scope)
})

describe('circle ask lifecycle: ask → offer → accept → resolve', () => {
  it('rejects an unauthenticated ask with 401', async () => {
    const { status } = await callRoute(new CookieJar(), circleAskRoute, {
      path: '/api/help/asks/circle',
      json: {
        question: 'Should not land',
        reach: 'organization',
        anonymousUntilAccepted: false,
        clientRequestId: randomUUID(),
      },
    })
    expect(status).toBe(401)
  })

  it('runs the full lifecycle through the route handlers', async () => {
    // Asker opens a circle ask, visible to the whole org.
    const asked = await callRoute<{ status?: string; askId?: string | null }>(
      asker.jar,
      circleAskRoute,
      {
        path: '/api/help/asks/circle',
        json: {
          question:
            'I am weighing a move into climate tech after eight years in fintech — who has made a similar switch and what surprised them?',
          reach: 'organization',
          anonymousUntilAccepted: false,
          clientRequestId: randomUUID(),
        },
      },
    )
    expect(asked.status, JSON.stringify(asked.body)).toBe(200)
    const askId = asked.body.askId
    expect(askId, JSON.stringify(asked.body)).toBeTruthy()

    // Helper offers to help.
    const offered = await callRoute<{ status?: string; offerId?: string | null }>(
      helper.jar,
      offerRoute,
      {
        path: `/api/help/asks/${askId}/offer`,
        params: { askId: askId as string },
        json: {
          offerNote: 'I made exactly this switch in 2023 — happy to walk through it.',
          clientRequestId: randomUUID(),
        },
      },
    )
    expect(offered.status, JSON.stringify(offered.body)).toBe(200)
    const offerId = offered.body.offerId
    expect(offerId, JSON.stringify(offered.body)).toBeTruthy()

    // Asker accepts the offer, which opens the help conversation.
    const accepted = await callRoute<{ status?: string; conversationId?: string | null }>(
      asker.jar,
      offerDecisionRoute,
      {
        path: `/api/help/offers/${offerId}/decision`,
        params: { offerId: offerId as string },
        json: {
          decision: 'accept',
          openingMessage: 'Thank you — the thing I most want to understand is compensation.',
          clientNonce: randomUUID(),
        },
      },
    )
    expect(accepted.status, JSON.stringify(accepted.body)).toBe(200)

    // Asker resolves the ask with an outcome note.
    const resolved = await callRoute<{ status?: string }>(asker.jar, resolveRoute, {
      path: `/api/help/asks/${askId}/resolve`,
      params: { askId: askId as string },
      json: { outcomeNote: 'Had one great conversation; switching this fall.' },
    })
    expect(resolved.status, JSON.stringify(resolved.body)).toBe(200)
  })

  it('a helper cannot offer on an already-resolved ask twice over', async () => {
    // Fresh ask, resolve it immediately, then try to offer.
    const asked = await callRoute<{ askId?: string | null }>(asker.jar, circleAskRoute, {
      path: '/api/help/asks/circle',
      json: {
        question: 'Short-lived ask used to verify the resolved gate holds.',
        reach: 'organization',
        anonymousUntilAccepted: false,
        clientRequestId: randomUUID(),
      },
    })
    const askId = asked.body.askId as string
    expect(askId).toBeTruthy()

    await callRoute(asker.jar, resolveRoute, {
      path: `/api/help/asks/${askId}/resolve`,
      params: { askId },
      json: { outcomeNote: null },
    })

    const lateOffer = await callRoute<{ status?: string }>(helper.jar, offerRoute, {
      path: `/api/help/asks/${askId}/offer`,
      params: { askId },
      json: { offerNote: 'Too late to help, surely.', clientRequestId: randomUUID() },
    })
    // The route reports a non-open ask rather than recording the offer.
    expect(lateOffer.body.status).not.toBe('offered')
  })
})
