import { Skeleton } from '@/components/ui/skeleton'

export default function EventsLoading() {
  return (
    <main className="density-cozy min-h-full bg-background">
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="mt-2 h-8 w-96 max-w-full" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <div className="mb-6 flex gap-1 border-b border-border">
          <Skeleton className="-mb-px h-10 w-32 rounded-t-sm" />
          <Skeleton className="-mb-px h-10 w-24 rounded-t-sm" />
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card md:grid md:grid-cols-[300px_minmax(0,1fr)]">
          <div className="border-r border-border bg-background/75">
            {['event-a', 'event-b', 'event-c', 'event-d', 'event-e'].map((id) => (
              <div key={id} className="grid grid-cols-[auto_1fr] gap-3 border-b border-border p-4">
                <Skeleton className="size-12 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
          <div className="p-6">
            <div className="grid gap-5 md:grid-cols-[1fr_auto]">
              <div className="space-y-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-9 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
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
      </div>
    </main>
  )
}
