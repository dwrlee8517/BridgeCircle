import { describe, expect, it } from 'vitest'
import { inferOnboardingStep, parseOnboardingStep } from './progress'

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
  linkedinUrl: 'https://linkedin.com/in/example',
  careerHistory: [{ employer: 'BridgeCircle' }],
  skills: ['fundraising'],
}

describe('onboarding progress', () => {
  it('parses bounded onboarding steps', () => {
    expect(parseOnboardingStep(undefined)).toBeNull()
    expect(parseOnboardingStep('0')).toBeNull()
    expect(parseOnboardingStep('abc')).toBeNull()
    expect(parseOnboardingStep('3')).toBe(3)
    expect(parseOnboardingStep('99')).toBe(5)
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
    ).toBe(2)

    expect(
      inferOnboardingStep({
        ...completeProfile,
        currentEmployer: '',
        currentTitle: '',
        city: '',
        headline: '',
        linkedinUrl: '',
      }),
    ).toBe(3)

    expect(
      inferOnboardingStep({
        ...completeProfile,
        careerHistory: [],
        skills: [],
      }),
    ).toBe(4)
  })

  it('uses step 5 once profile setup content exists through step 4', () => {
    expect(inferOnboardingStep(completeProfile)).toBe(5)
  })
})
