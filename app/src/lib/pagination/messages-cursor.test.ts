import { describe, expect, it } from 'vitest'
import { decodeMessagesCursor, encodeMessagesCursor } from './messages-cursor'

const cursor = {
  priority: 2,
  activityAt: '2026-08-08T12:00:00.000Z',
  conversationId: 'c-1',
} as const

describe('messages cursor', () => {
  it('round-trips the three-part composite', () => {
    expect(decodeMessagesCursor(encodeMessagesCursor(cursor))).toEqual(cursor)
  })

  it('returns null for an absent cursor (page from the beginning)', () => {
    expect(decodeMessagesCursor(null)).toBeNull()
    expect(decodeMessagesCursor(undefined)).toBeNull()
    expect(decodeMessagesCursor('')).toBeNull()
  })

  it('rejects malformed cursors instead of throwing', () => {
    // A stale/garbage cursor from a client must degrade to "start over",
    // never crash the query.
    expect(decodeMessagesCursor('nonsense')).toBeNull()
    expect(decodeMessagesCursor('2|only-two-parts')).toBeNull()
    expect(decodeMessagesCursor('9|2026-08-08T12:00:00.000Z|c-1')).toBeNull()
    expect(decodeMessagesCursor('2|not-a-date|c-1')).toBeNull()
    expect(decodeMessagesCursor('2|2026-08-08T12:00:00.000Z|')).toBeNull()
  })
})
