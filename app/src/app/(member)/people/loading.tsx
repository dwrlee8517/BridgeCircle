import { Skeleton } from '@/components/ui/skeleton'

export default function PeopleLoading() {
  return (
    <div className="bg-background min-h-full">
      {/* 1. Hero Skeleton */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        {/* Background Dots */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(12,12,11,0.15) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />
        {/* Decorative SVG motifs */}
        <svg
          aria-hidden="true"
          role="presentation"
          viewBox="0 0 200 200"
          className="absolute right-0 top-1/2 -translate-y-1/2 h-[200px] w-[200px] opacity-10 pointer-events-none sm:right-10 md:right-16 lg:right-24"
        >
          <title>Decorative two-circle motif</title>
          <circle
            cx="80"
            cy="100"
            r="60"
            fill="none"
            className="stroke-foreground"
            strokeWidth="1"
          />
          <circle cx="130" cy="100" r="60" fill="none" className="stroke-primary" strokeWidth="1" />
        </svg>

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-14">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-2.5 h-10 w-72" />
          <Skeleton className="mt-3.5 h-5 w-full max-w-2xl" />
        </div>
      </section>

      {/* 2. Main Directory Columns Skeleton */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 space-y-6">
        {/* Search Capsule Skeleton */}
        <div className="flex items-center border border-border bg-card rounded-full p-1.5 pl-5 shadow-sm h-11">
          <Skeleton className="size-4 rounded-full mr-3" />
          <Skeleton className="h-4 flex-1 max-w-xs" />
          <Skeleton className="h-8 w-20 rounded-full ml-auto" />
        </div>

        {/* 2-Column layout */}
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 items-start">
          {/* Left Column: Facet Sidebar Skeleton */}
          <aside className="hidden md:block space-y-4">
            <div className="flex justify-between items-baseline mb-2">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="border border-border bg-card rounded-[6px] p-4 space-y-6 shadow-sm">
              {/* Group 1 Skeleton */}
              <div className="space-y-2 pb-3 border-b border-border/60">
                <Skeleton className="h-3.5 w-20 mb-3" />
                <div className="flex items-center gap-2">
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              {/* Group 2 Skeleton */}
              <div className="space-y-2 pb-3 border-b border-border/60">
                <Skeleton className="h-3.5 w-24 mb-3" />
                <Skeleton className="h-7 w-full rounded" />
                <Skeleton className="h-7 w-full rounded mt-2" />
              </div>
              {/* Group 3 Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-16 mb-3" />
                <Skeleton className="h-7 w-full rounded" />
              </div>
            </div>
          </aside>

          {/* Right Column: Results List Skeleton */}
          <div className="space-y-6">
            {/* Header / Density Toggle Skeleton */}
            <div className="flex items-center justify-between border-b pb-3 border-border">
              <Skeleton className="h-4 w-48" />
              <div className="flex gap-1.5">
                <Skeleton className="h-6 w-12 rounded" />
                <Skeleton className="h-6 w-12 rounded" />
              </div>
            </div>

            {/* Grid Skeletons */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton array
                  key={i}
                  className="p-4 border border-border bg-card rounded-[6px] space-y-4 shadow-sm"
                >
                  <div className="flex gap-3">
                    <Skeleton className="size-[52px] rounded-[6px] shrink-0" />
                    <div className="flex-1 space-y-2 min-w-0">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <div className="flex gap-1.5 pt-2 border-t border-dashed border-border/60">
                    <Skeleton className="h-6 w-20 rounded animate-pulse" />
                    <Skeleton className="h-6 w-16 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
