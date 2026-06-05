import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function AskLoading() {
  return (
    <div className="density-cozy min-h-full bg-background">
      <section className="bc-page-band border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 lg:py-10">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-9 w-3/4 max-w-xl" />
          <Skeleton className="mt-3 h-5 w-2/3 max-w-lg" />
          <div className="bc-command-surface mt-6 p-[14px_16px]">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 shrink-0 rounded-md" />
              <Skeleton className="h-6 flex-1" />
              <Skeleton className="h-11 w-32 rounded-md" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-8 lg:py-8">
        <Card className="overflow-hidden rounded-md border-border bg-card p-0 shadow-card">
          <div className="border-b border-border bg-surface-panel/50 px-5 py-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-4 w-72 max-w-full" />
          </div>
          <div className="divide-y divide-border">
            {['ask-result-a', 'ask-result-b', 'ask-result-c'].map((id) => (
              <div key={id} className="grid gap-0 p-4 md:grid-cols-[minmax(0,1fr)_244px]">
                <div className="flex gap-3.5">
                  <Skeleton className="size-12 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="mt-3 h-20 w-full rounded-md" />
                  </div>
                </div>
                <div className="mt-4 flex flex-col justify-center gap-2 md:mt-0 md:pl-4">
                  <Skeleton className="h-9 w-full rounded-md" />
                  <Skeleton className="mx-auto h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}
