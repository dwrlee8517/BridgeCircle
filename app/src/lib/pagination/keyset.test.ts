import { describe, expect, it } from 'vitest'
import { decodeKeysetCursor, encodeKeysetCursor, keysetOrFilter } from './keyset'

describe('keyset cursor', () => {
  it('round-trips (sortValue, id)', () => {
    const cursor = encodeKeysetCursor('2026-08-10T00:00:00.000Z', 'abc-123')
    expect(decodeKeysetCursor(cursor)).toEqual({
      sortValue: '2026-08-10T00:00:00.000Z',
      id: 'abc-123',
    })
  })

  it('splits on the first separator, keeping any later ones in the id', () => {
    expect(decodeKeysetCursor('S|a|b')).toEqual({ sortValue: 'S', id: 'a|b' })
  })

  it('throws on a malformed cursor', () => {
    expect(() => decodeKeysetCursor('no-separator')).toThrow(/malformed/)
  })
})

describe('keysetOrFilter', () => {
  it('builds a forward (gt) tuple comparison with an id tie-breaker', () => {
    expect(keysetOrFilter('starts_at', 'id', 'S', 'I', 'gt')).toBe(
      'starts_at.gt.S,and(starts_at.eq.S,id.gt.I)',
    )
  })

  it('builds a backward (lt) tuple comparison', () => {
    expect(keysetOrFilter('starts_at', 'id', 'S', 'I', 'lt')).toBe(
      'starts_at.lt.S,and(starts_at.eq.S,id.lt.I)',
    )
  })
})
