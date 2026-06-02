import { Skeleton } from '@/components/ui/skeleton'

export default function EventDetailLoading() {
  return (
    <main className="density-cozy min-h-full bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
        <Skeleton className="h-4 w-32" />

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card shadow-card">
              <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto]">
                <div className="space-y-3">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-9 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <Skeleton className="size-24 rounded-lg" />
              </div>
              <div className="grid border-t border-border bg-background sm:grid-cols-3">
                <Skeleton className="m-4 h-16 rounded-md" />
                <Skeleton className="m-4 h-16 rounded-md" />
                <Skeleton className="m-4 h-16 rounded-md" />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Skeleton className="h-52 rounded-lg" />
              <Skeleton className="h-52 rounded-lg" />
            </div>
            <Skeleton className="h-36 rounded-lg" />
            <Skeleton className="h-56 rounded-lg" />
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-border bg-card p-5 shadow-card">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-5 h-10 w-full rounded-md" />
              <Skeleton className="mt-5 h-16 w-full rounded-md" />
              <div className="mt-5 space-y-2 border-t border-border pt-5">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
