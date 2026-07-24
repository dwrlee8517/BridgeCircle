import { describe, expect, it } from 'vitest'
import type { HelpAskSummary } from '@/lib/help/contracts'
import { askStatusLabel, closingSoonDays, isCurrentAsk } from './ask-presentation'

const now = Date.parse('2026-07-15T12:00:00.000Z')

function summary(status: HelpAskSummary['status'], expiresAt = '2026-07-29T12:00:00.000Z') {
  return { status, expiresAt } as HelpAskSummary
}

describe('Ask presentation', () => {
  it('keeps declined asks current so their recovery actions stay easy to reach', () => {
    expect(isCurrentAsk(summary('waiting'))).toBe(true)
    expect(isCurrentAsk(summary('accepted'))).toBe(true)
    expect(isCurrentAsk(summary('declined'))).toBe(true)
    expect(isCurrentAsk(summary('resolved'))).toBe(false)
    expect(isCurrentAsk(summary('retracted'))).toBe(false)
  })

  it('shows the expiry warning only for unanswered asks in their final three days', () => {
    expect(closingSoonDays(summary('open', '2026-07-18T12:00:00.000Z'), now)).toBe(3)
    expect(closingSoonDays(summary('waiting', '2026-07-19T12:00:00.000Z'), now)).toBeNull()
    expect(closingSoonDays(summary('accepted', '2026-07-16T12:00:00.000Z'), now)).toBeNull()
  })

  it('uses offer count as the useful open-circle status', () => {
    expect(askStatusLabel('open', 2)).toBe('2 offers')
    expect(askStatusLabel('accepted')).toBe('Accepted')
  })
})
