import { Skeleton } from '@/components/ui/skeleton'

// Catch-all loader for the admin route group. Admin surfaces are
// table-heavy operator views (density-pro per tokens.md § Density modes) —
// page kicker + h1 + action toolbar + dense rows.
export default function AdminLoading() {
  return (
    <div className="density-pro min-h-screen bg-background">
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
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
