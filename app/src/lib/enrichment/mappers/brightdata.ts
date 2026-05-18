import type { ExtractedProfile } from '@/lib/resume/schemas'
import { extractedProfileSchema } from '@/lib/resume/schemas'
import type { EnrichmentResult } from '../types'

/**
 * Map a Bright Data LinkedIn People dataset record into ExtractedProfile.
 * Dataset shape reference:
 * https://brightdata.com/products/datasets/linkedin/profiles
 *
 * The dataset normalizes fields predictably (snake_case strings, no nested
 * objects for company names). That's the whole point of using it for the
 * recurring sweep — fingerprinting is cheap because the shape is flat.
 */
type BrightDataRecord = {
  id?: string | null
  url?: string | null
  name?: string | null
  position?: string | null
  current_company?: string | null
  current_company_name?: string | null
  city?: string | null
  country_code?: string | null
  about?: string | null
  experience?: Array<{
    company?: string | null
    title?: string | null
    start_date?: string | null
    end_date?: string | null
    description?: string | null
  }> | null
  education?: Array<{
    title?: string | null
    degree?: string | null
    field?: string | null
    start_year?: number | string | null
    end_year?: number | string | null
  }> | null
  skills?: Array<string | { name?: string | null }> | null
  timestamp?: string | null
}

export function mapBrightDataRecord(raw: unknown): EnrichmentResult {
  const r = raw as BrightDataRecord | null | undefined
  if (!r || typeof r !== 'object') {
    return { ok: false, error: 'invalid_response', detail: 'not an object' }
  }

  const profile: ExtractedProfile = {
    name: takeString(r.name),
    headline: takeString(r.about?.split('\n')[0]) ?? takeString(r.position),
    city: composeLocation(r.city, r.country_code),
    currentEmployer: takeString(r.current_company_name ?? r.current_company),
    currentTitle: takeString(r.position),
    university: takeString(r.education?.[0]?.title),
    major: takeString(r.education?.[0]?.field),
    careerHistory: (r.experience ?? [])
      .slice(0, 50)
      .map((e) => ({
        employer: takeString(e.company) ?? 'unknown',
        title: takeString(e.title) ?? 'unknown',
        startDate: yearString(e.start_date),
        endDate: yearString(e.end_date),
        description: takeString(e.description),
      }))
      .filter((e) => e.employer !== 'unknown' || e.title !== 'unknown'),
    educationHistory: (r.education ?? [])
      .slice(0, 20)
      .map((e) => ({
        school: takeString(e.title) ?? 'unknown',
        degree: takeString(e.degree),
        field: takeString(e.field),
        startDate: yearOrNull(e.start_year),
        endDate: yearOrNull(e.end_year),
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

  const recordId = takeString(r.id) ?? takeString(r.url)
  if (!recordId) {
    return { ok: false, error: 'invalid_response', detail: 'missing id and url' }
  }

  return {
    ok: true,
    profile: validated.data,
    providerRecordId: recordId,
    linkedinUsername: extractUsername(r.url),
    recordTimestamp: takeString(r.timestamp),
  }
}

function takeString(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t.length === 0 ? null : t
}

function composeLocation(city: unknown, country: unknown): string | null {
  const c = takeString(city)
  const co = takeString(country)
  if (c && co) return `${c}, ${co.toUpperCase()}`
  return c ?? co
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

function yearOrNull(value: unknown): string | null {
  if (typeof value === 'number') return String(value)
  return yearString(value)
}

function extractUsername(url: unknown): string | null {
  const s = takeString(url)
  if (!s) return null
  const m = s.match(/linkedin\.com\/in\/([^/?#]+)/i)
  return m?.[1] ?? null
}
