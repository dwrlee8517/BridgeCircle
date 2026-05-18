import { createHash } from 'node:crypto'
import type { ExtractedProfile } from '@/lib/resume/schemas'
import type { ProfileFingerprint } from './types'

/**
 * Pull the four fingerprint dimensions out of an ExtractedProfile. The shape
 * is intentionally Bright Data-aligned: current_employer / current_title /
 * current_location / most_recent_school. Other providers normalize into the
 * same fields before fingerprinting so sweep-to-sweep and sweep-to-manual
 * comparisons stay apples-to-apples.
 *
 * mostRecentSchool is derived from educationHistory ordered by most recent
 * end_date (null = ongoing = most recent). university is a separate scalar
 * but we prefer the array entry because the resume extractor populates both
 * and we want the fingerprint to update when a new degree lands.
 */
export function projectFingerprint(profile: ExtractedProfile): ProfileFingerprint {
  const mostRecentSchool =
    pickMostRecentSchool(profile.educationHistory) ?? profile.university ?? null
  return {
    currentEmployer: normalizeNullable(profile.currentEmployer),
    currentTitle: normalizeNullable(profile.currentTitle),
    currentLocation: normalizeNullable(profile.city),
    mostRecentSchool: normalizeNullable(mostRecentSchool),
  }
}

/**
 * Stable, lowercase-trimmed hash of the fingerprint. We hash rather than
 * store the JSON so the column stays small and diff-cheap; the cleartext
 * fingerprint never needs to be read, only compared.
 */
export function hashFingerprint(fp: ProfileFingerprint): string {
  const canonical = JSON.stringify({
    e: fp.currentEmployer?.toLowerCase() ?? null,
    t: fp.currentTitle?.toLowerCase() ?? null,
    l: fp.currentLocation?.toLowerCase() ?? null,
    s: fp.mostRecentSchool?.toLowerCase() ?? null,
  })
  return createHash('sha256').update(canonical).digest('hex')
}

export function fingerprintProfile(profile: ExtractedProfile): {
  fingerprint: ProfileFingerprint
  hash: string
} {
  const fp = projectFingerprint(profile)
  return { fingerprint: fp, hash: hashFingerprint(fp) }
}

export function fingerprintsDiffer(prevHash: string | null, nextHash: string): boolean {
  if (!prevHash) return true
  return prevHash !== nextHash
}

function normalizeNullable(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function pickMostRecentSchool(history: ExtractedProfile['educationHistory']): string | null {
  if (!history || history.length === 0) return null
  // "Most recent" = null end_date wins; otherwise the largest end_date string
  // compares lexicographically because dates are YYYY or YYYY-MM.
  const ranked = [...history].sort((a, b) => {
    if (a.endDate === null && b.endDate === null) return 0
    if (a.endDate === null) return -1
    if (b.endDate === null) return 1
    return b.endDate.localeCompare(a.endDate)
  })
  return ranked[0]?.school ?? null
}
