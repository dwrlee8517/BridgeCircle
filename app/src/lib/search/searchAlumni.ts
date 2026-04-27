import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { SearchFilters } from './schemas'

export type CareerEntry = {
  employer: string
  title: string
  start_date: string | null
  end_date: string | null
  description: string | null
}

export type EducationEntry = {
  school: string
  degree: string | null
  field: string | null
  start_date: string | null
  end_date: string | null
}

export type SearchHit = {
  userId: string
  name: string | null
  headline: string | null
  currentEmployer: string | null
  currentTitle: string | null
  city: string | null
  university: string | null
  major: string | null
  graduationYear: number | null
  avatarUrl: string | null
  isOpenAsMentor: boolean
  mentorPaused: boolean
  mentoringTopics: string[] | null
  // Rich fields populated for the NL rerank step. The structured-search UI
  // doesn't display them but the NL orchestrator passes them to Haiku.
  bio: string | null
  careerHistory: CareerEntry[] | null
  educationHistory: EducationEntry[] | null
  skills: string[] | null
  reason: string
  score: number
}

export type SearchInput = {
  organizationId: string
  viewerId: string
  viewerUniversity: string | null
  viewerMajor: string | null
  viewerCity: string | null
  viewerGraduationYear: number | null
  filters: SearchFilters
  limit?: number
}

/**
 * Search + rank alumni in a given org.
 *
 * Per phase-1-launch-spec.md:39 ranking spec:
 *   open-to-mentor boost > same university > same major > same city >
 *   grad-year proximity > string match on role/industry.
 *
 * Sub-1000 alumni at launch — fine to rank in JS rather than SQL.
 *
 * Strategy:
 *   1. List active memberships in the org (excluding viewer)
 *   2. Bulk-fetch base_profiles + organization_profiles + mentorship_preferences
 *   3. Stitch in memory, apply filters, score, sort
 *
 * RLS automatically filters what each query can see — caller's session ⇒
 * only org-mate data flows back.
 */
export async function searchAlumni(
  supabase: SupabaseClient<Database>,
  input: SearchInput,
): Promise<SearchHit[]> {
  const limit = input.limit ?? 50

  const { data: memberships, error: mErr } = await supabase
    .from('organization_memberships')
    .select('id, user_id')
    .eq('organization_id', input.organizationId)
    .eq('status', 'active')
    .neq('user_id', input.viewerId)
    .limit(500)

  if (mErr) throw new Error(`searchAlumni memberships: ${mErr.message}`)
  if (!memberships || memberships.length === 0) return []

  const userIds = memberships.map((m) => m.user_id)
  const membershipIds = memberships.map((m) => m.id)
  const membershipByUser = new Map(memberships.map((m) => [m.user_id, m.id]))

  const [baseRes, orgProfileRes, prefRes] = await Promise.all([
    supabase
      .from('base_profiles')
      .select(
        'user_id, name, headline, current_employer, current_title, city, university, major, avatar_url, career_history, education_history, skills',
      )
      .in('user_id', userIds),
    supabase
      .from('organization_profiles')
      .select('organization_membership_id, graduation_year, mentoring_topics, bio')
      .in('organization_membership_id', membershipIds),
    supabase
      .from('mentorship_preferences')
      .select('organization_membership_id, is_open, paused_at')
      .in('organization_membership_id', membershipIds),
  ])

  if (baseRes.error) throw new Error(`searchAlumni base_profiles: ${baseRes.error.message}`)
  if (orgProfileRes.error)
    throw new Error(`searchAlumni org_profiles: ${orgProfileRes.error.message}`)
  if (prefRes.error)
    throw new Error(`searchAlumni mentorship_preferences: ${prefRes.error.message}`)

  const orgProfileByMembership = new Map(
    (orgProfileRes.data ?? []).map((p) => [p.organization_membership_id, p]),
  )
  const prefByMembership = new Map(
    (prefRes.data ?? []).map((p) => [p.organization_membership_id, p]),
  )

  const f = input.filters
  const hits: SearchHit[] = []

  for (const base of baseRes.data ?? []) {
    if (!base.name) continue
    const membershipId = membershipByUser.get(base.user_id)
    if (!membershipId) continue
    const op = orgProfileByMembership.get(membershipId)
    const pref = prefByMembership.get(membershipId)
    const isOpenAsMentor = !!pref?.is_open && !pref.paused_at

    if (f.openToMentor && !isOpenAsMentor) continue
    if (f.gradYearMin && (op?.graduation_year ?? -Infinity) < f.gradYearMin) continue
    if (f.gradYearMax && (op?.graduation_year ?? Infinity) > f.gradYearMax) continue
    if (f.city && !ci(base.city).includes(ci(f.city))) continue
    if (f.employer && !ci(base.current_employer).includes(ci(f.employer))) continue
    if (f.university && !ci(base.university).includes(ci(f.university))) continue
    if (f.major && !ci(base.major).includes(ci(f.major))) continue
    if (f.topic) {
      const topics = (op?.mentoring_topics ?? []).map((t) => t.toLowerCase())
      if (!topics.some((t) => t.includes(ci(f.topic ?? '')))) continue
    }
    if (f.q) {
      const haystack = [
        base.name,
        base.headline,
        base.current_employer,
        base.current_title,
        base.city,
        base.university,
        base.major,
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(ci(f.q))) continue
    }

    let score = 0
    const reasons: string[] = []

    if (isOpenAsMentor) {
      score += 100
      reasons.push('open to mentor')
    }
    if (input.viewerUniversity && ci(base.university) === ci(input.viewerUniversity)) {
      score += 50
      reasons.push(`same university (${base.university})`)
    }
    if (input.viewerMajor && ci(base.major) === ci(input.viewerMajor)) {
      score += 30
      reasons.push(`same major (${base.major})`)
    }
    if (input.viewerCity && ci(base.city) === ci(input.viewerCity)) {
      score += 20
      reasons.push(`same city (${base.city})`)
    }
    if (input.viewerGraduationYear && op?.graduation_year) {
      const diff = Math.abs(op.graduation_year - input.viewerGraduationYear)
      const proximity = Math.max(0, 15 - diff)
      score += proximity
      if (diff <= 2) reasons.push('similar grad year')
    }

    hits.push({
      userId: base.user_id,
      name: base.name,
      headline: base.headline,
      currentEmployer: base.current_employer,
      currentTitle: base.current_title,
      city: base.city,
      university: base.university,
      major: base.major,
      graduationYear: op?.graduation_year ?? null,
      avatarUrl: base.avatar_url,
      isOpenAsMentor,
      mentorPaused: !!pref?.paused_at,
      mentoringTopics: op?.mentoring_topics ?? null,
      bio: op?.bio ?? null,
      careerHistory: (base.career_history as CareerEntry[] | null) ?? null,
      educationHistory: (base.education_history as EducationEntry[] | null) ?? null,
      skills: base.skills ?? null,
      reason: reasons.slice(0, 2).join(' · ') || 'in your network',
      score,
    })
  }

  hits.sort((a, b) => b.score - a.score)
  return hits.slice(0, limit)
}

function ci(s: string | null | undefined): string {
  return (s ?? '').toLowerCase()
}
