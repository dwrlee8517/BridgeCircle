import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/ui/status-badge'
import { createClient } from '@/db/server'
import { deriveSignals, type SignalCandidate } from '@/lib/asks/signals'
import { requireSession } from '@/lib/auth/session'
import { getProfile } from '@/lib/profile/getProfile'
import { displayName, isOpenToHelp } from '@/lib/utils'

/**
 * Shared composer plumbing for the full-page composer (/ask/new) and the
 * intercepted side-sheet variant rendered over ask results. Both surfaces
 * load the same server data and render the same building blocks, so the
 * flows can't drift apart.
 */

export type ComposerSearchParams = {
  to?: string
  /** Legacy ?type= from pre-Phase-2 links — accepted and ignored. */
  type?: string
  skip?: string
  guided?: string
  intent?: string
}

export type HelperProfile = NonNullable<Awaited<ReturnType<typeof getProfile>>>

export type ComposerData = {
  helper: HelperProfile
  helperDisplay: string
  helperFirstName: string
  isOpen: boolean
  intent: string
  useGuidedComposer: boolean
  signalCandidates: SignalCandidate[]
}

export function askNewHref({
  to,
  intent,
  skip,
}: {
  to: string
  intent?: string
  /** Bypass the conversational composer and write the note directly. */
  skip?: boolean
}) {
  const next = new URLSearchParams({ to })
  if (intent?.trim()) next.set('intent', intent.trim())
  if (skip) next.set('skip', '1')
  return `/ask/new?${next.toString()}`
}

/** Gathers everything the composer needs. Returns null when `to` is missing
 * or the helper profile can't be loaded — callers decide how to 404. */
export async function loadComposer(params: ComposerSearchParams): Promise<ComposerData | null> {
  if (!params.to) return null

  const session = await requireSession()
  const intent = params.intent?.trim() || ''

  const supabase = await createClient()
  // Pass viewerId so privacy redaction applies — per locked decision,
  // asking doesn't override privacy. The asker sees only what
  // privacy settings + their (likely non-friend) relationship allows.
  // We also fetch the asker's own profile so the composer can derive
  // shared-attribute signal candidates (city / school / major / cohort)
  // — that derivation is pure but needs both sides.
  const [helper, asker] = await Promise.all([
    getProfile(supabase, params.to, session.userId),
    getProfile(supabase, session.userId, session.userId),
  ])
  if (!helper) return null

  const helperDisplay = displayName(helper.name, helper.preferredName)
  const helperFirstName = helperDisplay.split(/\s+/)[0] || 'them'

  // Derive signals server-side once. If the asker profile failed to load
  // (rare — they're authed and have a session), pass an empty list so
  // the composer simply hides its leaned-on chips.
  const signalCandidates = asker
    ? deriveSignals(
        {
          graduationYear: asker.graduationYear,
          university: asker.university,
          major: asker.major,
          city: asker.city,
        },
        {
          graduationYear: helper.graduationYear,
          university: helper.university,
          major: helper.major,
          city: helper.city,
          bio: helper.bio,
          mentoringTopics: helper.mentoringTopics,
          careerHistory:
            helper.careerHistory?.map((e) => ({
              employer: e.employer,
              title: e.title,
              startDate: e.start_date,
              endDate: e.end_date,
            })) ?? null,
        },
      )
    : []

  return {
    helper,
    helperDisplay,
    helperFirstName,
    // One availability state (ADR 0011 Phase 2), matching createAsk's gate.
    isOpen: isOpenToHelp(helper),
    intent,
    // Conversational composer is the default; ?skip=1 is the explicit
    // "I know what to say" path straight to the plain form.
    useGuidedComposer: params.skip !== '1',
    signalCandidates,
  }
}

export function PersonSummaryCard({
  helper,
  helperDisplay,
}: {
  helper: HelperProfile
  helperDisplay: string
}) {
  const initials = helperDisplay
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const yearShort = helper.graduationYear ? `'${String(helper.graduationYear).slice(-2)}` : null
  const role = [helper.currentTitle, helper.currentEmployer].filter(Boolean).join(' · ')
  const location = [helper.city, helper.university, helper.major].filter(Boolean).join(' · ')

  return (
    <div className="flex items-start gap-3.5 rounded-lg border border-border bg-card p-4 shadow-card">
      <Avatar className="size-12 rounded-lg after:rounded-lg">
        {helper.avatarUrl ? (
          <AvatarImage src={helper.avatarUrl} alt="" className="rounded-lg" />
        ) : null}
        <AvatarFallback className="rounded-lg bg-surface-subtle font-heading text-base font-semibold text-muted-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="font-heading text-base font-semibold text-foreground">{helperDisplay}</p>
          {yearShort ? (
            <span className="font-mono text-xs text-muted-foreground">{yearShort}</span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {isOpenToHelp(helper) ? (
            <StatusBadge tone="open" size="sm" dot>
              Open to help
            </StatusBadge>
          ) : null}
        </div>
        {role ? <p className="mt-2 text-sm font-medium text-foreground">{role}</p> : null}
        {location ? <p className="mt-0.5 text-xs text-muted-foreground">{location}</p> : null}
        {helper.mentoringTopics && helper.mentoringTopics.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {helper.mentoringTopics.slice(0, 4).map((topic) => (
              <span
                key={topic}
                className="rounded border border-border bg-surface-subtle px-2 py-0.5 font-mono text-xs text-muted-foreground"
              >
                {topic}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
