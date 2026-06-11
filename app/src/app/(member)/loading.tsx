import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Loading fallback for member route navigation. Mirrors the current Home
// layout (dashboard-client.tsx) so the cross-fade is structural, not a
// jump from ink hero to light cream. The NetworkMotif panel is the
// only ink surface — everything else is light bc-page-band / card.
//
// Keep this in sync with dashboard-client.tsx. Routes that don't share the
// Home shape (Ask, People, Inbox, Thread) define their own loading.tsx so
// navigation lands on the right skeleton.
export default function MemberLoading() {
  return (
    <div className="density-cozy min-h-screen bg-background">
      <section className="bc-page-band border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-10">
          <div className="flex min-w-0 flex-col justify-between gap-6">
            <div className="space-y-3">
              <Skeleton className="h-3 w-48" />
              <div className="max-w-2xl space-y-2">
                <Skeleton className="h-9 w-3/4 sm:h-10 lg:h-12" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            </div>

            <div className="bc-command-surface p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Skeleton className="size-11 shrink-0 rounded-md" />
                  <Skeleton className="h-6 w-2/3" />
                </div>
                <Skeleton className="h-10 w-full rounded-md sm:w-36" />
              </div>
            </div>
          </div>

          <YourAsksRailSkeleton />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.7fr)]">
          <div className="space-y-8">
            <SectionHeaderSkeleton />
            <div className="space-y-4">
              {['m-a', 'm-b', 'm-c'].map((id) => (
                <CompactMatchSkeleton key={id} />
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <SectionHeaderSkeleton />
              <div className="grid gap-3">
                {['o-a', 'o-b', 'o-c'].map((id) => (
                  <HelpOpportunitySkeleton key={id} />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeaderSkeleton />
              <div className="grid gap-3">
                <SchoolPulseSkeleton />
                <SchoolPulseSkeleton />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function YourAsksRailSkeleton() {
  return (
    <aside className="flex h-fit flex-col gap-3.5 rounded-md border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="flex flex-col gap-2.5">
        {['ask-a', 'ask-b', 'ask-c'].map((id) => (
          <div
            key={id}
            className="flex items-start gap-2.5 border-b border-muted pb-2.5 last:border-0 last:pb-0"
          >
            <Skeleton className="mt-1.5 size-1.5 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

function SectionHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-8 w-32 rounded-md" />
    </div>
  )
}

// Mirrors HomePersonCard's grid footprint (Home renders HomePersonCard from
// dashboard-client.tsx, not MatchBriefCard). Keep this in step with that
// card's geometry when it changes.
function CompactMatchSkeleton() {
  return (
    <Card className="overflow-hidden rounded-md border border-border bg-card p-0 shadow-card">
      <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_244px]">
        <div className="relative overflow-hidden p-4 sm:p-5">
          <div className="flex items-start gap-3.5">
            <Skeleton className="size-12 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-7" />
                {/* Quick advice + Mentorship */}
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <div className="mt-3 rounded-md border border-primary/18 bg-primary/[0.04] p-3 shadow-card">
            <Skeleton className="h-3 w-24 bg-primary/20" />
            <Skeleton className="mt-2 h-3.5 w-11/12" />
          </div>
        </div>
        <div className="flex flex-col justify-center gap-2 border-t border-border bg-surface-panel/60 p-4 md:border-l md:border-t-0">
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="mx-auto h-3 w-20" />
        </div>
      </div>
    </Card>
  )
}

function HelpOpportunitySkeleton() {
  return (
    <div className="flex gap-4 rounded-md border border-border bg-card p-4 shadow-card">
      <Skeleton className="size-9 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="mt-1 h-4 w-28" />
      </div>
    </div>
  )
}

function SchoolPulseSkeleton() {
  return (
    <div className="flex gap-4 rounded-md border border-border bg-card p-4 shadow-card">
      <Skeleton className="size-11 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  )
}
