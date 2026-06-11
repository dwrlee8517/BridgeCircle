import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/ui/status-badge'
import { createClient } from '@/db/server'
import type { AskType } from '@/lib/asks/schemas'
import { deriveSignals, type SignalCandidate } from '@/lib/asks/signals'
import { requireSession } from '@/lib/auth/session'
import { getProfile } from '@/lib/profile/getProfile'
import { cn, displayName } from '@/lib/utils'

/**
 * Shared composer plumbing for the full-page composer (/ask/new) and the
 * intercepted side-sheet variant rendered over ask results. Both surfaces
 * load the same server data and render the same building blocks, so the
 * flows can't drift apart.
 */

export type ComposerSearchParams = {
  to?: string
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
  askType: AskType
  isOpenForType: boolean
  intent: string
  useGuidedComposer: boolean
  signalCandidates: SignalCandidate[]
}

export function parseAskType(t: string | undefined): AskType {
  return t === 'mentorship' ? 'mentorship' : 'advice'
}

export function askNewHref({
  to,
  type,
  intent,
  skip,
}: {
  to: string
  type?: AskType
  intent?: string
  /** Bypass the guided flow and write the note directly. */
  skip?: boolean
}) {
  const next = new URLSearchParams({ to })
  if (type) next.set('type', type)
  if (intent?.trim()) next.set('intent', intent.trim())
  if (skip) next.set('skip', '1')
  return `/ask/new?${next.toString()}`
}

function getAvailableAskType(requested: AskType, helper: HelperProfile): AskType {
  if (requested === 'advice' && helper.isOpenAsAdviceHelper) return 'advice'
  if (requested === 'mentorship' && helper.isOpenAsMentor) return 'mentorship'
  if (helper.isOpenAsAdviceHelper) return 'advice'
  return 'mentorship'
}

/** Gathers everything the composer needs. Returns null when `to` is missing
 * or the helper profile can't be loaded — callers decide how to 404. */
export async function loadComposer(params: ComposerSearchParams): Promise<ComposerData | null> {
  if (!params.to) return null

  const session = await requireSession()
  const requestedAskType = parseAskType(params.type)
  const intent = params.intent?.trim() || ''

  const supabase = await createClient()
  // Pass viewerId so privacy redaction applies — per locked decision,
  // mentorship doesn't override privacy. The asker sees only what
  // privacy settings + their (likely non-friend) relationship allows.
  // We also fetch the asker's own profile so the guided flows can derive
  // shared-attribute signal candidates (city / school / major / cohort)
  // — that derivation is pure but needs both sides.
  const [helper, asker] = await Promise.all([
    getProfile(supabase, params.to, session.userId),
    getProfile(supabase, session.userId, session.userId),
  ])
  if (!helper) return null

  const askType = getAvailableAskType(requestedAskType, helper)
  const isOpenForType = askType === 'advice' ? helper.isOpenAsAdviceHelper : helper.isOpenAsMentor
  const helperDisplay = displayName(helper.name, helper.preferredName)
  const helperFirstName = helperDisplay.split(/\s+/)[0] || 'them'

  // Derive signals server-side once. If the asker profile failed to load
  // (rare — they're authed and have a session), pass an empty list so
  // the flows simply hide their mentions / evidence pieces.
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
    askType,
    isOpenForType,
    intent,
    // Guided is the default; ?skip=1 is the explicit "I know what to say"
    // path straight to the plain form. (?guided=1 in old links is harmless.)
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
          {helper.isOpenAsAdviceHelper ? (
            <StatusBadge tone="open" size="sm" dot>
              Quick advice
            </StatusBadge>
          ) : null}
          {helper.isOpenAsMentor ? (
            <StatusBadge tone="info" size="sm" dot>
              Mentorship
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

export function AskTypeSelector({
  helper,
  askType,
  baseHref,
}: {
  helper: HelperProfile
  askType: AskType
  baseHref: string
}) {
  const options: Array<{
    id: AskType
    label: string
    sub: string
    disabled: boolean
  }> = [
    {
      id: 'advice',
      label: 'Quick advice',
      sub: 'One-off question or exchange',
      disabled: !helper.isOpenAsAdviceHelper,
    },
    {
      id: 'mentorship',
      label: 'Mentorship',
      sub: 'Ongoing relationship over time',
      disabled: !helper.isOpenAsMentor,
    },
  ]

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">What kind of help?</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = askType === option.id
          const className = cn(
            'rounded-lg border p-3 text-left transition-colors',
            selected
              ? 'border-primary bg-primary-tint text-primary'
              : 'border-border bg-card text-foreground hover:border-primary/35',
            option.disabled && 'pointer-events-none opacity-45',
          )
          const content = (
            <>
              <p className="text-sm font-semibold">{option.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{option.sub}</p>
            </>
          )
          return option.disabled ? (
            <div key={option.id} className={className} aria-disabled>
              {content}
            </div>
          ) : (
            <Link key={option.id} href={`${baseHref}&type=${option.id}`} className={className}>
              {content}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
