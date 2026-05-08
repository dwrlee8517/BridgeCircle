import { describe, expect, test } from 'vitest'
import { deriveSignals, type SignalAskerSnapshot, type SignalHelperSnapshot } from './signals'

const baseAsker: SignalAskerSnapshot = {
  graduationYear: 2019,
  university: 'Wharton',
  major: 'Economics',
  city: 'New York',
}

const sparseHelper: SignalHelperSnapshot = {
  graduationYear: null,
  university: null,
  major: null,
  city: null,
  bio: null,
  mentoringTopics: null,
  careerHistory: null,
}

describe('deriveSignals', () => {
  test('returns empty list for sparse helper with no overlap', () => {
    const signals = deriveSignals(baseAsker, sparseHelper)
    expect(signals).toEqual([])
  })

  test('detects career arc when helper has 2+ different employers', () => {
    const signals = deriveSignals(baseAsker, {
      ...sparseHelper,
      careerHistory: [
        {
          employer: 'McKinsey',
          title: 'Associate',
          startDate: '2014-06-01',
          endDate: '2019-08-01',
        },
        { employer: 'Stripe', title: 'PM', startDate: '2020-01-01', endDate: null },
      ],
    })
    const arc = signals.find((s) => s.id === 'career-arc')
    expect(arc).toBeDefined()
    expect(arc?.label).toContain('McKinsey')
    expect(arc?.label).toContain('Stripe')
    expect(arc?.promptText).toContain('McKinsey')
    expect(arc?.promptText).toContain('Stripe')
  })

  test('does NOT emit career arc when helper has only one employer (across multiple roles)', () => {
    const signals = deriveSignals(baseAsker, {
      ...sparseHelper,
      careerHistory: [
        { employer: 'Stripe', title: 'PM', startDate: '2020-01-01', endDate: '2022-01-01' },
        { employer: 'Stripe', title: 'Senior PM', startDate: '2022-01-01', endDate: null },
      ],
    })
    expect(signals.find((s) => s.id === 'career-arc')).toBeUndefined()
  })

  test('detects bio openness when trigger phrase is present', () => {
    const signals = deriveSignals(baseAsker, {
      ...sparseHelper,
      bio: 'Always happy to talk to alumni thinking about the consulting → tech jump.',
    })
    expect(signals.find((s) => s.id === 'bio-open')).toBeDefined()
  })

  test('does NOT emit bio openness when no trigger present', () => {
    const signals = deriveSignals(baseAsker, {
      ...sparseHelper,
      bio: 'Currently leading product at a fintech startup. Previously at McKinsey.',
    })
    expect(signals.find((s) => s.id === 'bio-open')).toBeUndefined()
  })

  test('emits mentoring-topic signal using the first listed topic', () => {
    const signals = deriveSignals(baseAsker, {
      ...sparseHelper,
      mentoringTopics: ['career switching', 'product management', 'consulting exits'],
    })
    const topic = signals.find((s) => s.id === 'mentoring-topic')
    expect(topic?.label).toContain('career switching')
  })

  test('emits shared-city signal when cities match', () => {
    const signals = deriveSignals(baseAsker, { ...sparseHelper, city: 'New York' })
    expect(signals.find((s) => s.id === 'shared-city')).toBeDefined()
  })

  test('emits shared-school + shared-major when both match', () => {
    const signals = deriveSignals(baseAsker, {
      ...sparseHelper,
      university: 'Wharton',
      major: 'Economics',
    })
    expect(signals.find((s) => s.id === 'shared-school')).toBeDefined()
    expect(signals.find((s) => s.id === 'shared-major')).toBeDefined()
  })

  test('emits near-cohort when graduation years are within 5', () => {
    const signals = deriveSignals(baseAsker, { ...sparseHelper, graduationYear: 2014 })
    expect(signals.find((s) => s.id === 'near-cohort')).toBeDefined()
  })

  test('does NOT emit near-cohort when years are >5 apart', () => {
    const signals = deriveSignals(baseAsker, { ...sparseHelper, graduationYear: 2005 })
    expect(signals.find((s) => s.id === 'near-cohort')).toBeUndefined()
  })

  test('does NOT emit near-cohort when years are identical (would just be "same year" — covered by exact-match logic elsewhere)', () => {
    const signals = deriveSignals(baseAsker, { ...sparseHelper, graduationYear: 2019 })
    expect(signals.find((s) => s.id === 'near-cohort')).toBeUndefined()
  })

  test('caps total count at maxCount', () => {
    // Helper with every possible signal.
    const helper: SignalHelperSnapshot = {
      graduationYear: 2014,
      university: 'Wharton',
      major: 'Economics',
      city: 'New York',
      bio: 'Happy to talk about anything.',
      mentoringTopics: ['mentorship'],
      careerHistory: [
        { employer: 'McKinsey', title: null, startDate: '2010-01-01', endDate: '2015-01-01' },
        { employer: 'Stripe', title: null, startDate: '2015-02-01', endDate: null },
      ],
    }
    const signals = deriveSignals(baseAsker, helper, 3)
    expect(signals).toHaveLength(3)
  })

  test('strong signals come before weak ones in default ordering', () => {
    const helper: SignalHelperSnapshot = {
      graduationYear: 2014,
      university: 'Wharton',
      major: 'Economics',
      city: 'New York',
      bio: null,
      mentoringTopics: null,
      careerHistory: [
        { employer: 'McKinsey', title: null, startDate: '2010-01-01', endDate: '2015-01-01' },
        { employer: 'Stripe', title: null, startDate: '2015-02-01', endDate: null },
      ],
    }
    const signals = deriveSignals(baseAsker, helper)
    // Career first, then weak shared-* signals.
    expect(signals[0]?.kind).toBe('career')
    const weakKinds = signals.slice(1).map((s) => s.kind)
    expect(weakKinds).not.toContain('career')
  })
})
