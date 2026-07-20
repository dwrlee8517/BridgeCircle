import { describe, expect, it, vi } from 'vitest'
import { assistHelpText } from './assistance'
import type { HelpRepository } from './contracts'
import type { HelpAssistanceProvider } from './providers'

function repository(status: 'allowed' | 'limited' = 'allowed') {
  const consumeAiBudget = vi
    .fn<HelpRepository['consumeAiBudget']>()
    .mockResolvedValue(
      status === 'allowed'
        ? { status: 'allowed', remaining: 4, resetsAt: '2026-07-15T02:00:00.000Z' }
        : { status: 'limited', remaining: 0, resetsAt: '2026-07-15T02:00:00.000Z' },
    )
  return { consumeAiBudget }
}

const baseInput = {
  task: 'ask_draft' as const,
  currentText: '  I need advice on product strategy.  ',
  context: [' Product ', 'Career transition'],
  fallbackText: 'I would value your perspective on product strategy.',
  signal: new AbortController().signal,
}

const unsafeResponses: Array<{
  response: Readonly<Record<string, string>>
  label: string
}> = [
  { response: { text: '', extra: 'field' }, label: 'extra field' },
  { response: { text: 'x'.repeat(2_001) }, label: 'oversized text' },
]

describe('Help assistance', () => {
  it('uses editable deterministic copy without consuming budget when no provider exists', async () => {
    const repo = repository()
    await expect(assistHelpText(baseInput, { repository: repo, provider: null })).resolves.toEqual({
      status: 'fallback',
      text: 'I would value your perspective on product strategy.',
      remaining: null,
    })
    expect(repo.consumeAiBudget).not.toHaveBeenCalled()
  })

  it('checks the count-only budget before calling the provider', async () => {
    const repo = repository('limited')
    const provider: HelpAssistanceProvider = { complete: vi.fn(async () => ({ text: 'Draft' })) }
    await expect(assistHelpText(baseInput, { repository: repo, provider })).resolves.toEqual({
      status: 'limited',
      text: null,
      remaining: 0,
    })
    expect(provider.complete).not.toHaveBeenCalled()
  })

  it('normalizes a valid suggestion and never submits a command', async () => {
    const provider: HelpAssistanceProvider = {
      complete: vi.fn(async () => ({
        text: '  Could you share how you approach product strategy?  ',
      })),
    }
    const repo = repository()
    await expect(assistHelpText(baseInput, { repository: repo, provider })).resolves.toEqual({
      status: 'suggested',
      text: 'Could you share how you approach product strategy?',
      remaining: 4,
    })
    expect(provider.complete).toHaveBeenCalledWith(
      'ask_draft',
      {
        currentText: 'I need advice on product strategy.',
        context: ['Product', 'Career transition'],
      },
      baseInput.signal,
    )
  })

  it.each(unsafeResponses)('falls back on unsafe provider output: $label', async ({ response }) => {
    const provider: HelpAssistanceProvider = { complete: vi.fn(async () => response) }
    await expect(
      assistHelpText(baseInput, { repository: repository(), provider }),
    ).resolves.toMatchObject({
      status: 'fallback',
      text: baseInput.fallbackText,
    })
  })
})
