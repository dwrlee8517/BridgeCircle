import 'server-only'
import type { ProfileRepository } from '@/lib/profile/contracts'

export type ImportCurrentProfile = {
  name: string | null
  headline: string | null
  city: string | null
  currentEmployer: string | null
  currentTitle: string | null
  university: string | null
  major: string | null
  linkedinUrl: string | null
  careerHistory: Array<{
    employer: string
    title: string
    start_date: string | null
    end_date: string | null
    description: string | null
  }>
  educationHistory: Array<{
    school: string
    degree: string | null
    field: string | null
    start_date: string | null
    end_date: string | null
  }>
  skills: string[]
}

export async function getImportCurrentProfile(
  profiles: Pick<ProfileRepository, 'get'>,
  membershipId: string,
): Promise<ImportCurrentProfile> {
  const result = await profiles.get(membershipId)
  if (!result.ok) return emptyImportCurrentProfile()

  const { profile } = result

  return {
    name: profile.identity.displayName,
    headline: profile.current.headline,
    city: profile.current.city,
    currentEmployer: profile.current.employer,
    currentTitle: profile.current.title,
    university: profile.current.university,
    major: profile.current.major,
    linkedinUrl: profile.preferences.freshness.linkedinUrl,
    careerHistory: profile.experiences.map((entry) => ({
      employer: entry.employer,
      title: entry.title,
      start_date: profilePeriod(entry.startYear, entry.startMonth),
      end_date: profilePeriod(entry.endYear, entry.endMonth),
      description: entry.description,
    })),
    educationHistory: profile.education.map((entry) => ({
      school: entry.school,
      degree: entry.degree,
      field: entry.field,
      start_date: profilePeriod(entry.startYear, entry.startMonth),
      end_date: profilePeriod(entry.endYear, entry.endMonth),
    })),
    skills: profile.skills.map((skill) => skill.name),
  }
}

function profilePeriod(year: number | null, month: number | null) {
  if (year === null) return null
  return month === null ? String(year) : `${year}-${String(month).padStart(2, '0')}`
}

function emptyImportCurrentProfile(): ImportCurrentProfile {
  return {
    name: null,
    headline: null,
    city: null,
    currentEmployer: null,
    currentTitle: null,
    university: null,
    major: null,
    linkedinUrl: null,
    careerHistory: [],
    educationHistory: [],
    skills: [],
  }
}
