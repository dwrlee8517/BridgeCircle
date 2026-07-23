import { Skeleton } from '@/components/ui/skeleton'

export default function MyCircleLoading() {
  return (
    <div className="min-h-full bg-[var(--surface-canvas)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[760px]">
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="mt-3 h-4 w-[520px] max-w-full rounded-full" />
        <div className="mt-4 overflow-hidden rounded-[var(--radius-card-xl)] bg-[var(--divider-row)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed loading placeholders
              key={index}
              className="flex items-center gap-4 bg-[var(--surface-card)] px-5 py-4"
            >
              <Skeleton className="size-[42px] shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-40 rounded-full" />
                <Skeleton className="mt-2 h-3 w-72 max-w-full rounded-full" />
              </div>
              <Skeleton className="hidden h-8 w-24 rounded-full sm:block" />
              <Skeleton className="hidden h-8 w-28 rounded-full sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
