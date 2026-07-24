import { Skeleton } from '@/components/ui/skeleton'

export default function SchoolLoading() {
  return (
    <div className="min-h-full bg-surface-canvas px-4 py-6 sm:px-7 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-[1060px]">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="mt-3 h-9 w-80 max-w-full" />
        <Skeleton className="mt-2 h-4 w-[460px] max-w-full" />
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.85fr)]">
          <div className="space-y-4">
            <Skeleton className="h-[360px] w-full rounded-2xl" />
            <Skeleton className="h-56 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-80 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
