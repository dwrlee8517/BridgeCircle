import { Skeleton } from '@/components/ui/skeleton'

export default function AskLoading() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <Skeleton className="h-4 w-28" />
        <div className="mt-6 rounded-md border border-border bg-card p-6 shadow-card">
          <div className="flex items-start gap-4">
            <Skeleton className="size-12 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-72 max-w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-32 w-full rounded-md" />
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
        </div>
      </section>
    </main>
  )
}
