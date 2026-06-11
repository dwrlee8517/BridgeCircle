import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  AskTypeSelector,
  askNewHref,
  type ComposerSearchParams,
  loadComposer,
  PersonSummaryCard,
} from '../../new/composer'
import { RequestForm } from '../../new/request-form'
import { Wizard } from '../../new/wizard'
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
      <ComposerSheet title="Not taking requests right now">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {helperDisplay} isn&apos;t accepting advice or mentorship requests right now.
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
  const simpleHref = askNewHref({ to: helper.userId, type: askType, intent })
  const guidedHref = askNewHref({ to: helper.userId, type: askType, intent, guided: true })
  const cancelHref = `/profile/${helper.userId}`

  return (
    <ComposerSheet title={`Ask ${helperFirstName} for help`}>
      <div className="space-y-5">
        <PersonSummaryCard helper={helper} helperDisplay={helperDisplay} />
        <AskTypeSelector helper={helper} askType={askType} baseHref={baseHref} />

        {data.useGuidedComposer ? (
          <Wizard
            helperId={helper.userId}
            helperName={helperDisplay}
            askType={askType}
            skipHref={simpleHref}
            cancelHref={cancelHref}
            initialContext={intent}
            signalCandidates={data.signalCandidates}
            activeMenteeCount={helper.activeMenteeCount}
            maxActiveMentees={helper.maxActiveMentees}
            pendingRequestCount={helper.pendingRequestCount}
            maxPendingRequests={helper.maxPendingRequests}
            mentorshipAtCapacity={helper.mentorshipAtCapacity}
          />
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
