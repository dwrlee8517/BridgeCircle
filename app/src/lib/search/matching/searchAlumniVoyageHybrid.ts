import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/db/admin'
import type { Database } from '@/db/database.types'
import { type ExtractedFilters, extractSearchFiltersCached } from '../extractFilters'
import type { FilterScope, FilterScopes, SearchFilters } from '../schemas'
import { searchAlumni } from '../searchAlumni'
import type { NLSearchHit, NLSearchInput, NLSearchResult } from '../searchAlumniNL'
import { explainMatches } from './explanations'
import { applyRerankScores, mergeHybridCandidates } from './hybridMerge'
import { rerankHybridCandidates } from './rerank'
import { retrieveVectorMatches } from './vectorRetrieval'

const RERANK_POOL_LIMIT = 40
const RESULT_LIMIT = 10
const VECTOR_LIMIT = 80
const HYDRATE_LIMIT = 500

const emptyExtractedFilters: ExtractedFilters = {
  mentorOpen: null,
  city: null,
  country: null,
  university: null,
  universityScope: null,
  major: null,
  majorScope: null,
  employer: null,
  employerScope: null,
  gradYearMin: null,
  gradYearMax: null,
  theme: null,
}

export async function searchAlumniVoyageHybrid(
  supabase: SupabaseClient<Database>,
  input: NLSearchInput,
): Promise<NLSearchResult> {
  const startedAt = Date.now()
  const extraction = await extractSearchFiltersCached(input.query)
  const filters = extraction.ok ? extraction.filters : emptyExtractedFilters
  const extraFilters = input.extraFilters ?? {}
  const mergedFilters = mergeFilters(filters, extraFilters)
  const scopes = filterScopes(filters)

  const [structuredHits, lexicalHits, allHydratedHits, friendIds] = await Promise.all([
    searchAlumni(supabase, {
      organizationId: input.organizationId,
      viewerId: input.viewerId,
      viewerUniversity: input.viewerUniversity,
      viewerMajor: input.viewerMajor,
      viewerCity: input.viewerCity,
      viewerGraduationYear: input.viewerGraduationYear,
      filters: mergedFilters,
      scopes,
      limit: RERANK_POOL_LIMIT,
    }),
    searchAlumni(supabase, {
      organizationId: input.organizationId,
      viewerId: input.viewerId,
      viewerUniversity: input.viewerUniversity,
      viewerMajor: input.viewerMajor,
      viewerCity: input.viewerCity,
      viewerGraduationYear: input.viewerGraduationYear,
      filters: { ...emptySearchFilters(), ...extraFilters, q: input.query },
      limit: RERANK_POOL_LIMIT,
    }),
    searchAlumni(supabase, {
      organizationId: input.organizationId,
      viewerId: input.viewerId,
      viewerUniversity: input.viewerUniversity,
      viewerMajor: input.viewerMajor,
      viewerCity: input.viewerCity,
      viewerGraduationYear: input.viewerGraduationYear,
      filters: emptySearchFilters(),
      limit: HYDRATE_LIMIT,
    }),
    getFriendIds(supabase, input.viewerId),
  ])

  let vectorHits: Awaited<ReturnType<typeof retrieveVectorMatches>> = {
    ok: true,
    hits: [],
  }

  try {
    const admin = createAdminClient()
    vectorHits = await retrieveVectorMatches(admin, {
      query: input.query,
      organizationId: input.organizationId,
      viewerId: input.viewerId,
      friendIds,
      limit: VECTOR_LIMIT,
    })
  } catch (err) {
    vectorHits = {
      ok: false,
      error: 'rpc_failed',
      detail: err instanceof Error ? err.message : String(err),
    }
  }

  if (!vectorHits.ok && structuredHits.length === 0 && lexicalHits.length === 0) {
    console.info('[ask-matching] voyage_hybrid fallback: no vector and no scalar pool', {
      fallbackReason: vectorHits.error,
      detail: vectorHits.detail,
    })
    return {
      ok: true,
      query: input.query,
      filters,
      hits: [],
      poolSize: 0,
      llmFallback: 'no_pool',
    }
  }

  const candidates = mergeHybridCandidates({
    structuredHits,
    lexicalHits,
    allHydratedHits,
    vectorEvidence: vectorHits.ok ? vectorHits.hits : [],
  })

  const reranked = await rerankHybridCandidates({
    query: input.query,
    candidates: candidates.slice(0, RERANK_POOL_LIMIT),
    limit: RERANK_POOL_LIMIT,
  })

  const finalCandidates = reranked.ok
    ? applyRerankScores(candidates, reranked.scores)
    : candidates.sort((a, b) => b.preRerankScore - a.preRerankScore)

  const top = finalCandidates.slice(0, RESULT_LIMIT)
  const explanations = await explainMatches(
    input.query,
    top.map((candidate) => ({
      query: input.query,
      hit: candidate.hit,
      evidence: candidate.rawEvidence,
    })),
  )
  const explanationById = new Map(explanations.map((e) => [e.userId, e.rationale]))

  const hits: NLSearchHit[] = top.map((candidate) => ({
    ...candidate.hit,
    rationale: explanationById.get(candidate.hit.userId) ?? candidate.hit.reason,
    rerankScore:
      candidate.rerankScore == null
        ? Math.round(candidate.preRerankScore * 100)
        : Math.round(candidate.rerankScore * 100),
  }))

  console.info('[ask-matching] voyage_hybrid result', {
    structuredCount: structuredHits.length,
    lexicalCount: lexicalHits.length,
    vectorCount: vectorHits.ok ? vectorHits.hits.length : 0,
    vectorFallback: vectorHits.ok ? null : vectorHits.error,
    rerankFallback: reranked.ok ? null : reranked.detail,
    finalCount: hits.length,
    latencyMs: Date.now() - startedAt,
  })

  return {
    ok: true,
    query: input.query,
    filters,
    hits,
    poolSize: candidates.length,
    llmFallback: reranked.ok ? null : 'rerank_failed',
  }
}

