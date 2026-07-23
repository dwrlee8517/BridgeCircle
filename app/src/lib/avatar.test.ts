import { describe, expect, it } from 'vitest'
import { avatarColorClass } from './avatar'

describe('avatarColorClass', () => {
  it('keeps a person on the same design-system pair', () => {
    expect(avatarColorClass('10000000-0000-4000-8000-000000000002')).toBe(
      avatarColorClass('10000000-0000-4000-8000-000000000002'),
    )
  })

  it('normalizes incidental casing and whitespace', () => {
    expect(avatarColorClass('  Member-ID ')).toBe(avatarColorClass('member-id'))
  })

  it('returns one complete background and foreground token pair', () => {
    expect(avatarColorClass('member-id')).toMatch(
      /^bg-\[var\(--avatar-[1-6]-bg\)\] text-\[var\(--avatar-[1-6]-fg\)\]$/,
    )
  })
})
