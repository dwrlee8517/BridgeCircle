import { format } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { OPEN_ASK_TTL_DAYS, type OpenAsk } from '@/lib/asks/openAsks'
import { closeOpenAskAction, keepAskOpenAction } from './open-ask-actions'

/**
 * Standing-ask surfaces. Copy rules: honest about the odds ("quiet is
 * normal"), honest about exposure, and the system never pressures — the
 * ask closes on its own.
 */

function untilDate(iso: string) {
  return format(new Date(iso), 'EEE, MMM d')
}

/** Quiet row on the starter while a standing ask is open. */
export function OpenAskRow({ openAsk, matchCount }: { openAsk: OpenAsk; matchCount: number }) {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-8 sm:px-8">
      <p className="bc-card-label">Your open ask</p>
      <div className="mt-3 flex flex-wrap items-center gap-4 rounded-md border border-border bg-card p-4 shadow-card">
        <div className="min-w-0 flex-1 basis-64">
          {/* Member-written words — quotes allowed. */}
          <blockquote className="border-primary border-l-2 pl-3 text-sm font-medium leading-relaxed text-foreground">
            &ldquo;{openAsk.question}&rdquo;
          </blockquote>
          <p className="mt-2 text-xs text-muted-foreground">
            Open until{' '}
            <span className="font-mono font-semibold text-foreground">
              {untilDate(openAsk.expiresAt)}
            </span>
            {matchCount > 0 ? (
              <>
                {' '}
                · <span className="font-mono font-semibold text-accent-sage">{matchCount}</span>{' '}
                possible {matchCount === 1 ? 'fit' : 'fits'} found
              </>
            ) : (
              <> · watching for a fit — quiet is normal</>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {matchCount > 0 ? (
            <Button asChild size="sm" className="rounded-md">
              <Link href={`/ask?nl=${encodeURIComponent(openAsk.question)}`}>
                See matches
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          ) : null}
          <form action={closeOpenAskAction}>
            <input type="hidden" name="openAskId" value={openAsk.id} />
            <Button type="submit" variant="outline" size="sm" className="rounded-md">
              Close
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}

/** The no-match fallback — converts a dead end into a deferred promise. */
export function KeepAskOpenCard({
  query,
  poolSize,
  existingOpenAsk,
  canKeepOpen,
}: {
  query: string
  poolSize: number
  existingOpenAsk: OpenAsk | null
  canKeepOpen: boolean
}) {
  if (existingOpenAsk) {
    return (
      <div className="rounded-md border border-border bg-card p-8 text-center shadow-card">
        <p className="font-heading text-lg font-semibold text-foreground">No strong match today</p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Your open ask is already with us — we&rsquo;re watching for a fit until{' '}
          {untilDate(existingOpenAsk.expiresAt)}. Try rephrasing this one, or browse People.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-md">
            <Link href={`/ask?edit=1&nl=${encodeURIComponent(query)}`}>Edit your ask</Link>
          </Button>
          <Button asChild size="sm" className="rounded-md">
            <Link href={`/people?nl=${encodeURIComponent(query)}`}>Try People search</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!canKeepOpen) {
    const body =
      poolSize === 0
        ? "We don't have many alumni in this area yet. Try widening the question, or browse People."
        : 'No one was a clear fit for this question. Try rephrasing it, or browse People.'
    return (
      <div className="rounded-md border border-border bg-card p-8 text-center shadow-card">
        <p className="font-heading text-lg font-semibold text-foreground">
          We didn&rsquo;t find a match this time
        </p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-md">
            <Link href={`/ask?edit=1&nl=${encodeURIComponent(query)}`}>Edit your ask</Link>
          </Button>
          <Button asChild size="sm" className="rounded-md">
            <Link href={`/people?nl=${encodeURIComponent(query)}`}>Try People search</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-border bg-card p-6 shadow-card sm:p-8">
      <p className="font-heading text-lg font-semibold text-foreground">No strong match today</p>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Nobody in the circle is a clear fit right now. You can leave the ask with us — if someone
        joins or opens up who fits, we&rsquo;ll introduce you.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <form action={keepAskOpenAction}>
          <input type="hidden" name="question" value={query} />
          <Button type="submit" size="sm" className="rounded-md">
            Keep this ask open
          </Button>
        </form>
        <Button asChild variant="outline" size="sm" className="rounded-md">
          <Link href={`/ask?edit=1&nl=${encodeURIComponent(query)}`}>Edit ask</Link>
        </Button>
        <Link
          href={`/people?nl=${encodeURIComponent(query)}`}
          className="ml-1 text-sm font-medium text-link hover:text-link-hover"
        >
          Try People search
        </Link>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        {`It stays open for ${OPEN_ASK_TTL_DAYS} days, then closes on its own. We’ll only reach out for a genuine fit — quiet is normal.`}
      </p>
    </div>
  )
}
