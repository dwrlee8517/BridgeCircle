import { describe, expect, it } from 'vitest'
import { parseAskForm, parseHelperPreferenceForm } from './schemas'

function form(entries: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(entries)) fd.set(k, v)
  return fd
}

const HELPER_A = crypto.randomUUID()
const HELPER_B = crypto.randomUUID()

describe('parseAskForm', () => {
  const validReason = 'I have a quick question about your role at Anthropic.'
  const validHelp = 'Would love 15 minutes to ask about the day-to-day.'

  it('accepts an ask with helperId', () => {
    const result = parseAskForm(
      form({
        helperId: HELPER_A,
        reason: validReason,
        helpNeeded: validHelp,
      }),
    )
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.helperId).toBe(HELPER_A)
      expect(result.data.reason).toBe(validReason)
    }
  })

  it('accepts an ask with no reason field', () => {
    const result = parseAskForm(
      form({
        helperId: HELPER_A,
        helpNeeded: validHelp,
      }),
    )
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.reason).toBeNull()
  })

  it('treats an empty reason as null', () => {
    const result = parseAskForm(
      form({
        helperId: HELPER_B,
        reason: '',
        helpNeeded: validHelp,
      }),
    )
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.reason).toBeNull()
  })

  it('ignores legacy type-split fields (askType, commitment, screeningAnswer)', () => {
    const result = parseAskForm(
      form({
        helperId: HELPER_B,
        helpNeeded: validHelp,
        askType: 'mentorship',
        commitment: 'monthly_semester',
        screeningAnswer: 'Whether to accept the consulting offer by July 1.',
      }),
    )
    expect(result.success).toBe(true)
    if (result.success) {
      expect('askType' in result.data).toBe(false)
      expect('commitment' in result.data).toBe(false)
      expect('screeningAnswer' in result.data).toBe(false)
    }
  })

  it('rejects a missing helperId', () => {
    const result = parseAskForm(form({ helpNeeded: validHelp }))
    expect(result.success).toBe(false)
  })

  it('rejects a too-short helpNeeded', () => {
    const result = parseAskForm(form({ helperId: HELPER_A, helpNeeded: 'help' }))
    expect(result.success).toBe(false)
  })

  it('rejects helpNeeded over the 800-char draft ceiling', () => {
    const result = parseAskForm(form({ helperId: HELPER_A, helpNeeded: 'x'.repeat(801) }))
    expect(result.success).toBe(false)
  })
})

describe('parseHelperPreferenceForm', () => {
  it('reads the single openToHelp state and topics', () => {
    const result = parseHelperPreferenceForm(
      form({
        openToHelp: 'on',
        topics: 'product, hiring',
      }),
    )
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.openToHelp).toBe(true)
      expect(result.data.topics).toEqual(['product', 'hiring'])
    }
  })

  it('treats an unchecked checkbox as false', () => {
    const result = parseHelperPreferenceForm(form({}))
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.openToHelp).toBe(false)
      expect(result.data.topics).toEqual([])
    }
  })

  it('trims and drops empty topic entries', () => {
    const result = parseHelperPreferenceForm(
      form({
        openToHelp: 'on',
        topics: ' consulting , , business school ',
      }),
    )
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.topics).toEqual(['consulting', 'business school'])
  })
})
