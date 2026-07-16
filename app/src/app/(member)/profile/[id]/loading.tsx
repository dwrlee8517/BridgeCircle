import { Skeleton } from '@/components/ui/skeleton'

export default function ProfileDetailLoading() {
  return (
    <div className="min-h-full bg-[var(--surface-canvas)] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <article className="mx-auto max-w-[1180px] overflow-hidden rounded-[var(--radius-card-xl)] bg-[var(--surface-card)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
        <header className="flex flex-col gap-5 px-5 py-6 sm:flex-row sm:px-7 lg:px-8.5 lg:py-7.5">
          <Skeleton className="size-20 shrink-0 rounded-full sm:size-[84px]" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-8 w-52 max-w-full rounded-lg" />
            <Skeleton className="mt-3 h-4 w-96 max-w-full rounded-full" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
        </header>
        <div className="mx-5 h-px bg-[var(--divider-row)] sm:mx-7 lg:mx-8.5" />
        <div className="grid gap-8 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8.5 lg:py-7">
          <div className="space-y-8">
            {Array.from({ length: 4 }, (_, section) => (
              <section
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed loading placeholders
                key={section}
              >
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="mt-4 h-4 w-full rounded-full" />
                <Skeleton className="mt-2 h-4 w-4/5 rounded-full" />
              </section>
            ))}
          </div>
          <aside className="space-y-3 border-t border-[var(--divider-row)] pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-7">
            <Skeleton className="h-28 w-full rounded-[13px]" />
            <Skeleton className="h-20 w-full rounded-[13px]" />
          </aside>
        </div>
      </article>
    </div>
  )
}
