import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Loading fallback for the member home page. Mirrors page.tsx's two-column
// layout (mentees/new alumni on the left, featured event/notifications on
// the right) so the shift on hydration is minimal.
export default function HomeLoading() {
  return (
    <div>
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0b1220_0%,#131b2e_50%,#1e293b_100%)] text-white">
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-20">
          <Skeleton className="h-3 w-56 bg-white/10" />
          <Skeleton className="mt-3 h-12 w-[28rem] max-w-full bg-white/10" />
          <Skeleton className="mt-2 h-12 w-[20rem] max-w-full bg-white/10" />
          <Skeleton className="mt-5 h-5 w-72 max-w-full bg-white/10" />
          <div className="mt-7 flex gap-3">
            <Skeleton className="h-11 w-44 bg-white/10" />
            <Skeleton className="h-11 w-44 bg-white/10" />
          </div>
          <div className="mt-14 grid grid-cols-2 gap-6 border-t border-white/10 pt-7 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton, never reordered
              <div key={i} className="space-y-2">
                <Skeleton className="h-9 w-16 bg-white/10" />
                <Skeleton className="h-3 w-24 bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-12 lg:col-span-2">
            <SectionSkeleton rows={2} />
            <SectionSkeleton rows={3} />
          </div>
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-3 py-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
            <SectionSkeleton rows={3} compact />
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionSkeleton({ rows, compact = false }: { rows: number; compact?: boolean }) {
  return (
    <div>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2 h-7 w-56" />
      <div className={compact ? 'mt-4 space-y-2' : 'mt-5 space-y-4'}>
        {Array.from({ length: rows }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton, never reordered
          <Card key={i}>
            <CardContent className="flex items-center gap-3 py-4">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
