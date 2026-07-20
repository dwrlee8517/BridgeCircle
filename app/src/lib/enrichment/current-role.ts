import type { CareerEntry, ExtractedProfile } from '@/lib/resume/schemas'

type SuggestedCurrentRole = {
  employer?: string | null
  title?: string | null
}

/**
 * A provider's "current" flag is only trustworthy when the same role appears
 * in career history without an end date. This protects profile imports from
 * stale provider summary fields that still name a role which has already
 * ended.
 */
export function findSupportedCurrentRole(
  careerHistory: CareerEntry[],
  suggested: SuggestedCurrentRole = {},
): CareerEntry | null {
  const openRoles = careerHistory.filter((entry) => entry.endDate === null)
  const employer = normalizeRoleText(suggested.employer)
  const title = normalizeRoleText(suggested.title)

  if (!employer && !title) return openRoles[0] ?? null

  return (
    openRoles.find((entry) => {
      if (employer && normalizeRoleText(entry.employer) !== employer) return false
      if (title && normalizeRoleText(entry.title) !== title) return false
      return true
    }) ?? null
  )
}

export function isCurrentRoleSupported(profile: ExtractedProfile): boolean {
  if (!profile.currentEmployer && !profile.currentTitle) return false
  return (
    findSupportedCurrentRole(profile.careerHistory, {
      employer: profile.currentEmployer,
      title: profile.currentTitle,
    }) !== null
  )
}

function normalizeRoleText(value: string | null | undefined): string | null {
  const normalized = value
    ?.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  return normalized || null
}
