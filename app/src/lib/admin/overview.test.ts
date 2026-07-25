import { describe, expect, it } from 'vitest'
import type { AdminOverview } from './contracts'
import { daysWaiting, isAllClear, openAttention } from './overview'

function overview(overrides?: Partial<AdminOverview['attention']>): AdminOverview {
  return {
    attention: {
      approvals: { count: 0, oldestAt: null },
      reports: { count: 0, oldestAt: null },
      staleInvites: { count: 0, oldestAt: null },
      quietAsks: { count: 0, oldestAt: null },
      quietNewMembers: { count: 0 },
      ...overrides,
    },
    pulse: {
      activeMembers: 0,
      openToHelp: 0,
      asksLast30: 0,
      heardBackLast30: 0,
      newMembersLast30: 0,
      nextEvent: null,
    },
  }
}

describe('openAttention', () => {
  it('is empty when nothing is waiting', () => {
    expect(openAttention(overview())).toEqual([])
    expect(isAllClear(overview())).toBe(true)
  })

  it('orders safety before intake before nudges', () => {
    const busy = overview({
      quietNewMembers: { count: 2 },
      approvals: { count: 1, oldestAt: '2026-07-20T00:00:00Z' },
      reports: { count: 3, oldestAt: '2026-07-21T00:00:00Z' },
    })
    expect(openAttention(busy)).toEqual(['reports', 'approvals', 'quietNewMembers'])
    expect(isAllClear(busy)).toBe(false)
  })
})

describe('daysWaiting', () => {
  const now = new Date('2026-07-24T12:00:00Z')

  it('floors to whole days and never goes negative', () => {
    expect(daysWaiting('2026-07-18T00:00:00Z', now)).toBe(6)
    expect(daysWaiting('2026-07-24T06:00:00Z', now)).toBe(0)
    expect(daysWaiting('2026-07-25T00:00:00Z', now)).toBe(0)
  })

  it('returns null for missing or malformed timestamps', () => {
    expect(daysWaiting(null, now)).toBeNull()
    expect(daysWaiting('not-a-date', now)).toBeNull()
  })
})
