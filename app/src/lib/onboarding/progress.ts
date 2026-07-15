export const TOTAL_ONBOARDING_STEPS = 5
export const ONBOARDING_STEP_COOKIE = 'bridgecircle_onboarding_step'

export type OnboardingStep = 1 | 2 | 3 | 4 | 5

export type OnboardingProgressProfile = {
  name: string | null | undefined
  graduationYear: number | null | undefined
  university: string | null | undefined
  major: string | null | undefined
  educationHistory: unknown[] | null | undefined
  currentEmployer: string | null | undefined
  currentTitle: string | null | undefined
  city: string | null | undefined
  headline: string | null | undefined
  industry: string | null | undefined
  careerHistory: unknown[] | null | undefined
  skills: string[] | null | undefined
}

export function parseOnboardingStep(raw: string | null | undefined): OnboardingStep | null {
  if (!raw) return null
  const n = Number.parseInt(raw, 10)
  if (Number.isNaN(n) || n < 1) return null
  return Math.min(n, TOTAL_ONBOARDING_STEPS) as OnboardingStep
}

export function inferOnboardingStep(profile: OnboardingProgressProfile): OnboardingStep {
  if (!hasText(profile.name) || !profile.graduationYear) return 1

  if (
    !hasText(profile.university) &&
    !hasText(profile.major) &&
    !hasItems(profile.educationHistory)
  ) {
    return 2
  }

  if (
    !hasText(profile.currentEmployer) &&
    !hasText(profile.currentTitle) &&
    !hasText(profile.city) &&
    !hasText(profile.headline) &&
    !hasText(profile.industry)
  ) {
    return 3
  }

  if (!hasItems(profile.careerHistory) && !hasItems(profile.skills)) return 4

  return 5
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function hasItems(value: unknown[] | null | undefined): boolean {
  return Array.isArray(value) && value.length > 0
}
