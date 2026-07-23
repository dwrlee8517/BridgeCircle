import { describe, expect, it } from 'vitest'
import { inferOnboardingStep, parseOnboardingStep, resolveOnboardingStep } from './progress'

const completeProfile = {
  name: 'Onboarding QA',
  graduationYear: 2026,
  university: 'Stanford University',
  major: 'Computer Science',
  educationHistory: [],
  currentEmployer: 'BridgeCircle',
  currentTitle: 'Member',
  city: 'Los Angeles, CA',
  headline: 'Helping fellow alumni',
  industry: 'Technology',
  careerHistory: [{ employer: 'BridgeCircle' }],
  skills: ['fundraising'],
}

describe('onboarding progress', () => {
  it('parses bounded onboarding steps', () => {
    expect(parseOnboardingStep(undefined)).toBeNull()
    expect(parseOnboardingStep('0')).toBeNull()
    expect(parseOnboardingStep('abc')).toBeNull()
    expect(parseOnboardingStep('3')).toBe(3)
    expect(parseOnboardingStep('99')).toBe(7)
  })

  it('forces step 1 until the required identity floor exists', () => {
    expect(inferOnboardingStep({ ...completeProfile, name: '', graduationYear: 2026 })).toBe(1)
    expect(
      inferOnboardingStep({ ...completeProfile, name: 'Onboarding QA', graduationYear: null }),
    ).toBe(1)
  })

  it('chooses the first optional step without saved content', () => {
    expect(
      inferOnboardingStep({
        ...completeProfile,
        university: '',
        major: '',
        educationHistory: [],
      }),
    ).toBe(3)

    expect(
      inferOnboardingStep({
        ...completeProfile,
        currentEmployer: '',
        currentTitle: '',
        city: '',
        headline: '',
        industry: '',
      }),
    ).toBe(4)

    expect(
      inferOnboardingStep({
        ...completeProfile,
        careerHistory: [],
        skills: [],
      }),
    ).toBe(5)
  })

  it('uses Help once profile setup content exists through Activities', () => {
    expect(inferOnboardingStep(completeProfile)).toBe(6)
  })

  it('allows intentional Back navigation through an explicit step', () => {
    expect(
      resolveOnboardingStep({
        explicit: 3,
        cookie: 6,
        durable: 6,
        inferred: 5,
      }),
    ).toBe(3)
  })

  it('prefers cross-device durable progress over a stale cookie', () => {
    expect(
      resolveOnboardingStep({
        explicit: null,
        cookie: 3,
        durable: 6,
        inferred: 5,
      }),
    ).toBe(6)
  })

  it('does not let inferred profile fields skip an intentionally durable optional step', () => {
    expect(
      resolveOnboardingStep({
        explicit: null,
        cookie: null,
        durable: 2,
        inferred: 3,
      }),
    ).toBe(2)
  })

  it('uses inferred profile truth only when no saved progress marker exists', () => {
    expect(
      resolveOnboardingStep({
        explicit: null,
        cookie: null,
        durable: null,
        inferred: 5,
      }),
    ).toBe(5)
  })
})
