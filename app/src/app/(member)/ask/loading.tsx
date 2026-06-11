import { Skeleton } from '@/components/ui/skeleton'

/**
 * Mirrors the redesigned results layout: slim page band, context rail on the
 * left, featured match + compact rows on the right. Keep the geometry in
 * sync with page.tsx / results-ui.tsx so results land without reflow.
 */
export default function AskLoading() {
  return (
    <div className="density-cozy min-h-full bg-background">
      <section className="bc-page-band border-border border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-3 px-4 py-6 sm:px-8 lg:py-7">
          <div>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-3 h-7 w-64 max-w-full" />
          </div>
          <Skeleton className="h-4 w-28" />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-8 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-8">
          {/* Context rail */}
          <div className="space-y-5">
            <div className="rounded-md border border-border bg-card p-3.5 shadow-card">
              <Skeleton className="h-3 w-16" />
              <div className="mt-2 space-y-1.5 border-primary/40 border-l-2 pl-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <Skeleton className="mt-3 h-7 w-24 rounded-md" />
            </div>
            <div>
              <Skeleton className="h-3 w-24" />
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
            </div>
            <div className="space-y-2.5 border-border border-t pt-3.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>

          {/* Featured match + compact rows */}
          <div className="min-w-0">
            <Skeleton className="h-3 w-24" />
            <div className="mt-2 rounded-md border border-border bg-card p-4 shadow-card sm:p-5">
              <div className="flex items-start gap-3.5">
                <Skeleton className="size-12 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
              {/* Rationale panel keeps its blue chrome so the skeleton reads
                  as the same structure, not generic gray blocks. */}
              <div className="mt-3 rounded-md border border-primary/15 bg-primary/[0.04] p-3">
                <Skeleton className="h-3 w-32 bg-primary/20" />
                <div className="mt-2 space-y-1.5">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-5/6" />
                </div>
              </div>
              <div className="mt-3.5 flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-28 rounded-md" />
              </div>
            </div>

            <Skeleton className="mt-6 h-3 w-28" />
            <div className="mt-2 divide-y divide-border/70 rounded-md border border-border bg-card shadow-card">
              {['ask-row-a', 'ask-row-b', 'ask-row-c', 'ask-row-d'].map((id) => (
                <div key={id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                  <Skeleton className="size-9 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                  <Skeleton className="h-4 w-10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
