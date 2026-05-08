import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Loading fallback for /inbox. Inbox runs five parallel queries on every
// load (incoming asks, outgoing asks, threads, friend requests, DM
// threads) so the network wait is real even on warm caches.
export default function InboxLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <div className="mb-8 border-b pb-8">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-2 h-10 w-32" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="mb-6">
          <CardHeader>
            <Skeleton className="h-7 w-44" />
            <Skeleton className="mt-2 h-3 w-72" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="flex items-start gap-3 rounded-lg border bg-card p-4">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
