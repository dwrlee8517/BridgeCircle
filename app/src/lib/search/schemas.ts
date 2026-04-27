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

export const searchFiltersSchema = z.object({
  q: optStr,
  city: optStr,
  employer: optStr,
  university: optStr,
  major: optStr,
  topic: optStr,
  gradYearMin: optYear,
  gradYearMax: optYear,
  openToMentor: z
    .union([z.literal('on'), z.literal('true'), z.literal('1')])
    .optional()
    .transform((v) => (v ? true : undefined)),
})

export type SearchFilters = z.infer<typeof searchFiltersSchema>

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
