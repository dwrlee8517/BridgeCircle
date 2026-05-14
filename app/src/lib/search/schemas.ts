import { z } from 'zod'

const optStr = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

const optYear = z
  .string()
  .optional()
  .transform((v) => {
    if (!v) return undefined
    const n = Number(v)
    if (!Number.isFinite(n) || n < 1900 || n > 2100) return undefined
    return n
  })

const optBool = z
  .union([z.literal('on'), z.literal('true'), z.literal('1')])
  .optional()
  .transform((v) => (v ? true : undefined))

export const searchFiltersSchema = z.object({
  q: optStr,
  city: optStr,
  employer: optStr,
  university: optStr,
  major: optStr,
  topic: optStr,
  gradYearMin: optYear,
  gradYearMax: optYear,
  openToMentor: optBool,
  // "People I know" — restricts results to alumni you're already friends
  // with. Surfaced in People after the Friends page folded in (the
  // accepted-friends list is now this filter view rather than a separate
  // page).
  peopleIKnow: optBool,
})

export type SearchFilters = z.infer<typeof searchFiltersSchema>

/**
 * Filter scope for fields that have both a "current" directory column and a
 * JSONB history. Set by the NL extraction step when the query disambiguates;
 * the structured form leaves it undefined which defaults to 'any'.
 */
export type FilterScope = 'current' | 'past' | 'any'

export type FilterScopes = {
  employer?: FilterScope
  university?: FilterScope
  major?: FilterScope
}

const emptyFilters: SearchFilters = {
  q: undefined,
  city: undefined,
  employer: undefined,
  university: undefined,
  major: undefined,
  topic: undefined,
  gradYearMin: undefined,
  gradYearMax: undefined,
  openToMentor: undefined,
  peopleIKnow: undefined,
}

export function parseSearchParams(
  params: Record<string, string | string[] | undefined>,
): SearchFilters {
  const flat: Record<string, string | undefined> = {}
  for (const [k, v] of Object.entries(params)) {
    flat[k] = Array.isArray(v) ? v[0] : v
  }
  const result = searchFiltersSchema.safeParse(flat)
  return result.success ? result.data : emptyFilters
}
