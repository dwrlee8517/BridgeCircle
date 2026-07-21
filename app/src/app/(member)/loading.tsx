import { Skeleton } from '@/components/ui/skeleton'

/** Home owns the member-root loading boundary; child domains provide theirs. */
export default function MemberLoading() {
  return (
    <div className="min-h-full bg-[var(--surface-canvas)] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <p role="status" className="sr-only">
        Loading your BridgeCircle home.
      </p>
      <div className="mx-auto grid w-full max-w-[1020px] gap-5" aria-hidden>
        <div>
          <Skeleton className="h-8 w-72 max-w-[72%] rounded-[9px]" />
          <Skeleton className="mt-2 h-3.5 w-[420px] max-w-[82%] rounded-full" />
        </div>

        <section className="grid gap-2">
          <Skeleton className="h-3.5 w-44 rounded-full" />
          <Skeleton className="h-[184px] rounded-[var(--radius-card-xl)]" />
        </section>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,1fr)]">
          <div className="grid gap-4">
            <Skeleton className="h-[126px] rounded-[var(--radius-card-xl)]" />
            <Skeleton className="h-[156px] rounded-[var(--radius-card-xl)]" />
            <Skeleton className="h-[172px] rounded-[var(--radius-card-xl)]" />
          </div>
          <div className="grid gap-4">
            <Skeleton className="h-[230px] rounded-[var(--radius-card-xl)]" />
          </div>
        </div>
      </div>
    </div>
  )
}
