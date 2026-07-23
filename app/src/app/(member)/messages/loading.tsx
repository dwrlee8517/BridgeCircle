import { Skeleton } from '@/components/ui/skeleton'

const SKELETON_ROWS = ['first', 'second', 'third', 'fourth', 'fifth'] as const

export default function MessagesLoading() {
  return (
    <div
      role="status"
      aria-label="Loading Messages"
      className="flex h-[calc(100dvh_-_var(--topbar-height)_-_1px)] min-h-0 w-full overflow-hidden"
    >
      <div className="hidden w-[300px] shrink-0 border-r border-border-subtle bg-card p-3.5 md:grid md:content-start md:gap-4">
        <Skeleton className="h-10 w-full" />
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-6 w-12 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        {SKELETON_ROWS.map((row) => (
          <div key={row} className="flex items-center gap-2.5">
            <Skeleton className="size-[42px] rounded-full" />
            <span className="grid flex-1 gap-2">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2.5 w-4/5" />
            </span>
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col bg-[var(--surface-thread)] p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="mt-6 h-14 w-1/2 rounded-[18px]" />
        <Skeleton className="mt-3 ml-auto h-14 w-2/5 rounded-[18px]" />
      </div>
      <span className="sr-only">Loading Messages</span>
    </div>
  )
}
