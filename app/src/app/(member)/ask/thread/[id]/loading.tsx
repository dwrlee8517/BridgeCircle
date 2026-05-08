import { Skeleton } from '@/components/ui/skeleton'

// Loading fallback for /ask/thread/[id]. Each thread fetches messages +
// participant profiles + ask metadata; on cold load it can hang for a
// noticeable beat without this skeleton.
export default function ThreadLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <Skeleton className="h-4 w-24" />
      <div className="mt-6 flex items-center gap-3">
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={i % 2 === 0 ? 'flex justify-start' : 'flex justify-end'}
          >
            <div className="max-w-[75%] space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className={i % 2 === 0 ? 'h-16 w-72' : 'h-12 w-56'} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t pt-6">
        <Skeleton className="h-24 w-full" />
        <div className="mt-3 flex justify-end">
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  )
}
