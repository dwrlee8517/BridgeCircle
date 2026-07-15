import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const SKELETON_ROWS = ['first', 'second', 'third', 'fourth', 'fifth'] as const

export function MessagesListSkeleton() {
  return (
    <div role="status" aria-label="Loading messages" className="grid gap-3 p-3.5">
      {SKELETON_ROWS.map((row) => (
        <div key={row} className="flex items-center gap-2.5">
          <Skeleton className="size-[42px] shrink-0 rounded-full" />
          <span className="grid flex-1 gap-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-2.5 w-4/5" />
          </span>
        </div>
      ))}
      <span className="sr-only">Loading messages</span>
    </div>
  )
}

export function MessagesListError({ onRetry }: { onRetry(): void }) {
  return (
    <div role="alert" className="px-5 py-10 text-center">
      <p className="text-caption font-bold text-foreground">Messages couldn’t load</p>
      <p className="mt-1.5 text-kicker leading-relaxed text-muted-foreground">
        Your conversations are still safe. Try loading them again.
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-3">
        Try again
      </Button>
    </div>
  )
}
