import { Skeleton } from '@/components/ui/skeleton'

// Content loader for the admin route group. Renders inside the takeover
// shell (the rail persists during navigation), so it only mirrors the page
// area: h1 + toolbar + dense table rows at density-pro.
export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[var(--surface-canvas)]">
      <section className="mx-auto max-w-5xl px-4 pt-6 sm:px-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        {/* Filter / toolbar row */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-64 max-w-full rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>

        {/* Table-style rows */}
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-surface-panel/45 px-4 py-2.5">
            <div className="grid grid-cols-[2fr_1.5fr_1fr_120px] gap-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <ul className="divide-y divide-border/60">
            {['r-a', 'r-b', 'r-c', 'r-d', 'r-e', 'r-f', 'r-g', 'r-h'].map((id) => (
              <li
                key={id}
                className="grid grid-cols-[2fr_1.5fr_1fr_120px] items-center gap-4 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Skeleton className="size-8 shrink-0 rounded-lg" />
                  <Skeleton className="h-4 w-32 max-w-full" />
                </div>
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
