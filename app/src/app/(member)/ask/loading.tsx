import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MATCH_AVATAR_BOX, MATCH_GRID, MATCH_RAIL } from '../help-network-ui'

export default function AskLoading() {
  return (
    <div className="density-cozy min-h-full bg-background">
      <section className="bc-page-band border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 lg:py-10">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-9 w-3/4 max-w-xl" />
          <Skeleton className="mt-3 h-5 w-2/3 max-w-lg" />
          <div className="bc-command-surface mt-6 px-4 py-3.5">
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
            {/* Mirrors MatchBriefCard's list-row geometry via the shared
                constants — change the card, and this follows. */}
            {['ask-result-a', 'ask-result-b', 'ask-result-c'].map((id) => (
              <div key={id} className={MATCH_GRID}>
                <div className="flex gap-3.5 p-4 sm:p-5">
                  <Skeleton className={`${MATCH_AVATAR_BOX} shrink-0 rounded-md`} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="mt-3 h-20 w-full rounded-md" />
                  </div>
                </div>
                <div className={MATCH_RAIL}>
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
