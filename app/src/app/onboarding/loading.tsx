import { Skeleton } from '@/components/ui/skeleton'

export default function OnboardingLoading() {
  return (
    <main
      className="min-h-dvh bg-[var(--surface-page)] px-4 py-8 sm:px-6"
      role="status"
      aria-label="Loading setup"
    >
      <div className="mx-auto grid w-full max-w-[980px] gap-5">
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-9 w-[420px] max-w-[85%]" />
        <Skeleton className="h-4 w-[580px] max-w-[95%] rounded-full" />
        <Skeleton className="mt-2 h-[420px] rounded-[var(--radius-card-xl)]" />
      </div>
    </main>
  )
}
