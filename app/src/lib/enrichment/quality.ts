import type { ExtractedProfile } from '@/lib/resume/schemas'

/**
 * Gate that runs on every provider result before a proposal can be created.
 * See docs/architecture/profile-enrichment.md §"Quality Checks Before Trusting
 * Provider Output". On failure, the caller writes a 'failed' run row and
 * silently skips — never surfaces a malformed proposal to the user.
 */
export type QualityResult = { ok: true } | { ok: false; reason: QualityReason }

export type QualityReason =
  | 'name_missing'
  | 'name_mismatch'
  | 'current_title_dropped'
  | 'current_employer_dropped'
  | 'career_array_invalid'
  | 'education_array_invalid'
  | 'total_replacement'
  | 'placeholder_value'

export function isAcceptableResult(prev: ExtractedProfile, next: ExtractedProfile): QualityResult {
  if (!next.name || next.name.trim().length === 0) {
    return { ok: false, reason: 'name_missing' }
  }

  if (prev.name && !nameSimilarEnough(prev.name, next.name)) {
    return { ok: false, reason: 'name_mismatch' }
  }

  if (!Array.isArray(next.careerHistory)) {
    return { ok: false, reason: 'career_array_invalid' }
  }
  if (!Array.isArray(next.educationHistory)) {
    return { ok: false, reason: 'education_array_invalid' }
  }

  const providerSupportsNoCurrentRole =
    next.currentEmployer === null &&
    next.currentTitle === null &&
    next.careerHistory.length > 0 &&
    next.careerHistory.every((entry) => entry.endDate !== null)

  if (
    prev.currentTitle &&
    prev.currentTitle.trim().length > 0 &&
    !next.currentTitle &&
    !providerSupportsNoCurrentRole
  ) {
    return { ok: false, reason: 'current_title_dropped' }
  }

  if (
    prev.currentEmployer &&
    prev.currentEmployer.trim().length > 0 &&
    !next.currentEmployer &&
    !providerSupportsNoCurrentRole
  ) {
    return { ok: false, reason: 'current_employer_dropped' }
  }

  if (looksLikeTotalReplacement(prev, next)) {
    return { ok: false, reason: 'total_replacement' }
  }

  if (containsPlaceholder(next)) {
    return { ok: false, reason: 'placeholder_value' }
  }

  return { ok: true }
}

const PLACEHOLDER_PATTERNS = [
  /redacted/i,
  /\*\*\*+/,
  /\[hidden\]/i,
  /n\/a/i,
  /^x{3,}$/i,
  /^placeholder$/i,
]

function containsPlaceholder(profile: ExtractedProfile): boolean {
  const scalars = [
    profile.name,
    profile.headline,
    profile.currentEmployer,
    profile.currentTitle,
    profile.city,
    profile.university,
    profile.major,
  ]
  return scalars.some((s) => s != null && PLACEHOLDER_PATTERNS.some((p) => p.test(s)))
}

function looksLikeTotalReplacement(prev: ExtractedProfile, next: ExtractedProfile): boolean {
  // If the previous profile had at least 2 career entries and the new one has
  // zero — and we previously had a current employer — that's almost always a
  // sparse provider response, not a real career wipe.
  if ((prev.careerHistory?.length ?? 0) >= 2 && (next.careerHistory?.length ?? 0) === 0) {
    return true
  }
  if ((prev.educationHistory?.length ?? 0) >= 2 && (next.educationHistory?.length ?? 0) === 0) {
    return true
  }
  return false
}

/**
 * Token-overlap similarity. We're guarding against the provider returning a
 * wholly different person (e.g. a URL collision or stale crawl). Aiming for
 * "Jin Park" ~= "Jin H. Park" ~= "박진" + romanization variants is the bar.
 *
 * Pragmatic threshold: require at least one token (length >= 2) shared
 * between normalized names. Case-folded, punctuation stripped.
 */
function nameSimilarEnough(a: string, b: string): boolean {
  const ta = nameTokens(a)
  const tb = nameTokens(b)
  if (ta.length === 0 || tb.length === 0) return true // can't judge; let it pass
  const intersect = ta.filter((t) => tb.includes(t))
  return intersect.length > 0
}

function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2)
}
