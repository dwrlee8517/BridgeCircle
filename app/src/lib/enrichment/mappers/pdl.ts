import type { ExtractedProfile } from '@/lib/resume/schemas'
import { extractedProfileSchema } from '@/lib/resume/schemas'
import type { EnrichmentResult } from '../types'

/**
 * Map a People Data Labs Person Enrichment response into ExtractedProfile.
 *
 * PDL aggregates from many sources, not just LinkedIn — that's why it's the
 * fallback when LinkdAPI/BD can't resolve a profile. Field names differ from
 * the LinkedIn-shaped providers: `job_company_name`, `job_title`, `location_name`,
 * `experience` array with `summary` instead of `description`, etc.
 *
 * Shape reference: https://docs.peopledatalabs.com/docs/person-enrichment-api
 */
type PdlPerson = {
  id?: string | null
  linkedin_url?: string | null
  linkedin_username?: string | null
  full_name?: string | null
  job_title?: string | null
  job_company_name?: string | null
  location_name?: string | null
  job_summary?: string | null
  headline?: string | null
  experience?: Array<{
    company?: { name?: string | null } | string | null
    title?: { name?: string | null } | string | null
    start_date?: string | null
    end_date?: string | null
    summary?: string | null
  }> | null
  education?: Array<{
    school?: { name?: string | null } | string | null
    degrees?: string[] | null
    majors?: string[] | null
    start_date?: string | null
    end_date?: string | null
  }> | null
  skills?: string[] | null
}

export function mapPdlPerson(raw: unknown): EnrichmentResult {
  const r = raw as PdlPerson | null | undefined
  if (!r || typeof r !== 'object') {
    return { ok: false, error: 'invalid_response', detail: 'not an object' }
  }

  const profile: ExtractedProfile = {
    name: takeString(r.full_name),
    headline: takeString(r.headline) ?? takeString(r.job_summary),
    city: takeString(r.location_name),
    currentEmployer: takeString(r.job_company_name),
    currentTitle: takeString(r.job_title),
    university: takeString(unwrap(r.education?.[0]?.school, 'name')),
    major: takeString(r.education?.[0]?.majors?.[0]),
    careerHistory: (r.experience ?? [])
      .slice(0, 50)
      .map((e) => ({
        employer: requireString(unwrap(e.company, 'name'), 'unknown'),
        title: requireString(unwrap(e.title, 'name'), 'unknown'),
        startDate: yearString(e.start_date),
        endDate: yearString(e.end_date),
        description: takeString(e.summary),
      }))
      .filter((e) => e.employer !== 'unknown' || e.title !== 'unknown'),
    educationHistory: (r.education ?? [])
      .slice(0, 20)
      .map((e) => ({
        school: requireString(unwrap(e.school, 'name'), 'unknown'),
        degree: takeString(e.degrees?.[0]),
        field: takeString(e.majors?.[0]),
        startDate: yearString(e.start_date),
        endDate: yearString(e.end_date),
      }))
      .filter((e) => e.school !== 'unknown'),
    skills: (r.skills ?? [])
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

  const recordId = takeString(r.id) ?? takeString(r.linkedin_url)
  if (!recordId) {
    return { ok: false, error: 'invalid_response', detail: 'missing id and linkedin_url' }
  }

  return {
    ok: true,
    profile: validated.data,
    providerRecordId: recordId,
    linkedinUsername: takeString(r.linkedin_username) ?? extractUsername(r.linkedin_url),
    recordTimestamp: null,
  }
}

function takeString(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t.length === 0 ? null : t
}

function requireString(v: unknown, fallback: string): string {
  return takeString(v) ?? fallback
}

function unwrap(obj: unknown, key: string): unknown {
  if (typeof obj === 'string') return obj
  if (obj && typeof obj === 'object' && key in obj) {
    return (obj as Record<string, unknown>)[key]
  }
  return null
}

function yearString(value: unknown): string | null {
  const s = takeString(value)
  if (!s) return null
  const m = s.match(/^(\d{4})(?:-(\d{1,2}))?/)
  if (!m) return null
  const year = m[1]
  const month = m[2]
  return month ? `${year}-${month.padStart(2, '0')}` : year
}

function extractUsername(url: unknown): string | null {
  const s = takeString(url)
  if (!s) return null
  const m = s.match(/linkedin\.com\/in\/([^/?#]+)/i)
  return m?.[1] ?? null
}
