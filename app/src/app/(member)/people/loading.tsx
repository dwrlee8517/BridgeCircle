import { Skeleton } from '@/components/ui/skeleton'

export default function PeopleLoading() {
  return (
    <div className="min-h-full bg-[var(--surface-canvas)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1180px]">
        <Skeleton className="h-4 w-40 rounded-full" />
        <Skeleton className="mt-3 h-9 w-80 max-w-full rounded-lg" />
        <Skeleton className="mt-5 h-[60px] w-full rounded-[var(--radius-large)]" />
        <div className="mt-3.5 flex flex-wrap gap-2.5">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="mt-3.5 overflow-hidden rounded-[var(--radius-card-xl)] bg-[var(--divider-row)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed loading placeholders
              key={index}
              className="flex items-center gap-3.5 bg-[var(--surface-card)] px-5.5 py-3.5"
            >
              <Skeleton className="size-[46px] shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-44 rounded-full" />
                <Skeleton className="mt-2 h-3 w-80 max-w-full rounded-full" />
                <div className="mt-2 flex gap-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-28 rounded-full" />
                </div>
              </div>
              <Skeleton className="hidden h-8 w-24 rounded-full sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
