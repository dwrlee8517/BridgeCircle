import type { HelpRepository } from './contracts'
import type { HelpAssistanceProvider, HelpAssistanceTask } from './providers'

export type HelpAssistanceResult =
  | { status: 'suggested'; text: string; remaining: number }
  | { status: 'fallback'; text: string; remaining: number | null }
  | { status: 'limited' | 'not_available' | 'invalid_input'; text: null; remaining: 0 }

export async function assistHelpText(
  input: {
    task: HelpAssistanceTask
    currentText: string
    context: readonly string[]
    fallbackText: string
    signal: AbortSignal
  },
  dependencies: {
    repository: Pick<HelpRepository, 'consumeAiBudget'>
    provider: HelpAssistanceProvider | null
  },
): Promise<HelpAssistanceResult> {
  const currentText = normalize(input.currentText)
  const context = input.context.map(normalize).filter(Boolean).slice(0, 10)
  const fallbackText = normalize(input.fallbackText)
  if (!currentText || currentText.length > 4_000 || !fallbackText) {
    return { status: 'invalid_input', text: null, remaining: 0 }
  }
  if (!dependencies.provider) {
    return { status: 'fallback', text: fallbackText, remaining: null }
  }

  const budget = await dependencies.repository.consumeAiBudget(input.task)
  if (budget.status !== 'allowed') {
    return { status: budget.status, text: null, remaining: 0 }
  }
  try {
    const response = await dependencies.provider.complete(
      input.task,
      { currentText, context },
      input.signal,
    )
    if (Object.keys(response).length !== 1 || typeof response.text !== 'string') {
      return { status: 'fallback', text: fallbackText, remaining: budget.remaining }
    }
    const suggestion = normalize(response.text)
    if (!suggestion || suggestion.length > maximumLength(input.task)) {
      return { status: 'fallback', text: fallbackText, remaining: budget.remaining }
    }
    return { status: 'suggested', text: suggestion, remaining: budget.remaining }
  } catch {
    return { status: 'fallback', text: fallbackText, remaining: budget.remaining }
  }
}

function maximumLength(task: HelpAssistanceTask): number {
  if (task === 'ask_draft') return 2_000
  if (task === 'offer_note') return 4_000
  if (task === 'decline_note') return 2_000
  return 500
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}
