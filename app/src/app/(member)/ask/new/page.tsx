import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import type { AskType } from '@/lib/asks/schemas'
import { deriveSignals } from '@/lib/asks/signals'
import { requireSession } from '@/lib/auth/session'
import { getProfile } from '@/lib/profile/getProfile'
import { RequestForm } from './request-form'
import { Wizard } from './wizard'

type SearchParams = { to?: string; type?: string; skip?: string }

function parseAskType(t: string | undefined): AskType {
  return t === 'advice' ? 'advice' : 'mentorship'
}

export default async function NewAskPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireSession()
  const params = await searchParams

  if (!params.to) notFound()

  const askType = parseAskType(params.type)

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

  const isOpenForType = askType === 'advice' ? helper.isOpenAsAdviceHelper : helper.isOpenAsMentor
  if (!isOpenForType) {
    const label = askType === 'advice' ? 'open to advice' : 'open to mentorship'
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Not {label} right now</CardTitle>
            <CardDescription>
              {helper.name} isn&apos;t accepting {askType} requests right now.
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

  const title =
    askType === 'advice'
      ? `Ask ${helper.name} for advice`
      : `Request mentorship from ${helper.name}`
  const description =
    askType === 'advice'
      ? "Send a single quick question. They'll get an email and can reply at their pace."
      : "They'll get an email notification and can accept or decline. Be specific — concrete asks get answered faster."

  // The wizard is the default surface; the simple form is opt-in via
  // ?skip=1 (linked from the wizard's "I know what to say"). Both end
  // at the same `submitRequest` server action, so behavior on submit
  // is identical.
  const useSkipForm = params.skip === '1'
  const baseHref = `/ask/new?to=${helper.userId}${askType === 'advice' ? '&type=advice' : ''}`
  const skipHref = `${baseHref}&skip=1`
  const cancelHref = `/profile/${helper.userId}`

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
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <Link href={cancelHref} className="text-sm text-muted-foreground hover:underline">
        ← Back to {helper.name}&apos;s profile
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {useSkipForm ? (
            <>
              <RequestForm
                helperId={helper.userId}
                helperName={helper.name ?? 'this person'}
                askType={askType}
                placeholderContext={{
                  helperFirstName: (helper.name ?? '').split(' ')[0] || 'them',
                  helperCurrentTitle: helper.currentTitle,
                  helperCurrentEmployer: helper.currentEmployer,
                  helperUniversity: helper.university,
                  helperMajor: helper.major,
                  helperCity: helper.city,
                  helperMentoringTopics: helper.mentoringTopics,
                }}
              />
              <div className="mt-4 text-xs text-muted-foreground">
                <Link href={baseHref} className="hover:text-foreground hover:underline">
                  ← Use the guided composer instead
                </Link>
              </div>
            </>
          ) : (
            <Wizard
              helperId={helper.userId}
              helperName={helper.name ?? 'this person'}
              askType={askType}
              skipHref={skipHref}
              cancelHref={cancelHref}
              signalCandidates={signalCandidates}
              activeMenteeCount={helper.activeMenteeCount}
              maxActiveMentees={helper.maxActiveMentees}
              pendingRequestCount={helper.pendingRequestCount}
              maxPendingRequests={helper.maxPendingRequests}
              mentorshipAtCapacity={helper.mentorshipAtCapacity}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
