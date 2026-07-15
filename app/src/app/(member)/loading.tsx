import { Skeleton } from '@/components/ui/skeleton'

/**
 * Generic loading fallback for member route navigation. Domain routes with
 * distinct geometry provide their own loading boundary.
 *
 * Help, People, and Messages own their route-specific loading states.
 */
export default function MemberLoading() {
  return (
    <div className="density-cozy min-h-screen bg-background">
      <section className="bg-surface-editorial">
        <div className="mx-auto max-w-5xl px-4 pt-8 pb-14 sm:px-8 lg:pt-10">
          <Skeleton className="h-3 w-56 bg-surface-editorial-muted/20" />
          <Skeleton className="mt-4 h-8 w-3/4 max-w-xl bg-surface-editorial-muted/20" />
          <Skeleton className="mt-3 h-4 w-2/3 max-w-lg bg-surface-editorial-muted/20" />
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-8 max-w-5xl px-4 sm:px-8">
        <div className="bc-command-surface">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="size-11 shrink-0 rounded-md" />
            <Skeleton className="h-6 flex-1" />
            <Skeleton className="h-11 w-32 rounded-md" />
          </div>
          <div className="border-border/70 border-t px-4 py-2">
            <Skeleton className="h-3 w-72 max-w-full" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pt-7 sm:px-8">
        <div className="flex h-fit w-full flex-col gap-3.5 rounded-md border border-border bg-card px-5 py-4.5 shadow-card">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-12" />
          </div>
          {['ask-a', 'ask-b'].map((id) => (
            <div key={id} className="flex items-start gap-2.5">
              <Skeleton className="mt-1.5 size-1.5 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-7 sm:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <Skeleton className="h-3 w-40" />
            <div className="mt-3 space-y-2.5">
              {['ex-a', 'ex-b', 'ex-c'].map((id) => (
                <div
                  key={id}
                  className="flex items-start gap-3 rounded-md border border-border bg-card p-3.5 shadow-card"
                >
                  <Skeleton className="mt-0.5 size-4 shrink-0 rounded-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <Skeleton className="h-3 w-44" />
            <div className="mt-3 rounded-md border border-border bg-card shadow-card">
              <div className="flex items-center gap-2 p-3">
                <Skeleton className="size-7 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1 space-y-2 px-1">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="size-10 shrink-0 rounded-md" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-11/12" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="size-7 shrink-0 rounded-md" />
              </div>
              <div className="flex items-center justify-center gap-1.5 pb-2.5">
                {['d-a', 'd-b', 'd-c', 'd-d'].map((id) => (
                  <Skeleton key={id} className="size-1.5 rounded-full" />
                ))}
              </div>
              <div className="flex items-center justify-between border-border/70 border-t px-3.5 py-2">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
