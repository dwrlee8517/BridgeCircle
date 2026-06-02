import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { createClient } from '@/db/server'
import type { AskType } from '@/lib/asks/schemas'
import { deriveSignals } from '@/lib/asks/signals'
import { requireSession } from '@/lib/auth/session'
import { getProfile } from '@/lib/profile/getProfile'
import { cn, displayName } from '@/lib/utils'
import { RequestForm } from './request-form'
import { Wizard } from './wizard'

type SearchParams = { to?: string; type?: string; skip?: string; guided?: string }

function parseAskType(t: string | undefined): AskType {
  return t === 'mentorship' ? 'mentorship' : 'advice'
}

export default async function NewAskPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireSession()
  const params = await searchParams

  if (!params.to) notFound()

  const requestedAskType = parseAskType(params.type)

  const supabase = await createClient()
  // Pass viewerId so privacy redaction applies — per locked decision,
  // mentorship doesn't override privacy. The asker sees only what
  // privacy settings + their (likely non-friend) relationship allows.
  // We also fetch the asker's own profile so the wizard's signals step
  // can derive shared-attribute candidates (city / school / major /
  // cohort) — that derivation is pure but needs both sides.
  const [helper, asker] = await Promise.all([
    getProfile(supabase, params.to, session.userId),
    getProfile(supabase, session.userId, session.userId),
  ])
  if (!helper) notFound()

  const askType = getAvailableAskType(requestedAskType, helper)
  const isOpenForType = askType === 'advice' ? helper.isOpenAsAdviceHelper : helper.isOpenAsMentor
  if (!isOpenForType) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Not taking requests right now</CardTitle>
            <CardDescription>
              {displayName(helper.name, helper.preferredName)} isn&apos;t accepting advice or
              mentorship requests right now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/profile/${helper.userId}`} className="text-sm underline">
              ← Back to profile
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const helperDisplay = displayName(helper.name, helper.preferredName)
  const helperFirstName = helperDisplay.split(/\s+/)[0] || 'them'
  const baseHref = `/ask/new?to=${helper.userId}`
  const simpleHref = `${baseHref}&type=${askType}`
  const guidedHref = `${simpleHref}&guided=1`
  const cancelHref = `/profile/${helper.userId}`
  const useGuidedComposer = params.guided === '1' && params.skip !== '1'

  // Derive signals server-side once. If the asker profile failed to load
  // (rare — they're authed and have a session), pass an empty list so
  // the wizard simply skips the signals step.
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

  return (
    <div className="min-h-[calc(100vh-72px)] bg-background">
      <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-8 lg:py-10">
        <Link
          href="/people"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <span aria-hidden>←</span>
          Back to People
        </Link>

        <div className="mb-6">
          <p className="bc-section-kicker mb-2">Ask for help</p>
          <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground">
            Ask {helperFirstName} for help
          </h1>
        </div>

        <div className="space-y-6">
          <PersonSummaryCard helper={helper} helperDisplay={helperDisplay} />
          <AskTypeSelector helper={helper} askType={askType} baseHref={baseHref} />

          {useGuidedComposer ? (
            <Card className="rounded-lg border-border bg-card p-0">
              <CardHeader>
                <CardTitle>Guided composer</CardTitle>
                <CardDescription>
                  Use the step-by-step flow if you want help shaping the request.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Wizard
                  helperId={helper.userId}
                  helperName={helperDisplay}
                  askType={askType}
                  skipHref={simpleHref}
                  cancelHref={cancelHref}
                  signalCandidates={signalCandidates}
                  activeMenteeCount={helper.activeMenteeCount}
                  maxActiveMentees={helper.maxActiveMentees}
                  pendingRequestCount={helper.pendingRequestCount}
                  maxPendingRequests={helper.maxPendingRequests}
                  mentorshipAtCapacity={helper.mentorshipAtCapacity}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border border-border bg-card p-5">
              <RequestForm
                helperId={helper.userId}
                helperName={helperDisplay}
                askType={askType}
                guidedHref={guidedHref}
                placeholderContext={{
                  helperFirstName,
                  helperCurrentTitle: helper.currentTitle,
                  helperCurrentEmployer: helper.currentEmployer,
                  helperUniversity: helper.university,
                  helperMajor: helper.major,
                  helperCity: helper.city,
                  helperMentoringTopics: helper.mentoringTopics,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type HelperProfile = NonNullable<Awaited<ReturnType<typeof getProfile>>>

function getAvailableAskType(requested: AskType, helper: HelperProfile): AskType {
  if (requested === 'advice' && helper.isOpenAsAdviceHelper) return 'advice'
  if (requested === 'mentorship' && helper.isOpenAsMentor) return 'mentorship'
  if (helper.isOpenAsAdviceHelper) return 'advice'
  return 'mentorship'
}

function PersonSummaryCard({
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

function AskTypeSelector({
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
