import type { ProfileCommandResult, ProfileRepository } from './contracts'
import type {
  OnboardingAboutInput,
  OnboardingCurrentInput,
  OnboardingEducationInput,
  OnboardingHelpInput,
  OnboardingPastInput,
} from './schemas'

export type SavePartialResult =
  | { ok: true }
  | {
      ok: false
      error: 'no_membership' | 'incomplete_profile' | 'db_error'
      detail?: string
    }

export async function saveOnboardingAbout(
  repository: ProfileRepository,
  membershipId: string,
  input: OnboardingAboutInput,
): Promise<SavePartialResult> {
  return mapCommandResult(
    await repository.saveIdentity(membershipId, {
      displayName: input.name,
      preferredName: input.preferredName ?? null,
      nameOther: input.nameOther ?? null,
      graduationYear: input.graduationYear,
    }),
  )
}

export async function saveOnboardingEducation(
  repository: ProfileRepository,
  membershipId: string,
  input: OnboardingEducationInput,
): Promise<SavePartialResult> {
  return mapCommandResult(
    await repository.saveEducation(membershipId, {
      university: input.university ?? null,
      major: input.major ?? null,
      education: input.educationHistory.map((entry) => ({
        school: entry.school,
        degree: entry.degree,
        field: entry.field,
        ...period(entry.startDate, entry.endDate),
        description: null,
      })),
    }),
  )
}

export async function saveOnboardingCurrent(
  repository: ProfileRepository,
  membershipId: string,
  input: OnboardingCurrentInput,
): Promise<SavePartialResult> {
  return mapCommandResult(
    await repository.saveCurrent(membershipId, {
      currentEmployer: input.currentEmployer ?? null,
      currentTitle: input.currentTitle ?? null,
      city: input.city ?? null,
      headline: input.headline ?? null,
      linkedinUrl: input.linkedinUrl ?? null,
    }),
  )
}

export async function saveOnboardingPast(
  repository: ProfileRepository,
  membershipId: string,
  input: OnboardingPastInput,
): Promise<SavePartialResult> {
  return mapCommandResult(
    await repository.saveHistory(membershipId, {
      experiences: input.careerHistory.map((entry) => ({
        employer: entry.employer,
        title: entry.title,
        ...period(entry.startDate, entry.endDate),
        description: entry.description,
      })),
      skills: input.skills,
    }),
  )
}

export async function saveOnboardingHelp(
  repository: ProfileRepository,
  membershipId: string,
  input: OnboardingHelpInput,
): Promise<SavePartialResult> {
  const current = await repository.get(membershipId)
  if (!current.ok) return { ok: false, error: 'no_membership' }

  const linkedinUrl =
    current.profile.preferences.freshness.linkedinUrl ?? current.profile.current.linkedinUrl
  const topics = (input.helperTopics ?? '')
    .split(',')
    .map((topic) => topic.trim())
    .filter(Boolean)

  return mapCommandResult(
    await repository.savePreferences(membershipId, {
      bio: input.bio ?? null,
      openToHelp: input.openToHelp,
      topics,
      linkedinUrl,
      refreshPolicy: input.freshnessPolicy,
      refreshInterval: current.profile.preferences.freshness.refreshInterval,
      freshnessConsent: linkedinUrl !== null,
    }),
  )
}

export async function markOnboardingComplete(
  repository: ProfileRepository,
  membershipId: string,
): Promise<SavePartialResult> {
  const result = await repository.completeOnboarding(membershipId)
  if (result.ok) return { ok: true }
  if (result.error === 'not_owned' || result.error === 'membership_unavailable') {
    return { ok: false, error: 'no_membership' }
  }
  if (result.error === 'incomplete_profile') {
    return { ok: false, error: 'incomplete_profile' }
  }
  return { ok: false, error: 'db_error', detail: result.error }
}

function mapCommandResult(result: ProfileCommandResult): SavePartialResult {
  if (result === 'saved') return { ok: true }
  if (result === 'not_owned' || result === 'membership_unavailable') {
    return { ok: false, error: 'no_membership' }
  }
  return { ok: false, error: 'db_error', detail: result }
}

function period(start: string | null, end: string | null) {
  const startParts = dateParts(start)
  const endParts = dateParts(end)
  return {
    startYear: startParts.year,
    startMonth: startParts.month,
    endYear: endParts.year,
    endMonth: endParts.month,
  }
}

function dateParts(value: string | null): { year: number | null; month: number | null } {
  if (!value) return { year: null, month: null }
  const match = /^(\d{4})(?:-(\d{2}))?/.exec(value)
  if (!match) return { year: null, month: null }
  return {
    year: Number(match[1]),
    month: match[2] ? Number(match[2]) : null,
  }
}
