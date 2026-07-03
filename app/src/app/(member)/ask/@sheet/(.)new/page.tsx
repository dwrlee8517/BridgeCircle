import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChatComposer } from '../../new/chat-composer'
import {
  askNewHref,
  type ComposerSearchParams,
  loadComposer,
  PersonSummaryCard,
} from '../../new/composer'
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

  const { helper, helperDisplay, helperFirstName, isOpen, intent } = data

  if (!isOpen) {
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

  const guidedHref = askNewHref({ to: helper.userId, intent })
  const skipHref = askNewHref({ to: helper.userId, intent, skip: true })

  return (
    <ComposerSheet title={`Ask ${helperFirstName} for help`}>
      <div className="space-y-5">
        <PersonSummaryCard helper={helper} helperDisplay={helperDisplay} />

        {data.useGuidedComposer ? (
          <ChatComposer
            helperId={helper.userId}
            helperFirstName={helperFirstName}
            skipHref={skipHref}
            signalCandidates={data.signalCandidates}
            initialSituation={intent}
          />
        ) : (
          <RequestForm
            helperId={helper.userId}
            helperName={helperDisplay}
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
