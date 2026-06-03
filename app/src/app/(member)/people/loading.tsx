import { Skeleton } from '@/components/ui/skeleton'

export default function PeopleLoading() {
  return (
    <main className="density-cozy min-h-full bg-background">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8">
        <div className="rounded-md border border-border bg-card p-4 shadow-card">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="hidden md:block">
            <div className="sticky top-24 rounded-md border border-border bg-card p-4 shadow-card">
              <Skeleton className="h-4 w-24" />
              <div className="mt-5 space-y-5">
                {['status', 'topics', 'cohort', 'location'].map((id) => (
                  <div key={id} className="space-y-2 border-b border-border pb-4 last:border-b-0">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-full rounded-sm" />
                    <Skeleton className="h-8 w-4/5 rounded-sm" />
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-8 w-28 rounded-md md:hidden" />
            </div>
            {Array.from({ length: 5 }).map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton array
              <div key={index} className="rounded-md border border-border bg-card p-4 shadow-card">
                <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <Skeleton className="size-14 rounded-md" />
                  <div className="min-w-0 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64 max-w-full" />
                    <div className="flex gap-1.5">
                      <Skeleton className="h-6 w-20 rounded-sm" />
                      <Skeleton className="h-6 w-24 rounded-sm" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-28 rounded-md" />
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  )
}
