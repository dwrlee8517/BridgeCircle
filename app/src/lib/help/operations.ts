import type {
  CreateHelpAskResult,
  CreateHelpOfferResult,
  HelpAskDecisionResult,
  HelpDirectAskTarget,
  HelpOfferDecisionResult,
  HelpRepository,
  SaveHelperPreferencesResult,
} from './contracts'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function clean(value: string): string {
  return value.trim()
}

export async function getDirectAskTarget(
  input: { membershipId: string; recipientMembershipId: string },
  repository: Pick<HelpRepository, 'getDirectAskTarget'>,
): Promise<HelpDirectAskTarget | null> {
  if (!UUID_PATTERN.test(input.membershipId) || !UUID_PATTERN.test(input.recipientMembershipId)) {
    return null
  }
  return repository.getDirectAskTarget(input)
}

export async function createDirectHelpAsk(
  input: {
    membershipId: string
    recipientMembershipId: string
    question: string
    requestMessage: string
    clientRequestId: string
  },
  repository: Pick<HelpRepository, 'createDirectAsk'>,
): Promise<CreateHelpAskResult> {
  const question = clean(input.question)
  const requestMessage = clean(input.requestMessage)
  if (!question || question.length > 2000 || !requestMessage || requestMessage.length > 4000) {
    return { status: 'invalid_input', askId: null, activeCount: 0, created: false }
  }
  return repository.createDirectAsk({ ...input, question, requestMessage })
}

export async function createCircleHelpAsk(
  input: Parameters<HelpRepository['createCircleAsk']>[0],
  repository: Pick<HelpRepository, 'createCircleAsk'>,
): Promise<CreateHelpAskResult> {
  const question = clean(input.question)
  if (!question || question.length > 2000) {
    return { status: 'invalid_input', askId: null, activeCount: 0, created: false }
  }
  return repository.createCircleAsk({ ...input, question })
}

export async function offerHelp(
  input: Parameters<HelpRepository['offerToHelp']>[0],
  repository: Pick<HelpRepository, 'offerToHelp'>,
): Promise<CreateHelpOfferResult> {
  const offerNote = clean(input.offerNote)
  if (!offerNote || offerNote.length > 4000) {
    return { status: 'invalid_input', askId: null, offerId: null, created: false }
  }
  return repository.offerToHelp({ ...input, offerNote })
}

export async function respondToDirectHelpAsk(
  input: Parameters<HelpRepository['respondToDirectAsk']>[0],
  repository: Pick<HelpRepository, 'respondToDirectAsk'>,
): Promise<HelpAskDecisionResult> {
  if (input.decision === 'accept') {
    const openingMessage = input.openingMessage ? clean(input.openingMessage) : ''
    if (!openingMessage || openingMessage.length > 10_000 || !input.clientNonce) {
      return { status: 'invalid_input', askId: null, conversationId: null }
    }
    return repository.respondToDirectAsk({
      ...input,
      openingMessage,
      declineReasonCode: null,
      declineNote: null,
    })
  }

  const declineNote = input.declineNote ? clean(input.declineNote) : ''
  if (!input.declineReasonCode || !declineNote || declineNote.length > 2_000) {
    return { status: 'invalid_input', askId: null, conversationId: null }
  }
  return repository.respondToDirectAsk({
    ...input,
    openingMessage: null,
    declineNote,
    clientNonce: null,
  })
}

export async function resolveHelpAsk(
  input: Parameters<HelpRepository['resolveAsk']>[0],
  repository: Pick<HelpRepository, 'resolveAsk'>,
): Promise<HelpAskDecisionResult> {
  const outcomeNote = input.outcomeNote ? clean(input.outcomeNote) : null
  if (outcomeNote && outcomeNote.length > 2000) {
    return { status: 'invalid_input', askId: null, conversationId: null }
  }
  return repository.resolveAsk({ ...input, outcomeNote: outcomeNote || null })
}

export async function decideHelpOffer(
  input: Parameters<HelpRepository['decideOffer']>[0],
  repository: Pick<HelpRepository, 'decideOffer'>,
): Promise<HelpOfferDecisionResult> {
  if (input.decision === 'accept') {
    const openingMessage = input.openingMessage ? clean(input.openingMessage) : ''
    if (!openingMessage || openingMessage.length > 10_000 || !input.clientNonce) {
      return {
        status: 'invalid_input',
        askId: null,
        offerId: null,
        conversationId: null,
      }
    }
    return repository.decideOffer({
      ...input,
      openingMessage,
      declineReasonCode: null,
      declineNote: null,
    })
  }

  const declineNote = input.declineNote ? clean(input.declineNote) : ''
  if (!input.declineReasonCode || !declineNote || declineNote.length > 2000) {
    return { status: 'invalid_input', askId: null, offerId: null, conversationId: null }
  }
  return repository.decideOffer({
    ...input,
    openingMessage: null,
    declineNote,
    clientNonce: null,
  })
}

export async function saveHelpPreferences(
  input: Parameters<HelpRepository['saveHelperPreferences']>[0],
  repository: Pick<HelpRepository, 'saveHelperPreferences'>,
): Promise<SaveHelperPreferencesResult> {
  if (!input.openToHelp) {
    return repository.saveHelperPreferences({ ...input, topics: [] })
  }
  const topicsByKey = new Map<string, string>()
  for (const rawTopic of input.topics) {
    const topic = clean(rawTopic)
    const key = topic.toLowerCase()
    if (topic && !topicsByKey.has(key)) topicsByKey.set(key, topic)
  }
  const topics = Array.from(topicsByKey.values())
  if (topics.length > 5 || topics.some((topic) => topic.length > 100)) {
    return {
      status: 'invalid_input',
      openToHelp: input.openToHelp,
      pausedAt: null,
      pauseReason: null,
      topics: [],
    }
  }
  return repository.saveHelperPreferences({ ...input, topics })
}
