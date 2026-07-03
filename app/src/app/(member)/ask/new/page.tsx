import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdviceFlow } from './advice-flow'
import {
  AskTypeSelector,
  askNewHref,
  type ComposerSearchParams,
  loadComposer,
  PersonSummaryCard,
} from './composer'
import { MentorshipFlow } from './mentorship-flow'
import { RequestForm } from './request-form'

export default async function NewAskPage({
  searchParams,
}: {
  searchParams: Promise<ComposerSearchParams>
}) {
  const params = await searchParams
  const data = await loadComposer(params)
  if (!data) notFound()

  const { helper, helperDisplay, helperFirstName, askType, isOpenForType, intent } = data

  if (!isOpenForType) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Not taking asks right now</CardTitle>
            <CardDescription>{helperDisplay} isn&apos;t taking new asks right now.</CardDescription>
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

  const baseHref = askNewHref({ to: helper.userId, intent })
  const guidedHref = askNewHref({ to: helper.userId, type: askType, intent })
  const skipHref = askNewHref({ to: helper.userId, type: askType, intent, skip: true })
  const adviceHref = askNewHref({ to: helper.userId, type: 'advice', intent })
  const cancelHref = `/profile/${helper.userId}`
  const backHref = intent ? `/ask?nl=${encodeURIComponent(intent)}` : '/people'
  const backLabel = intent ? 'Back to Ask results' : 'Back to People'

  return (
    <div className="min-h-[calc(100vh-72px)] bg-background">
      <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-8 lg:py-10">
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <span aria-hidden>←</span>
          {backLabel}
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

          {data.useGuidedComposer ? (
            <div className="rounded-lg border border-border bg-card p-5">
              {askType === 'advice' ? (
                <AdviceFlow
                  helperId={helper.userId}
                  helperFirstName={helperFirstName}
                  skipHref={skipHref}
                  signalCandidates={data.signalCandidates}
                  initialSituation={intent}
                />
              ) : (
                <MentorshipFlow
                  helperId={helper.userId}
                  helperFirstName={helperFirstName}
                  cancelHref={cancelHref}
                  adviceHref={adviceHref}
                  adviceOpen={helper.isOpenAsAdviceHelper}
                  signalCandidates={data.signalCandidates}
                  screeningPrompt={helper.screeningPrompt}
                  activeMenteeCount={helper.activeMenteeCount}
                  maxActiveMentees={helper.maxActiveMentees}
                  mentorshipAtCapacity={helper.mentorshipAtCapacity}
                  initialGoal={intent}
                />
              )}
            </div>
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
                initialHelpNeeded={intent}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
