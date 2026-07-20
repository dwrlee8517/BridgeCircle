import { describe, expect, it, vi } from 'vitest'
import type { HelpRepository } from './contracts'
import {
  createCircleHelpAsk,
  createDirectHelpAsk,
  decideHelpOffer,
  offerHelp,
  resolveHelpAsk,
  respondToDirectHelpAsk,
  saveHelpPreferences,
} from './operations'

const membershipId = '20000000-0000-4000-8000-000000000001'
const recipientMembershipId = '20000000-0000-4000-8000-000000000002'
const askId = '30000000-0000-4000-8000-000000000001'
const offerId = '40000000-0000-4000-8000-000000000001'
const requestId = '60000000-0000-4000-8000-000000000001'

describe('Help domain operations', () => {
  it('normalizes valid direct and circle Asks before persistence', async () => {
    const createDirectAsk = vi.fn<HelpRepository['createDirectAsk']>().mockResolvedValue({
      status: 'created',
      askId,
      activeCount: 1,
      created: true,
    })
    const createCircleAsk = vi.fn<HelpRepository['createCircleAsk']>().mockResolvedValue({
      status: 'existing',
      askId,
      activeCount: 1,
      created: false,
    })

    await createDirectHelpAsk(
      {
        membershipId,
        recipientMembershipId,
        question: '  Could you review this?  ',
        requestMessage: '  I would value your perspective.  ',
        clientRequestId: requestId,
      },
      { createDirectAsk },
    )
    await createCircleHelpAsk(
      {
        membershipId,
        question: '  How should I approach this?  ',
        reach: 'matched',
        anonymousUntilAccepted: true,
        clientRequestId: requestId,
      },
      { createCircleAsk },
    )

    expect(createDirectAsk).toHaveBeenCalledWith({
      membershipId,
      recipientMembershipId,
      question: 'Could you review this?',
      requestMessage: 'I would value your perspective.',
      clientRequestId: requestId,
    })
    expect(createCircleAsk).toHaveBeenCalledWith(
      expect.objectContaining({ question: 'How should I approach this?' }),
    )
  })

  it('returns invalid input locally without opening a write', async () => {
    const createDirectAsk = vi.fn<HelpRepository['createDirectAsk']>()
    const offerToHelp = vi.fn<HelpRepository['offerToHelp']>()
    const resolveAsk = vi.fn<HelpRepository['resolveAsk']>()

    await expect(
      createDirectHelpAsk(
        {
          membershipId,
          recipientMembershipId,
          question: ' ',
          requestMessage: 'Hello',
          clientRequestId: requestId,
        },
        { createDirectAsk },
      ),
    ).resolves.toMatchObject({ status: 'invalid_input' })
    await expect(
      offerHelp(
        { askId, membershipId, offerNote: ' ', clientRequestId: requestId },
        { offerToHelp },
      ),
    ).resolves.toMatchObject({ status: 'invalid_input' })
    await expect(
      resolveHelpAsk({ askId, outcomeNote: 'x'.repeat(2_001) }, { resolveAsk }),
    ).resolves.toMatchObject({ status: 'invalid_input' })
    expect(createDirectAsk).not.toHaveBeenCalled()
    expect(offerToHelp).not.toHaveBeenCalled()
    expect(resolveAsk).not.toHaveBeenCalled()
  })

  it('requires the correct note and nonce for each offer decision', async () => {
    const decideOffer = vi.fn<HelpRepository['decideOffer']>().mockResolvedValue({
      status: 'accepted',
      askId,
      offerId,
      conversationId: '50000000-0000-4000-8000-000000000001',
    })

    await expect(
      decideHelpOffer(
        {
          offerId,
          decision: 'accept',
          openingMessage: ' ',
          declineReasonCode: null,
          declineNote: null,
          clientNonce: requestId,
        },
        { decideOffer },
      ),
    ).resolves.toMatchObject({ status: 'invalid_input' })
    await decideHelpOffer(
      {
        offerId,
        decision: 'accept',
        openingMessage: '  I would be glad to help.  ',
        declineReasonCode: null,
        declineNote: null,
        clientNonce: requestId,
      },
      { decideOffer },
    )
    expect(decideOffer).toHaveBeenCalledWith(
      expect.objectContaining({
        openingMessage: 'I would be glad to help.',
        declineReasonCode: null,
        declineNote: null,
      }),
    )
  })

  it('requires a message for direct acceptance and a reasoned note for decline', async () => {
    const respondToDirectAsk = vi.fn<HelpRepository['respondToDirectAsk']>().mockResolvedValue({
      status: 'accepted',
      askId,
      conversationId: '50000000-0000-4000-8000-000000000001',
    })

    await expect(
      respondToDirectHelpAsk(
        {
          askId,
          decision: 'accept',
          openingMessage: ' ',
          declineReasonCode: null,
          declineNote: null,
          clientNonce: requestId,
        },
        { respondToDirectAsk },
      ),
    ).resolves.toMatchObject({ status: 'invalid_input' })
    await respondToDirectHelpAsk(
      {
        askId,
        decision: 'decline',
        openingMessage: null,
        declineReasonCode: 'unavailable',
        declineNote: '  I cannot give this the attention it deserves right now.  ',
        clientNonce: null,
      },
      { respondToDirectAsk },
    )

    expect(respondToDirectAsk).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: 'decline',
        declineNote: 'I cannot give this the attention it deserves right now.',
        clientNonce: null,
      }),
    )
  })

  it('deduplicates preferences case-insensitively while preserving first spelling and order', async () => {
    const saveHelperPreferences = vi
      .fn<HelpRepository['saveHelperPreferences']>()
      .mockResolvedValue({
        status: 'saved',
        openToHelp: true,
        pausedAt: null,
        pauseReason: null,
        topics: ['Product', 'Health'],
      })

    await saveHelpPreferences(
      {
        membershipId,
        openToHelp: true,
        topics: [' Product ', 'product', ' Health ', 'HEALTH'],
      },
      { saveHelperPreferences },
    )

    expect(saveHelperPreferences).toHaveBeenCalledWith({
      membershipId,
      openToHelp: true,
      topics: ['Product', 'Health'],
    })
  })
})
