const SENTENCE_LIMIT = 180

export function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] || 'there'
}

export function buildDirectOpeningDraft(displayName: string, question: string): string {
  const name = firstName(displayName)
  return `Hi ${name} — glad you reached out. I’m happy to share what I know and talk through ${quotedTopic(question)}.`
}

export function buildOfferDraft(displayName: string | null, question: string): string {
  const greeting = displayName ? `Hi ${firstName(displayName)} — ` : 'Hi — '
  return `${greeting}I may be able to help with this. I’m happy to compare notes and talk through ${quotedTopic(question)}.`
}

export function reviseHelperReplyFallback(
  currentText: string,
  instruction: string,
  originalText: string,
): string {
  const current = currentText.trim()
  const normalized = instruction.trim().toLowerCase()
  if (/^(start over|reset)$/.test(normalized)) return originalText.trim()
  if (normalized.includes('short')) {
    const firstSentence = current.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim()
    return firstSentence && firstSentence.length >= 28
      ? firstSentence
      : current.slice(0, 220).trim()
  }
  if (normalized.includes('warm')) {
    return current.replace(/^(hi(?:\s+[^—,!]+)?\s*[—,!]?\s*)?/i, (greeting) =>
      greeting ? greeting : 'Hi — ',
    )
  }
  if (normalized.includes('free') && !/when you('|’)re free/i.test(current)) {
    return `${current} No rush — reply when you’re free.`
  }
  return current
}

function quotedTopic(question: string): string {
  const cleaned = question
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[?.!]+$/, '')
  const topic =
    cleaned.length > SENTENCE_LIMIT ? `${cleaned.slice(0, SENTENCE_LIMIT - 1)}…` : cleaned
  return `“${topic}”`
}
