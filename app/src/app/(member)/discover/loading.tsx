import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Loading fallback for /discover. Matches page.tsx's hero + search-card +
// 3-column result grid. NL search round-trips through Haiku, so this is
// the most-needed skeleton in the app.
export default function DiscoverLoading() {
  return (
    <div>
      <section className="border-b bg-[linear-gradient(180deg,#fff_0%,#fafbfd_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-14">
          <Skeleton className="h-3 w-44" />
          <Skeleton className="mt-2 h-10 w-72" />
          <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-8">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-4 w-56" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="h-3 w-72" />
          </CardContent>
        </Card>

        <Skeleton className="h-4 w-40" />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 py-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
