import { Skeleton } from '@/components/ui/skeleton'

export default function SchoolLoading() {
  return (
    <main className="density-cozy min-h-full bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <div className="mb-6 rounded-lg border border-border bg-card p-5 shadow-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-8 w-72 max-w-full" />
              <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Skeleton className="h-3 w-32" />
                <Skeleton className="mt-2 h-7 w-48" />
              </div>
              <div className="flex gap-1.5">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card md:grid md:grid-cols-[300px_minmax(0,1fr)]">
              <div className="border-r border-border bg-background/75">
                {['school-event-a', 'school-event-b', 'school-event-c', 'school-event-d'].map(
                  (id) => (
                    <div
                      key={id}
                      className="grid grid-cols-[auto_1fr] gap-3 border-b border-border p-4"
                    >
                      <Skeleton className="size-12 rounded-md" />
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  ),
                )}
              </div>
              <div className="p-6">
                <div className="grid gap-5 md:grid-cols-[1fr_auto]">
                  <div className="space-y-3">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <Skeleton className="size-24 rounded-lg" />
                </div>
                <Skeleton className="mt-5 h-24 w-full rounded-md" />
                <div className="mt-5 flex gap-2">
                  <Skeleton className="h-10 w-36 rounded-md" />
                  <Skeleton className="h-10 w-32 rounded-md" />
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-lg border border-border bg-card p-5 shadow-card">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="mt-2 h-6 w-48" />
              <Skeleton className="mt-4 h-24 w-full rounded-md" />
            </div>
            <div className="rounded-lg border border-border bg-card p-5 shadow-card">
              <Skeleton className="h-3 w-32" />
              <div className="mt-4 space-y-3">
                <Skeleton className="h-14 w-full rounded-md" />
                <Skeleton className="h-14 w-full rounded-md" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
