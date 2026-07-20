import type { ExtractedProfile } from '@/lib/resume/schemas'
import { extractedProfileSchema } from '@/lib/resume/schemas'
import { findSupportedCurrentRole } from '../current-role'
import type { EnrichmentResult } from '../types'

/**
 * Map a LinkdAPI /profile/full response into ExtractedProfile shape.
 *
 * LinkdAPI wraps the profile in `{ success, statusCode, data: {...} }` — the
 * provider unwraps the envelope before calling this mapper, so the input
 * here is the bare profile object.
 *
 * Shape reference: probed live against /api/v1/profile/full. Key fields:
 *   urn, username, firstName, lastName, headline
 *   geo: { country, city, full, countryCode }
 *   currentPositions: [{ companyName, company }]
 *   fullPositions:    [{ companyName, title, start: {year,month}, end: {year,month}, description }]
 *   educations:       [{ schoolName, degree, fieldOfStudy, start: {year,month}, end: {year,month} }]
 *   skills:           [{ name, passedSkillAssessment }]
 */
type LinkdApiProfile = {
  urn?: string | null
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  headline?: string | null
  summary?: string | null
  geo?: { country?: string | null; city?: string | null; full?: string | null } | null
  currentPositions?: Array<{
    companyName?: string | null
    company?: { name?: string | null } | null
  }> | null
  fullPositions?: Array<{
    companyName?: string | null
    title?: string | null
    description?: string | null
    start?: { year?: number | null; month?: number | null } | null
    end?: { year?: number | null; month?: number | null } | null
  }> | null
  educations?: Array<{
    schoolName?: string | null
    degree?: string | null
    fieldOfStudy?: string | null
    start?: { year?: number | null; month?: number | null } | null
    end?: { year?: number | null; month?: number | null } | null
  }> | null
  skills?: Array<{ name?: string | null } | string> | null
  lastUpdated?: string | null
}

export function mapLinkdApiProfile(raw: unknown): EnrichmentResult {
  const r = raw as LinkdApiProfile | null | undefined
  if (!r || typeof r !== 'object') {
    return { ok: false, error: 'invalid_response', detail: 'not an object' }
  }

  const fullName = composeName(r.firstName, r.lastName)
  const career = (r.fullPositions ?? [])
    .slice(0, 50)
    .map((p) => ({
      employer: takeString(p.companyName) ?? 'unknown',
      title: takeString(p.title) ?? 'unknown',
      startDate: ymString(p.start),
      endDate: ymString(p.end),
      // LinkedIn descriptions are freeform and routinely exceed the 1000-char
      // schema cap. Truncate rather than reject the whole profile.
      description: truncate(takeString(p.description), 1000),
    }))
    .filter((e) => e.employer !== 'unknown' || e.title !== 'unknown')

  // currentPositions carries the company but not the title, and can remain
  // stale after a role ends. Only accept it when a matching fullPosition is
  // open-ended. When currentPositions is absent, the first open-ended role is
  // the best supported current-role candidate.
  const currentEmployerFromCurrent =
    takeString(r.currentPositions?.[0]?.companyName) ??
    takeString(r.currentPositions?.[0]?.company?.name)
  const supportedCurrentRole = currentEmployerFromCurrent
    ? findSupportedCurrentRole(career, { employer: currentEmployerFromCurrent })
    : findSupportedCurrentRole(career)
  const currentEmployer = supportedCurrentRole?.employer ?? null
  const currentTitle = supportedCurrentRole?.title ?? null

  const profile: ExtractedProfile = {
    name: fullName,
    headline: takeString(r.headline),
    city: takeString(r.geo?.full) ?? takeString(r.geo?.city),
    currentEmployer,
    currentTitle,
    university: takeString(r.educations?.[0]?.schoolName),
    major: takeString(r.educations?.[0]?.fieldOfStudy),
    careerHistory: career,
    educationHistory: (r.educations ?? [])
      .slice(0, 20)
      .map((e) => ({
        school: takeString(e.schoolName) ?? 'unknown',
        degree: takeString(e.degree),
        field: takeString(e.fieldOfStudy),
        startDate: ymString(e.start),
        endDate: ymString(e.end),
      }))
      .filter((e) => e.school !== 'unknown'),
    skills: (r.skills ?? [])
      .map((s) => (typeof s === 'string' ? s : s?.name))
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      .slice(0, 80),
  }

  const validated = extractedProfileSchema.safeParse(profile)
  if (!validated.success) {
    return {
      ok: false,
      error: 'invalid_response',
      detail: validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    }
  }

  const recordId = takeString(r.urn) ?? takeString(r.username)
  if (!recordId) {
    return { ok: false, error: 'invalid_response', detail: 'missing urn and username' }
  }

  return {
    ok: true,
    profile: validated.data,
    providerRecordId: recordId,
    linkedinUsername: takeString(r.username),
    recordTimestamp: takeString(r.lastUpdated),
  }
}

function takeString(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t.length === 0 ? null : t
}

function truncate(v: string | null, max: number): string | null {
  if (v === null) return null
  return v.length <= max ? v : `${v.slice(0, max - 1).trimEnd()}…`
}

function composeName(first: unknown, last: unknown): string | null {
  const f = takeString(first)
  const l = takeString(last)
  if (f && l) return `${f} ${l}`
  return f ?? l
}

function ymString(value: unknown): string | null {
  if (typeof value === 'string') return takeString(value)
  if (value && typeof value === 'object') {
    const obj = value as { year?: unknown; month?: unknown }
    const year = typeof obj.year === 'number' && obj.year > 0 ? obj.year : null
    const month = typeof obj.month === 'number' && obj.month > 0 ? obj.month : null
    if (year && month) return `${year}-${String(month).padStart(2, '0')}`
    if (year) return String(year)
  }
  return null
}
