import { describe, expect, it } from 'vitest'
import { parseAskForm, parseHelperPreferenceForm } from './schemas'

function form(entries: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(entries)) fd.set(k, v)
  return fd
}

const HELPER_A = crypto.randomUUID()
const HELPER_B = crypto.randomUUID()
const HELPER_C = crypto.randomUUID()
const HELPER_D = crypto.randomUUID()
const HELPER_E = crypto.randomUUID()

describe('parseAskForm', () => {
  const validReason = 'I have a quick question about your role at Anthropic.'
  const validHelp = 'Would love 15 minutes to ask about the day-to-day.'

  it('accepts an advice ask with helperId', () => {
    const result = parseAskForm(
      form({
        helperId: HELPER_A,
        askType: 'advice',
        reason: validReason,
        helpNeeded: validHelp,
      }),
    )
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.askType).toBe('advice')
      expect(result.data.helperId).toBe(HELPER_A)
    }
  })

  it('accepts a mentorship ask with helperId', () => {
    const result = parseAskForm(
      form({
        helperId: HELPER_B,
        askType: 'mentorship',
        reason: validReason,
        helpNeeded: validHelp,
      }),
    )
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.askType).toBe('mentorship')
  })

  it('defaults askType to mentorship when not provided (legacy form)', () => {
    const result = parseAskForm(
      form({
        helperId: HELPER_C,
        reason: validReason,
        helpNeeded: validHelp,
      }),
    )
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.askType).toBe('mentorship')
  })

  it('falls back to legacy mentorId field when helperId is missing', () => {
    const result = parseAskForm(
      form({
        mentorId: HELPER_D,
        reason: validReason,
        helpNeeded: validHelp,
      }),
    )
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.helperId).toBe(HELPER_D)
  })

  it('accepts an advice ask with no reason field (advice form is one-field)', () => {
    const result = parseAskForm(
      form({
        helperId: HELPER_A,
        askType: 'advice',
        helpNeeded: validHelp,
      }),
    )
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.reason).toBeNull()
  })

  it('accepts a mentorship ask with empty reason (now optional)', () => {
    const result = parseAskForm(
      form({
        helperId: HELPER_B,
        askType: 'mentorship',
        reason: '',
        helpNeeded: validHelp,
      }),
    )
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.reason).toBeNull()
  })

  it('rejects an unknown askType', () => {
    const result = parseAskForm(
      form({
        helperId: HELPER_E,
        askType: 'collaboration',
        reason: validReason,
        helpNeeded: validHelp,
      }),
    )
    expect(result.success).toBe(false)
  })
})

describe('parseHelperPreferenceForm', () => {
  it('reads openToAdvice and openToMentorship as separate booleans', () => {
    const result = parseHelperPreferenceForm(
      form({
        openToAdvice: 'on',
        openToMentorship: 'on',
        topics: 'product, hiring',
        maxActiveMentees: '5',
        maxPendingRequests: '10',
      }),
    )
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.openToAdvice).toBe(true)
      expect(result.data.openToMentorship).toBe(true)
      expect(result.data.topics).toEqual(['product', 'hiring'])
    }
  })

  it('falls back to legacy isOpen field for openToMentorship when missing', () => {
    const result = parseHelperPreferenceForm(
      form({
        openToAdvice: 'on',
        isOpen: 'on',
        maxActiveMentees: '5',
        maxPendingRequests: '10',
      }),
    )
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.openToMentorship).toBe(true)
  })

  it('treats unchecked checkboxes as false', () => {
    const result = parseHelperPreferenceForm(
      form({
        // openToAdvice + openToMentorship intentionally absent
        maxActiveMentees: '5',
        maxPendingRequests: '10',
      }),
    )
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.openToAdvice).toBe(false)
      expect(result.data.openToMentorship).toBe(false)
    }
  })
})
