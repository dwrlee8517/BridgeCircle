import type { ExtractedFilters } from './extractFilters'

/**
 * Display tags for the results rail's "How we read it" — the extractor's
 * structured reading of the member's question, surfaced so the match is
 * explainable (and correctable: a wrong tag tells the member to edit the
 * ask, not distrust the product).
 */

const MAX_READING_TAGS = 5

export function readingTags(filters: ExtractedFilters): string[] {
  const tags: string[] = []
  if (filters.theme) tags.push(sentenceCase(filters.theme))
  if (filters.employer) tags.push(filters.employer)
  if (filters.university) tags.push(filters.university)
  if (filters.major) tags.push(sentenceCase(filters.major))
  if (filters.city) tags.push(filters.city)
  else if (filters.country) tags.push(filters.country)
  if (filters.gradYearMin && filters.gradYearMax && filters.gradYearMin === filters.gradYearMax) {
    tags.push(`Class of ${filters.gradYearMin}`)
  } else if (filters.gradYearMin || filters.gradYearMax) {
    tags.push(`Classes ${filters.gradYearMin ?? '…'}–${filters.gradYearMax ?? 'now'}`)
  }

  const seen = new Set<string>()
  const unique = tags.filter((tag) => {
    const key = tag.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return unique.slice(0, MAX_READING_TAGS)
}

function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
