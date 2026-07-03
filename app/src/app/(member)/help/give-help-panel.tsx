import { createClient } from '@/db/server'
import { getHelperPreference } from '@/lib/asks/preferences'
import { requireSession } from '@/lib/auth/session'
import { type HelpAvailability, HelpClient, type HelpPick, type HelpSubject } from './help-client'

const SUBJECT_COLORS = ['var(--primary)', 'var(--action-offer)', 'var(--accent-plum)'] as const
const DEFAULT_SUBJECTS = ['Career transitions', 'Quick questions', 'Ongoing help']

type ProfileSummary = {
  name: string | null
  preferredName: string | null
  avatarUrl: string | null
  currentTitle: string | null
  currentEmployer: string | null
  city: string | null
  university: string | null
  graduationYear: number | null
}

/**
 * The give-help queue — the supply side of the Help hub (formerly the /help
 * page body). Rendered by the home hub when the mode toggle is on "Give help".
 */
export async function GiveHelpPanel() {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select(
      'id, organization_id, organizations!organization_memberships_organization_id_fkey(name)',
    )
    .eq('user_id', session.userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!membership) return null

  const [prefs, incomingRes, recentJoinersRes] = await Promise.all([
    getHelperPreference(supabase, session.userId),
    supabase
      .from('asks')
      .select('id, asker_id, ask_type, reason, help_needed, created_at')
      .eq('helper_id', session.userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(8),
    supabase
      .from('organization_memberships')
      .select('user_id, joined_at, organization_profiles(graduation_year)')
      .eq('organization_id', membership.organization_id)
      .eq('status', 'active')
      .neq('user_id', session.userId)
      .order('joined_at', { ascending: false })
      .limit(6),
  ])

  const incoming = incomingRes.data ?? []
  const recentJoiners = recentJoinersRes.data ?? []
  const askUserIds = incoming.map((ask) => ask.asker_id)
  const joinerUserIds = recentJoiners.map((member) => member.user_id)
  const userIds = [...new Set([...askUserIds, ...joinerUserIds])]

  const profileMap = new Map<string, ProfileSummary>()

  if (userIds.length > 0) {
    const [{ data: profiles }, { data: orgRows }] = await Promise.all([
      supabase
        .from('base_profiles')
        .select(
          'user_id, name, preferred_name, avatar_url, current_title, current_employer, city, university',
        )
        .in('user_id', userIds),
      supabase
        .from('organization_memberships')
        .select('user_id, organization_profiles(graduation_year)')
        .eq('organization_id', membership.organization_id)
        .in('user_id', userIds),
    ])

    const graduationYearMap = new Map<string, number | null>()
    for (const row of orgRows ?? []) {
      graduationYearMap.set(row.user_id, graduationYearFrom(row.organization_profiles))
    }

    for (const profile of profiles ?? []) {
      profileMap.set(profile.user_id, {
        name: profile.name,
        preferredName: profile.preferred_name,
        avatarUrl: profile.avatar_url,
        currentTitle: profile.current_title,
        currentEmployer: profile.current_employer,
        city: profile.city,
        university: profile.university,
        graduationYear: graduationYearMap.get(profile.user_id) ?? null,
      })
    }
  }

  for (const member of recentJoiners) {
    const profile = profileMap.get(member.user_id)
    if (profile?.graduationYear) continue
    const graduationYear = graduationYearFrom(member.organization_profiles)
    profileMap.set(member.user_id, {
      name: profile?.name ?? null,
      preferredName: profile?.preferredName ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      currentTitle: profile?.currentTitle ?? null,
      currentEmployer: profile?.currentEmployer ?? null,
      city: profile?.city ?? null,
      university: profile?.university ?? null,
      graduationYear,
    })
  }

  const topicLabels = normalizeTopics(prefs?.topics ?? [])
  const subjectLabels = topicLabels.length > 0 ? topicLabels : DEFAULT_SUBJECTS

  const incomingPicks: HelpPick[] = incoming.map((ask, index) => {
    const profile = profileMap.get(ask.asker_id)
    const subject = subjectLabels[index % subjectLabels.length] ?? DEFAULT_SUBJECTS[0]
    const color = SUBJECT_COLORS[index % SUBJECT_COLORS.length]
    const name = profileName(profile, 'Someone in your circle')
    // Only the member's own words render as a quote downstream; the fallback
    // is coordinator voice, never fabricated speech.
    const realNeed = ask.reason ?? ask.help_needed
    const need = realNeed ?? "They're looking for a practical reply from someone nearby."

    return {
      id: ask.id,
      personId: ask.asker_id,
      name,
      avatarUrl: profile?.avatarUrl ?? null,
      cohort: cohort(profile?.graduationYear ?? null),
      role: profileRole(profile),
      city: profile?.city ?? null,
      subject,
      subjectId: slug(subject),
      subjectColor: color,
      isRealAsk: Boolean(realNeed),
      need,
      why: [
        `${subject} is on your help list`,
        profile?.currentTitle
          ? `Your background can help with a ${profile.currentTitle.toLowerCase()} path`
          : 'They are asking inside your trusted school circle',
        'No one has replied yet',
      ],
      posted: shortRelativeTime(ask.created_at),
      estReply: '~5 min',
      href: `/ask/${ask.id}`,
    }
  })

  const recentPicks: HelpPick[] = recentJoiners.slice(0, 6).map((member, index) => {
    const profile = profileMap.get(member.user_id)
    const subject =
      subjectLabels[(incoming.length + index) % subjectLabels.length] ?? DEFAULT_SUBJECTS[0]
    const color = SUBJECT_COLORS[(incoming.length + index) % SUBJECT_COLORS.length]
    const name = profileName(profile, 'New member')
    const role = profileRole(profile)

    return {
      id: `joiner-${member.user_id}`,
      personId: member.user_id,
      name,
      avatarUrl: profile?.avatarUrl ?? null,
      cohort: cohort(profile?.graduationYear ?? null),
      role,
      city: profile?.city ?? null,
      subject,
      subjectId: slug(subject),
      subjectColor: color,
      isRealAsk: false,
      need: buildJoinerNeed(profile),
      why: [
        buildJoinerWhy(profile, subject),
        'They joined recently and have not built many ties yet',
      ],
      posted: shortRelativeTime(member.joined_at ?? new Date().toISOString()),
      estReply: '~6 min',
      href: `/profile/${member.user_id}`,
    }
  })

  const picks = [...incomingPicks, ...recentPicks]
  const subjects = buildSubjects(subjectLabels, picks, incoming.length)
  const availability: HelpAvailability = {
    openToHelp: prefs?.openToHelp ?? true,
    topics: subjectLabels,
    paused: !!prefs?.pausedAt,
  }

  return (
    <HelpClient
      availability={availability}
      picks={picks}
      subjects={subjects}
      waitingCount={incoming.length}
    />
  )
}

function normalizeTopics(topics: string[]) {
  return topics
    .map((topic) => topic.trim())
    .filter(Boolean)
    .slice(0, 6)
}

function buildSubjects(labels: string[], picks: HelpPick[], activeMentees: number): HelpSubject[] {
  return labels.map((label, index) => {
    const id = slug(label)
    const ask = picks.filter((pick) => pick.subjectId === id).length
    return {
      id,
      label,
      ask,
      helped: Math.max(1, activeMentees + index + ask),
      color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
    }
  })
}

function profileName(profile: ProfileSummary | undefined, fallback: string) {
  return profile?.preferredName || profile?.name || fallback
}

function profileRole(profile: ProfileSummary | undefined) {
  const role = [profile?.currentTitle, profile?.currentEmployer].filter(Boolean).join(' · ')
  return role || profile?.university || profile?.city || 'School circle member'
}

function cohort(year: number | null) {
  return year ? `'${String(year).slice(-2)}` : null
}

function buildJoinerNeed(profile: ProfileSummary | undefined) {
  // Coordinator voice — these are suggestions about new joiners, not words
  // they wrote, so the copy must never read as a quote.
  const role = [profile?.currentTitle, profile?.currentEmployer].filter(Boolean).join(' at ')
  if (role) return `Just joined as ${role} — a warm first pointer would go a long way.`
  if (profile?.city)
    return `New to the circle in ${profile.city} — a warm hello would go a long way.`
  return 'New to the circle — a warm first connection would go a long way.'
}

function buildJoinerWhy(profile: ProfileSummary | undefined, subject: string) {
  if (profile?.currentTitle)
    return `Their ${profile.currentTitle.toLowerCase()} work overlaps with ${subject}`
  if (profile?.city) return `You both know ${profile.city}`
  return `${subject} is on your help list`
}

function shortRelativeTime(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.max(1, Math.round(diffMs / 60_000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 14) return `${days}d ago`
  const weeks = Math.round(days / 7)
  return `${weeks}w ago`
}

function graduationYearFrom(value: unknown): number | null {
  const profile = Array.isArray(value) ? value[0] : value
  if (!profile || typeof profile !== 'object') return null
  const year = (profile as { graduation_year?: unknown }).graduation_year
  return typeof year === 'number' ? year : null
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
