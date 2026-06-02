import { Skeleton } from '@/components/ui/skeleton'

export default function InboxLoading() {
  return (
    <main className="density-cozy min-h-[calc(100vh-72px)] bg-background md:h-[calc(100vh-72px)] md:overflow-hidden">
      <header className="border-b border-border bg-card px-4 md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-6">
          <div className="flex items-center pt-3 md:py-0">
            <Skeleton className="h-7 w-24" />
          </div>
          <div className="flex flex-wrap items-end gap-1 md:flex-nowrap md:gap-0">
            {['priority', 'all', 'advice', 'mentorship'].map((id) => (
              <Skeleton key={id} className="h-10 w-28 rounded-t-sm" />
            ))}
          </div>
        </div>
      </header>

      <div className="grid md:h-[calc(100%-41px)] md:grid-cols-[360px_minmax(0,1fr)]">
        <section className="border-r border-border bg-card">
          <div className="border-b border-border bg-surface-panel/45 p-3">
            <Skeleton className="h-9 w-full rounded-md" />
            <div className="mt-3 flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="space-y-1.5 p-1.5">
            {Array.from({ length: 7 }).map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton array
              <div key={index} className="rounded-md p-3">
                <div className="flex gap-3">
                  <Skeleton className="size-10 rounded-md" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="hidden bg-card p-6 md:block">
          <div className="mx-auto max-w-3xl space-y-5">
            <div className="flex items-start gap-4">
              <Skeleton className="size-12 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-80 max-w-full" />
              </div>
            </div>
            <Skeleton className="h-28 w-full rounded-md" />
            <div className="space-y-3">
              <Skeleton className="h-16 w-2/3 rounded-md" />
              <Skeleton className="ml-auto h-16 w-2/3 rounded-md" />
              <Skeleton className="h-14 w-1/2 rounded-md" />
            </div>
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        </section>
      </div>
    </main>
  )
}
