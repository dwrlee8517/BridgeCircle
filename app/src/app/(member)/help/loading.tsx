import { Skeleton } from '@/components/ui/skeleton'

export default function HelpLoading() {
  return (
    <main className="min-h-screen bg-background">
      <section
        className="border-b border-border"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--card) 60%, transparent), transparent), radial-gradient(circle at 18% 0%, color-mix(in srgb, var(--action-offer) 7%, transparent), transparent 38%), radial-gradient(circle at 82% 100%, color-mix(in srgb, var(--accent-ochre) 5%, transparent), transparent 40%), var(--background)',
        }}
      >
        <div className="mx-auto flex max-w-7xl items-start gap-10 px-4 py-5.5 detail:px-8 detail:pt-6 detail:pb-5">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-2 rounded-full" />
                <Skeleton className="h-7 w-80 max-w-full" />
              </div>
              <Skeleton className="ml-[18px] h-4 w-72 max-w-[calc(100%-18px)]" />
            </div>
            <div className="flex flex-col gap-3 rounded-md border border-border bg-card px-4 py-3.5 shadow-card-hover detail:flex-row detail:items-center detail:gap-5 detail:px-4.5 py-3.5">
              <div className="flex items-center gap-3.5 detail:gap-5">
                <AvailabilitySkeleton />
                <div className="h-9 w-px bg-muted" />
                <AvailabilitySkeleton />
              </div>
              <div className="h-px w-full bg-muted detail:hidden" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-36" />
                <div className="hidden flex-wrap gap-1 detail:flex">
                  <Skeleton className="h-5 w-28 rounded-sm" />
                  <Skeleton className="h-5 w-24 rounded-sm" />
                  <Skeleton className="h-5 w-32 rounded-sm" />
                </div>
              </div>
              <Skeleton className="h-8 w-full rounded-md detail:w-32" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <div className="mb-[18px] flex flex-col gap-4 detail:flex-row detail:items-end detail:justify-between detail:gap-6">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-9 w-full rounded-md detail:max-w-[360px]" />
        </div>
        <div className="flex items-end gap-1 border-b border-muted">
          <Skeleton className="h-11 w-28 rounded-none" />
          <Skeleton className="h-11 w-44 rounded-none" />
        </div>
        <div className="grid gap-6 pt-[22px] detail:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex flex-col gap-4.5">
            <div className="rounded-md border border-muted bg-card px-6.5 py-6 shadow-card">
              <div className="flex items-center gap-4">
                <Skeleton className="size-[52px] rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-44" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-[18px] h-6 w-11/12" />
              <Skeleton className="mt-2 h-6 w-2/3" />
              <Skeleton className="mt-3.5 h-4 w-72 max-w-full" />
              <div className="mt-5 flex gap-2.5">
                <Skeleton className="h-10 w-32 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-3 pt-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex flex-col gap-2.5">
              {['help-alt-a', 'help-alt-b', 'help-alt-c'].map((id) => (
                <AltPickSkeleton key={id} />
              ))}
            </div>
          </div>
          <aside className="rounded-md border border-muted bg-card px-5 py-4.5">
            <Skeleton className="h-3 w-28" />
            <div className="mt-4 flex items-baseline gap-2">
              <Skeleton className="h-9 w-8" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

function AvailabilitySkeleton() {
  return (
    <div className="flex items-center gap-2.5">
      <Skeleton className="size-3 rounded-full" />
      <div className="space-y-1.5">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

function AltPickSkeleton() {
  return (
    <div className="grid gap-3 rounded-md border border-muted bg-card px-4 py-3.5 detail:grid-cols-[36px_minmax(0,1fr)_auto] detail:items-start detail:gap-x-3">
      <Skeleton className="size-9 rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-52 max-w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
      <div className="flex gap-2 detail:flex-col detail:items-end">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-8 w-14 rounded-md" />
      </div>
    </div>
  )
}
