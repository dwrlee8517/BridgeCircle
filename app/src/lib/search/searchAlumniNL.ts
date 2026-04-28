import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { type ExtractedFilters, extractSearchFilters } from './extractFilters'
import { type RerankCandidate, rerankCandidates } from './rerankCandidates'
import type { FilterScope, FilterScopes, SearchFilters } from './schemas'
import { type SearchHit, searchAlumni } from './searchAlumni'

/**
 * Cap the rerank pool to keep token cost bounded. ~30 candidates × ~150
 * tokens each + system prompt is ~5K input ≈ $0.005 per call.
 */
const RERANK_POOL_LIMIT = 30
const RESULT_LIMIT = 10

export type NLSearchHit = SearchHit & {
  rationale: string | null
  rerankScore: number | null
}

export type NLSearchResult =
  | {
      ok: true
      query: string
      filters: ExtractedFilters
      hits: NLSearchHit[]
      // Diagnostic — surfaced in the UI so the user understands what we did
      // and so we can spot bad extractions.
      poolSize: number
      llmFallback: 'rerank_failed' | 'no_pool' | null
    }
  | {
      ok: false
      error: 'extract_failed' | 'no_api_key'
      detail?: string
    }

export type NLSearchInput = {
  query: string
  organizationId: string
  viewerId: string
  viewerUniversity: string | null
  viewerMajor: string | null
  viewerCity: string | null
  viewerGraduationYear: number | null
  // Extra structured filters the user added in the form (combined with
  // anything the LLM extracts from the query — explicit user input wins).
  extraFilters?: SearchFilters
}

/**
 * Two-step NL search:
 *   1. Haiku extracts filters + a thematic intent string from the free-text
 *      query.
 *   2. Postgres narrows by scalar filters (existing searchAlumni — JS-side
 *      filter + score is fine at sub-1000 alumni).
 *   3. Top RERANK_POOL_LIMIT by structured score get fed to a second Haiku
 *      call that ranks them against the original query, reading career
 *      history JSONB / skills / bio for thematic match.
 *
 * Architectural note: we deliberately do NOT query career_history JSONB in
 * SQL. The LLM rerank handles thematic matching. This is the "filter on
 * scalars, rerank on JSONB" decision from the Day 9/10 plan.
 */
export async function searchAlumniNL(
  supabase: SupabaseClient<Database>,
  input: NLSearchInput,
): Promise<NLSearchResult> {
  const extracted = await extractSearchFilters(input.query)
  if (!extracted.ok) {
    if (extracted.error === 'no_api_key') {
      return { ok: false, error: 'no_api_key' }
    }
    return { ok: false, error: 'extract_failed', detail: extracted.detail }
  }

  const llmFilters = extracted.filters
  const userExtra: Partial<SearchFilters> = input.extraFilters ?? {}

  // Merge: user-supplied filter wins over LLM-extracted filter on the same
  // field. Empty/undefined defers to LLM.
  const mergedFilters: SearchFilters = {
    q: undefined, // q is the manual-search free-text field; suppressed in NL mode.
    city: userExtra.city ?? llmFilters.city ?? undefined,
    employer: userExtra.employer ?? llmFilters.employer ?? undefined,
    university: userExtra.university ?? llmFilters.university ?? undefined,
    major: userExtra.major ?? llmFilters.major ?? undefined,
    topic: userExtra.topic,
    gradYearMin: userExtra.gradYearMin ?? llmFilters.gradYearMin ?? undefined,
    gradYearMax: userExtra.gradYearMax ?? llmFilters.gradYearMax ?? undefined,
    openToMentor: userExtra.openToMentor ?? (llmFilters.mentorOpen === true ? true : undefined),
  }

  // Per-field scope (current vs past vs any). Only applies when the
  // matching filter is non-null; null/'any' from the LLM falls through
  // to the default behavior in searchAlumni.
  const scopes: FilterScopes = {
    employer: normalizeScope(llmFilters.employerScope),
    university: normalizeScope(llmFilters.universityScope),
    major: normalizeScope(llmFilters.majorScope),
  }

  const pool = await searchAlumni(supabase, {
    organizationId: input.organizationId,
    viewerId: input.viewerId,
    viewerUniversity: input.viewerUniversity,
    viewerMajor: input.viewerMajor,
    viewerCity: input.viewerCity,
    viewerGraduationYear: input.viewerGraduationYear,
    filters: mergedFilters,
    scopes,
    limit: RERANK_POOL_LIMIT,
  })

  if (pool.length === 0) {
    return {
      ok: true,
      query: input.query,
      filters: llmFilters,
      hits: [],
      poolSize: 0,
      llmFallback: 'no_pool',
    }
  }

  // If the LLM extracted a country, append it to the theme so the reranker
  // weighs geography. We don't have a country column, so this is enforced as
  // a thematic constraint, not a hard filter — the rerank prompt handles it.
  let themeForRerank = llmFilters.theme
  if (llmFilters.country) {
    themeForRerank = themeForRerank
      ? `${themeForRerank} (located in ${llmFilters.country})`
      : `located in ${llmFilters.country}`
  }

  const candidates: RerankCandidate[] = pool.map((h) => ({
    id: h.userId,
    name: h.name ?? '',
    headline: h.headline,
    currentEmployer: h.currentEmployer,
    currentTitle: h.currentTitle,
    city: h.city,
    university: h.university,
    major: h.major,
    graduationYear: h.graduationYear,
    bio: h.bio,
    mentoringTopics: h.mentoringTopics,
    careerHistory: h.careerHistory,
    educationHistory: h.educationHistory,
    skills: h.skills,
  }))

  const reranked = await rerankCandidates({
    query: input.query,
    theme: themeForRerank,
    candidates,
    limit: RESULT_LIMIT,
  })

  if (!reranked.ok) {
    // Soft failure: fall back to structured order so the user still sees
    // results. The UI surfaces `llmFallback` so we can flag this.
    return {
      ok: true,
      query: input.query,
      filters: llmFilters,
      hits: pool.slice(0, RESULT_LIMIT).map((h) => ({
        ...h,
        rationale: null,
        rerankScore: null,
      })),
      poolSize: pool.length,
      llmFallback: 'rerank_failed',
    }
  }

  const hitById = new Map(pool.map((h) => [h.userId, h]))
  const hits: NLSearchHit[] = []
  for (const r of reranked.rankings) {
    const h = hitById.get(r.id)
    if (!h) continue
    hits.push({ ...h, rationale: r.rationale, rerankScore: r.score })
  }

  return {
    ok: true,
    query: input.query,
    filters: llmFilters,
    hits,
    poolSize: pool.length,
    llmFallback: null,
  }
}

function normalizeScope(scope: 'current' | 'past' | 'any' | null): FilterScope {
  return scope ?? 'any'
}
