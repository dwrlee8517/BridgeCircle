import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { canSeeSection, deriveViewerKind, parseStoredPrivacySettings } from '@/lib/profile/privacy'
import type { FilterScopes, SearchFilters } from './schemas'

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
  preferredName: string | null
  nameOther: string | null
  headline: string | null
  currentEmployer: string | null
  currentTitle: string | null
  city: string | null
  university: string | null
  major: string | null
  graduationYear: number | null
  avatarUrl: string | null
  isOpenAsMentor: boolean
  isOpenAsAdviceHelper: boolean
  mentorPaused: boolean
  mentoringTopics: string[] | null
  maxActiveMentees: number
  maxPendingRequests: number
  activeMenteeCount: number
  pendingRequestCount: number
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
  // Optional per-field scope. Defaults to 'any' (current OR past). Set by
  // the NL extraction step to honor "currently at X" vs "former X" intent.
  scopes?: FilterScopes
  limit?: number
}

/**
 * Search + rank alumni in a given org.
 *
 * Per product-spec-obsidian-vault/Production/phase-1/launch-cut.md ranking spec:
 *   open-to-mentor boost > same university > same major > same city >
 *   grad-year proximity > string match on role/industry.
 *
 * Sub-1000 alumni at launch — fine to rank in JS rather than SQL.
 *
 * Strategy:
 *   1. List active memberships in the org (excluding viewer)
 *   2. Bulk-fetch base_profiles + organization_profiles + helper_preferences
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

  const [baseRes, orgProfileRes, prefRes, friendsRes, pendingAsksRes, activeThreadsRes] =
    await Promise.all([
      supabase
        .from('base_profiles')
        .select(
          'user_id, name, preferred_name, name_other, headline, current_employer, current_title, city, university, major, avatar_url, career_history, education_history, skills, privacy_settings',
        )
        .in('user_id', userIds),
      supabase
        .from('organization_profiles')
        .select('organization_membership_id, graduation_year, mentoring_topics, bio')
        .in('organization_membership_id', membershipIds),
      supabase
        .from('helper_preferences')
        .select(
          'organization_membership_id, open_to_mentorship, open_to_advice, paused_at, max_active_mentees, max_pending_requests',
        )
        .in('organization_membership_id', membershipIds),
      // Pull viewer's friend list once so we can compute the per-candidate
      // visibility tier in JS without N extra queries.
      supabase
        .from('friendships')
        .select('user_a_id, user_b_id')
        .or(`user_a_id.eq.${input.viewerId},user_b_id.eq.${input.viewerId}`),
      // Bulk-fetch pending asks for capacity indicator
      supabase
        .from('asks')
        .select('helper_id')
        .eq('ask_type', 'mentorship')
        .eq('status', 'pending')
        .in('helper_id', userIds),
      // Bulk-fetch active threads for capacity indicator
      supabase
        .from('ask_threads')
        .select('helper_id, asks!inner(ask_type)')
        .eq('status', 'active')
        .eq('asks.ask_type', 'mentorship')
        .in('helper_id', userIds),
    ])

  if (baseRes.error) throw new Error(`searchAlumni base_profiles: ${baseRes.error.message}`)
  if (orgProfileRes.error)
    throw new Error(`searchAlumni org_profiles: ${orgProfileRes.error.message}`)
  if (prefRes.error) throw new Error(`searchAlumni helper_preferences: ${prefRes.error.message}`)
  if (friendsRes.error) throw new Error(`searchAlumni friendships: ${friendsRes.error.message}`)
  if (pendingAsksRes.error)
    throw new Error(`searchAlumni pending asks: ${pendingAsksRes.error.message}`)
  if (activeThreadsRes.error)
    throw new Error(`searchAlumni active threads: ${activeThreadsRes.error.message}`)

  const orgProfileByMembership = new Map(
    (orgProfileRes.data ?? []).map((p) => [p.organization_membership_id, p]),
  )
  const prefByMembership = new Map(
    (prefRes.data ?? []).map((p) => [p.organization_membership_id, p]),
  )
  const pendingCountByHelper = new Map<string, number>()
  for (const ask of pendingAsksRes.data ?? []) {
    pendingCountByHelper.set(ask.helper_id, (pendingCountByHelper.get(ask.helper_id) ?? 0) + 1)
  }
  const activeCountByHelper = new Map<string, number>()
  for (const t of activeThreadsRes.data ?? []) {
    const helperId = t.helper_id
    if (helperId) {
      activeCountByHelper.set(helperId, (activeCountByHelper.get(helperId) ?? 0) + 1)
    }
  }
  const friendIds = new Set(
    (friendsRes.data ?? []).map((f) =>
      f.user_a_id === input.viewerId ? f.user_b_id : f.user_a_id,
    ),
  )

  const f = input.filters
  const hits: SearchHit[] = []

  for (const base of baseRes.data ?? []) {
    if (!base.name) continue
    const membershipId = membershipByUser.get(base.user_id)
    if (!membershipId) continue
    const op = orgProfileByMembership.get(membershipId)
    const pref = prefByMembership.get(membershipId)
    const isOpenAsMentor = !!pref?.open_to_mentorship && !pref.paused_at
    const isOpenAsAdviceHelper = !!pref?.open_to_advice && !pref.paused_at

    // Career and education history may match the filter via past entries
    // even when the directory field doesn't. We use the *raw* JSONB here
    // (pre-privacy-redaction) because filter inclusion only reveals that
    // the person is a relevant match — their name and current role are
    // already always-org-visible. The privacy redaction below blocks the
    // private *details* (dates, descriptions, past employer names beyond
    // the matched one) from being shown or fed to the LLM rerank.
    const rawCareer = (base.career_history as CareerEntry[] | null) ?? []
    const rawEducation = (base.education_history as EducationEntry[] | null) ?? []

    // "Open to help" filter (ADR 0011 Phase 2): either legacy flag counts
    // until the Phase 6 column collapse.
    if (f.openToMentor && !(isOpenAsMentor || isOpenAsAdviceHelper)) continue
    if (f.peopleIKnow && !friendIds.has(base.user_id)) continue
    if (f.gradYearMin && (op?.graduation_year ?? -Infinity) < f.gradYearMin) continue
    if (f.gradYearMax && (op?.graduation_year ?? Infinity) > f.gradYearMax) continue
    if (f.city && !ci(base.city).includes(ci(f.city))) continue
    if (f.employer) {
      const target = ci(f.employer)
      const scope = input.scopes?.employer ?? 'any'
      const matchesCurrent = ci(base.current_employer).includes(target)
      const matchesPast = rawCareer.some((c) => ci(c.employer).includes(target))
      if (!scopeMatch(scope, matchesCurrent, matchesPast)) continue
    }
    if (f.university) {
      const target = ci(f.university)
      const scope = input.scopes?.university ?? 'any'
      const matchesCurrent = ci(base.university).includes(target)
      const matchesPast = rawEducation.some((e) => ci(e.school).includes(target))
      if (!scopeMatch(scope, matchesCurrent, matchesPast)) continue
    }
    if (f.major) {
      const target = ci(f.major)
      const scope = input.scopes?.major ?? 'any'
      const matchesCurrent = ci(base.major).includes(target)
      const matchesPast = rawEducation.some((e) => ci(e.field).includes(target))
      if (!scopeMatch(scope, matchesCurrent, matchesPast)) continue
    }
    if (f.topic) {
      const topics = (op?.mentoring_topics ?? []).map((t) => t.toLowerCase())
      if (!topics.some((t) => t.includes(ci(f.topic ?? '')))) continue
    }
    if (f.q) {
      // Name search needs to find members under any name they go by:
      // canonical (legal) name, preferred display name, and any
      // also-known-as / multi-language name. Important for the Chadwick
      // US ↔ Chadwick International overlap.
      const haystack = [
        base.name,
        base.preferred_name,
        base.name_other,
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

    // Privacy redaction. Directory fields stay visible; configurable
    // sections (career_history, education_history, skills, bio, mentoring
    // topics) get redacted to null when the viewer's relationship to this
    // candidate is below the candidate's tier. Day 10 NL rerank reads
    // these fields and shouldn't see private content for non-friends.
    const candidatePrivacy = parseStoredPrivacySettings(base.privacy_settings)
    const viewerKind = deriveViewerKind(false, friendIds.has(base.user_id))
    const showCareer = canSeeSection(candidatePrivacy, 'career_history', viewerKind)
    const showEducation = canSeeSection(candidatePrivacy, 'education_history', viewerKind)
    const showBio = canSeeSection(candidatePrivacy, 'bio', viewerKind)
    const showSkills = canSeeSection(candidatePrivacy, 'skills', viewerKind)

    hits.push({
      userId: base.user_id,
      name: base.name,
      preferredName: base.preferred_name,
      nameOther: base.name_other,
      headline: base.headline,
      currentEmployer: base.current_employer,
      currentTitle: base.current_title,
      city: base.city,
      university: base.university,
      major: base.major,
      graduationYear: op?.graduation_year ?? null,
      avatarUrl: base.avatar_url,
      isOpenAsMentor,
      isOpenAsAdviceHelper,
      mentorPaused: !!pref?.paused_at,
      mentoringTopics: showBio ? (op?.mentoring_topics ?? null) : null,
      bio: showBio ? (op?.bio ?? null) : null,
      careerHistory: showCareer ? (rawCareer.length > 0 ? rawCareer : null) : null,
      educationHistory: showEducation ? (rawEducation.length > 0 ? rawEducation : null) : null,
      skills: showSkills ? (base.skills ?? null) : null,
      maxActiveMentees: pref?.max_active_mentees ?? 5,
      maxPendingRequests: pref?.max_pending_requests ?? 10,
      activeMenteeCount: activeCountByHelper.get(base.user_id) ?? 0,
      pendingRequestCount: pendingCountByHelper.get(base.user_id) ?? 0,
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

function scopeMatch(
  scope: 'current' | 'past' | 'any',
  matchesCurrent: boolean,
  matchesPast: boolean,
): boolean {
  if (scope === 'current') return matchesCurrent
  if (scope === 'past') return matchesPast
  return matchesCurrent || matchesPast
}
