import { describe, expect, it } from 'vitest'
import { decodeHelpCursor, encodeHelpCursor } from './cursors'

const cursor = {
  createdAt: '2026-07-15T01:02:03.456Z',
  id: '30000000-0000-4000-8000-000000000001',
}

describe('Help tuple cursors', () => {
  it('round-trips the stable created-at and UUID tuple', () => {
    expect(decodeHelpCursor(encodeHelpCursor(cursor))).toEqual(cursor)
  })

  it.each([
    null,
    undefined,
    '',
    'not-a-cursor',
    '%E0%A4%A',
    encodeURIComponent('2026-07-15|bad-id'),
  ])('fails closed for an invalid cursor: %s', (value) => {
    expect(decodeHelpCursor(value)).toBeNull()
  })

  it('refuses to issue a malformed cursor', () => {
    expect(() => encodeHelpCursor({ ...cursor, createdAt: 'not-a-date' })).toThrow(
      'Invalid Help cursor',
    )
  })
})
