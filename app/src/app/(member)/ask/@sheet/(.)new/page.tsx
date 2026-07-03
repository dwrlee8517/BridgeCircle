import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AdviceFlow } from '../../new/advice-flow'
import {
  AskTypeSelector,
  askNewHref,
  type ComposerSearchParams,
  loadComposer,
  PersonSummaryCard,
} from '../../new/composer'
import { MentorshipFlow } from '../../new/mentorship-flow'
import { RequestForm } from '../../new/request-form'
import { ComposerSheet } from './composer-sheet'

/**
 * Intercepted /ask/new — the composer as a side panel over whatever the
 * member was looking at (usually results), so choosing a helper and writing
 * the note never lose each other. Hard loads fall through to the full page.
 */
export default async function InterceptedNewAskPage({
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
      <ComposerSheet title="Not taking asks right now">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {helperDisplay} isn&apos;t taking new asks right now.
        </p>
        <Link
          href={`/profile/${helper.userId}`}
          className="mt-4 inline-block text-sm font-medium text-link hover:text-link-hover"
        >
          View profile
        </Link>
      </ComposerSheet>
    )
  }

  const baseHref = askNewHref({ to: helper.userId, intent })
  const guidedHref = askNewHref({ to: helper.userId, type: askType, intent })
  const skipHref = askNewHref({ to: helper.userId, type: askType, intent, skip: true })
  const adviceHref = askNewHref({ to: helper.userId, type: 'advice', intent })
  const cancelHref = `/profile/${helper.userId}`

  return (
    <ComposerSheet title={`Ask ${helperFirstName} for help`}>
      <div className="space-y-5">
        <PersonSummaryCard helper={helper} helperDisplay={helperDisplay} />
        <AskTypeSelector helper={helper} askType={askType} baseHref={baseHref} />

        {data.useGuidedComposer ? (
          askType === 'advice' ? (
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
          )
        ) : (
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
        )}
      </div>
    </ComposerSheet>
  )
}
