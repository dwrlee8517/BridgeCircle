import { describe, expect, it } from 'vitest'
import { DECLINE_REASONS, declineCopyForAsker, isDeclineReason } from './declineReasons'

describe('isDeclineReason', () => {
  it('accepts every defined reason', () => {
    for (const reason of DECLINE_REASONS) {
      expect(isDeclineReason(reason.id)).toBe(true)
    }
  })

  it('rejects unknown values', () => {
    expect(isDeclineReason('busy')).toBe(false)
    expect(isDeclineReason('')).toBe(false)
    expect(isDeclineReason(null)).toBe(false)
    expect(isDeclineReason(undefined)).toBe(false)
  })
})

describe('declineCopyForAsker', () => {
  it('names the helper and de-personalizes the no', () => {
    expect(declineCopyForAsker('at_capacity', 'Mark')).toBe(
      'Mark is at capacity right now — this isn’t about your ask.',
    )
    expect(declineCopyForAsker('not_my_area', 'Mark')).toContain('outside Mark’s wheelhouse')
    expect(declineCopyForAsker('not_now', 'Mark')).toContain('Now wasn’t the right time for Mark')
  })

  it('falls back to the generic line without a reason', () => {
    expect(declineCopyForAsker(null, 'Mark')).toBe(
      'Mark couldn’t take this one right now. Capacity comes and goes — this usually isn’t about your ask.',
    )
  })
})
