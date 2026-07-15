export type CircleAskStatus =
  | 'created'
  | 'existing'
  | 'idempotency_conflict'
  | 'active_limit_reached'
  | 'helper_limit_reached'
  | 'invalid_input'
  | 'not_available'

export function buildCircleRevisionFallback(
  current: string,
  instruction: string,
  original: string,
) {
  const cleaned = cleanSentence(current)
  if (/^(start over|reset)$/i.test(instruction)) return original.trim()
  if (/clear|clean|tight|direct/i.test(instruction)) return ensureQuestion(cleaned)
  if (/short|brief|trim|concise/i.test(instruction)) {
    const firstQuestion = cleaned.match(/^.*?\?/u)?.[0]
    if (firstQuestion && firstQuestion.length > 20) return firstQuestion
    return cleaned.length > 110 ? `${cleaned.slice(0, 110).trimEnd()}…` : cleaned
  }
  if (/warm|friendl|nicer|softer|kind/i.test(instruction)) {
    if (/any experience helps/i.test(cleaned)) return cleaned
    const question = ensureQuestion(cleaned)
    return `${question} Any experience helps — even a quick pointer.`
  }
  const context = instruction.replace(/^['"]|['"]$/g, '').trim()
  const sentence = /[.!?]$/u.test(context) ? context : `${context}.`
  return `${ensureQuestion(cleaned)} For context: ${capitalize(sentence)}`
}

export function circlePostFailureMessage(status: CircleAskStatus | undefined) {
  switch (status) {
    case 'active_limit_reached':
      return 'All five Ask slots are in use. Your draft is safe — end an existing Ask, then try again.'
    case 'idempotency_conflict':
      return 'This post may already have reached the server with an earlier version. Check Your asks before posting again.'
    case 'not_available':
      return 'This circle is no longer available for the Ask. Your draft is still safe.'
    default:
      return 'That ask needs one more look before it can post. Nothing was created.'
  }
}

function cleanSentence(value: string) {
  let cleaned = value.trim().replace(/\s+/g, ' ')
  for (const hedge of [
    'i was wondering if ',
    'i was wondering ',
    'sorry to ask, but ',
    'sorry, but ',
    'maybe ',
    'i think ',
  ]) {
    if (cleaned.toLowerCase().startsWith(hedge)) cleaned = cleaned.slice(hedge.length)
  }
  return capitalize(cleaned)
}

function ensureQuestion(value: string) {
  return /\?$/u.test(value) ? value : `${value.replace(/[.!]+$/u, '')}?`
}

function capitalize(value: string) {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value
}
