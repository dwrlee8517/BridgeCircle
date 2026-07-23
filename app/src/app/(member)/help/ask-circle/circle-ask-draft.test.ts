import { describe, expect, it } from 'vitest'
import { buildCircleRevisionFallback, circlePostFailureMessage } from './circle-ask-draft'

describe('circle Ask draft fallbacks', () => {
  it('removes hedging and turns a direct edit into a question', () => {
    expect(
      buildCircleRevisionFallback(
        'I was wondering if someone can help me understand climate infrastructure.',
        'Make it clearer',
        'Original',
      ),
    ).toBe('Someone can help me understand climate infrastructure?')
  })

  it('makes an Ask warmer without duplicating the close', () => {
    const warm = buildCircleRevisionFallback(
      'Who has experience evaluating climate infrastructure investments?',
      'Warmer',
      'Original',
    )
    expect(warm).toBe(
      'Who has experience evaluating climate infrastructure investments? Any experience helps — even a quick pointer.',
    )
    expect(buildCircleRevisionFallback(warm, 'Warmer', 'Original')).toBe(warm)
  })

  it('restores the carried question exactly enough for a safe reset', () => {
    expect(buildCircleRevisionFallback('Changed', 'Start over', '  Original question?  ')).toBe(
      'Original question?',
    )
  })

  it('keeps capacity and ambiguous retry errors recoverable', () => {
    expect(circlePostFailureMessage('active_limit_reached')).toContain('draft is safe')
    expect(circlePostFailureMessage('idempotency_conflict')).toContain('may already have reached')
  })
})
