import { Skeleton } from '@/components/ui/skeleton'

/** Mirrors the current Help home: wash header with the Get/Give switch, the
 * "What do you need?" composer card, then the Your-asks list. */
export default function HelpLoading() {
  return (
    <div className="min-h-full bg-[var(--surface-page)]">
      <p role="status" className="sr-only">
        Loading Help.
      </p>
      <section
        aria-hidden
        className="bg-[image:var(--wash-get)] px-4 pt-5 pb-7 sm:px-6 sm:pt-7 sm:pb-8 xl:px-8"
      >
        <div className="mx-auto max-w-[860px]">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-11 w-56 rounded-full" />
            <Skeleton className="h-3.5 w-36 rounded-full" />
          </div>
          <Skeleton className="mt-6 h-9 w-72 max-w-[80%] rounded-[9px]" />
          <Skeleton className="mt-2.5 h-4 w-[480px] max-w-[92%] rounded-full" />
          <Skeleton className="mt-4.5 h-[152px] w-full rounded-[var(--radius-large)]" />
        </div>
      </section>

      <section aria-hidden className="mx-auto max-w-[860px] px-4 py-6 sm:px-6 sm:py-7 xl:px-0">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4.5 w-24 rounded-full" />
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="ml-auto h-3.5 w-16 rounded-full" />
        </div>
        <div className="mt-2.5 overflow-hidden rounded-[var(--radius-large)] bg-card shadow-[var(--ring-card),var(--shadow-card)]">
          {['ask-a', 'ask-b', 'ask-c', 'ask-d'].map((id) => (
            <div
              key={id}
              className="flex min-h-16 items-center gap-3 border-t border-[var(--divider-row)] px-4 py-3 first:border-t-0 sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-72 max-w-[70%] rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="mt-2 h-3 w-44 rounded-full" />
              </div>
              <Skeleton className="size-4 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