function mergeFilters(
  llmFilters: ExtractedFilters,
  userExtra: Partial<SearchFilters>,
): SearchFilters {
  return {
    q: undefined,
    city: userExtra.city ?? llmFilters.city ?? undefined,
    employer: userExtra.employer ?? llmFilters.employer ?? undefined,
    university: userExtra.university ?? llmFilters.university ?? undefined,
    major: userExtra.major ?? llmFilters.major ?? undefined,
    topic: userExtra.topic,
    gradYearMin: userExtra.gradYearMin ?? llmFilters.gradYearMin ?? undefined,
    gradYearMax: userExtra.gradYearMax ?? llmFilters.gradYearMax ?? undefined,
    openToMentor: userExtra.openToMentor ?? (llmFilters.mentorOpen === true ? true : undefined),
    peopleIKnow: userExtra.peopleIKnow,
  }
}

function emptySearchFilters(): SearchFilters {
  return {
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
}

function filterScopes(filters: ExtractedFilters): FilterScopes {
  return {
    employer: normalizeScope(filters.employerScope),
    university: normalizeScope(filters.universityScope),
    major: normalizeScope(filters.majorScope),
  }
}

function normalizeScope(scope: 'current' | 'past' | 'any' | null): FilterScope {
  return scope ?? 'any'
}

async function getFriendIds(supabase: SupabaseClient<Database>, viewerId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .select('user_a_id, user_b_id')
    .or(`user_a_id.eq.${viewerId},user_b_id.eq.${viewerId}`)
  if (error) throw new Error(`voyage hybrid friendships: ${error.message}`)
  return (data ?? []).map((f) => (f.user_a_id === viewerId ? f.user_b_id : f.user_a_id))
}
