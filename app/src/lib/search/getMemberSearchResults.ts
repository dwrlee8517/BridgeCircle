import 'server-only'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { parseSearchParams, type SearchFilters } from './schemas'
import { type SearchHit, searchAlumni } from './searchAlumni'
import { type NLSearchHit, searchAlumniNL } from './searchAlumniNL'

export type RawSearchParams = Record<string, string | string[] | undefined>

export type MemberSearchDefaults = {
  nl: string
  q: string
  city: string
  employer: string
  university: string
  major: string
  topic: string
  gradYearMin: string
  gradYearMax: string
  openToMentor: boolean
  peopleIKnow: boolean
}

export type MemberSearchResults = {
  params: RawSearchParams
  filters: SearchFilters
  defaults: MemberSearchDefaults
  nlQuery: string
  useNL: boolean
  nlError: string | null
  nlPoolSize: number
  nlHits: NLSearchHit[]
  structuredHits: SearchHit[]
  pagedNlHits: NLSearchHit[]
  pagedStructuredHits: SearchHit[]
  showNaturalLanguageResults: boolean
  hasActiveSearch: boolean
  filtersOpen: boolean
  resultCount: number
  openCount: number
  currentPage: number
  totalPages: number
  friendIds: Set<string>
  organizationName: string | null
}

export const MEMBER_SEARCH_PAGE_SIZE = 10

export async function getMemberSearchResults(
  params: RawSearchParams,
): Promise<MemberSearchResults | null> {
  const session = await requireSession()
  const supabase = await createClient()
  const filters = parseSearchParams(params)

  const rawNl = params.nl
  const nlQuery = (Array.isArray(rawNl) ? rawNl[0] : rawNl)?.trim() ?? ''
  const useNL = nlQuery.length > 0
  const requestedPage = Number.parseInt(singleParam(params.page) ?? '1', 10)

  const { data: viewerMembership } = await supabase
    .from('organization_memberships')
    .select('id, organization_id, organizations(name)')
    .eq('user_id', session.userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!viewerMembership) {
    return null
  }

  const [{ data: viewerBase }, { data: viewerOrgProfile }, friendsRes] = await Promise.all([
    supabase
      .from('base_profiles')
      .select('university, major, city')
      .eq('user_id', session.userId)
      .maybeSingle(),
    supabase
      .from('organization_profiles')
      .select('graduation_year')
      .eq('organization_membership_id', viewerMembership.id)
      .maybeSingle(),
    supabase
      .from('friendships')
      .select('user_a_id, user_b_id')
      .or(`user_a_id.eq.${session.userId},user_b_id.eq.${session.userId}`),
  ])

  const friendIds = new Set(
    (friendsRes.data ?? []).map((f) =>
      f.user_a_id === session.userId ? f.user_b_id : f.user_a_id,
    ),
  )

  let nlHits: NLSearchHit[] = []
  let structuredHits: SearchHit[] = []
  let nlPoolSize = 0
  let nlError: string | null = null

  if (useNL) {
    const result = await searchAlumniNL(supabase, {
      query: nlQuery,
      organizationId: viewerMembership.organization_id,
      viewerId: session.userId,
      viewerUniversity: viewerBase?.university ?? null,
      viewerMajor: viewerBase?.major ?? null,
      viewerCity: viewerBase?.city ?? null,
      viewerGraduationYear: viewerOrgProfile?.graduation_year ?? null,
      extraFilters: filters,
    })
    if (result.ok) {
      nlHits = result.hits
      nlPoolSize = result.poolSize
    } else {
      nlError =
        result.error === 'no_api_key'
          ? 'Natural-language search is not configured. Showing keyword results instead.'
          : `Could not understand the query (${result.detail ?? 'unknown error'}). Showing keyword results instead.`
      structuredHits = await searchAlumni(supabase, {
        organizationId: viewerMembership.organization_id,
        viewerId: session.userId,
        viewerUniversity: viewerBase?.university ?? null,
        viewerMajor: viewerBase?.major ?? null,
        viewerCity: viewerBase?.city ?? null,
        viewerGraduationYear: viewerOrgProfile?.graduation_year ?? null,
        filters: { ...filters, q: filters.q ?? nlQuery },
      })
    }
  } else {
    structuredHits = await searchAlumni(supabase, {
      organizationId: viewerMembership.organization_id,
      viewerId: session.userId,
      viewerUniversity: viewerBase?.university ?? null,
      viewerMajor: viewerBase?.major ?? null,
      viewerCity: viewerBase?.city ?? null,
      viewerGraduationYear: viewerOrgProfile?.graduation_year ?? null,
      filters,
    })
  }

  const anyFilter = !!(
    filters.q ||
    filters.city ||
    filters.employer ||
    filters.university ||
    filters.major ||
    filters.topic ||
    filters.gradYearMin ||
    filters.gradYearMax ||
    filters.openToMentor ||
    filters.peopleIKnow
  )
  const showNaturalLanguageResults = useNL && !nlError
  const hasActiveSearch = anyFilter || useNL
  const filtersOpen = anyFilter || (useNL && nlHits.length === 0)
  const resultCount = showNaturalLanguageResults ? nlHits.length : structuredHits.length
  const activeHits = showNaturalLanguageResults ? nlHits : structuredHits
  const openCount = activeHits.filter(
    (hit) => hit.isOpenAsMentor || hit.isOpenAsAdviceHelper,
  ).length
  const totalPages = Math.max(1, Math.ceil(resultCount / MEMBER_SEARCH_PAGE_SIZE))
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), totalPages)
    : 1
  const pageStart = (currentPage - 1) * MEMBER_SEARCH_PAGE_SIZE

  return {
    params,
    filters,
    defaults: {
      nl: nlQuery,
      q: filters.q ?? '',
      city: filters.city ?? '',
      employer: filters.employer ?? '',
      university: filters.university ?? '',
      major: filters.major ?? '',
      topic: filters.topic ?? '',
      gradYearMin: filters.gradYearMin?.toString() ?? '',
      gradYearMax: filters.gradYearMax?.toString() ?? '',
      openToMentor: !!filters.openToMentor,
      peopleIKnow: !!filters.peopleIKnow,
    },
    nlQuery,
    useNL,
    nlError,
    nlPoolSize,
    nlHits,
    structuredHits,
    pagedNlHits: nlHits.slice(pageStart, pageStart + MEMBER_SEARCH_PAGE_SIZE),
    pagedStructuredHits: structuredHits.slice(pageStart, pageStart + MEMBER_SEARCH_PAGE_SIZE),
    showNaturalLanguageResults,
    hasActiveSearch,
    filtersOpen,
    resultCount,
    openCount,
    currentPage,
    totalPages,
    friendIds,
    organizationName: (viewerMembership.organizations as { name: string } | null)?.name ?? null,
  }
}

export function memberSearchPageHref(
  basePath: '/ask' | '/people',
  params: RawSearchParams,
  page: number,
) {
  const next = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (key === 'page' || value === undefined) continue
    const values = Array.isArray(value) ? value : [value]
    for (const item of values) {
      if (item.trim().length > 0) next.append(key, item)
    }
  }
  if (page > 1) next.set('page', String(page))
  const search = next.toString()
  return search ? `${basePath}?${search}` : basePath
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
