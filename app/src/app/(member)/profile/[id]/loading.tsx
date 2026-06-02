import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Mirrors profile/[id]/page.tsx — single profile detail surface (density
// default, not cozy). Avatar + name header, then biography / career /
// education sections.
export default function ProfileDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8 lg:py-12">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            <Skeleton className="size-24 shrink-0 rounded-lg sm:size-28" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-10 w-2/3 sm:h-12" />
                <Skeleton className="h-5 w-1/2" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Skeleton className="h-11 w-40 rounded-lg" />
                <Skeleton className="h-11 w-32 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <ProfileSectionSkeleton lines={4} />
            <ProfileSectionSkeleton lines={3} />
            <ProfileSectionSkeleton lines={3} />
          </div>
          <aside className="space-y-4">
            <Card className="p-5 space-y-3">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </Card>
            <Card className="p-5 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-2/3" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </Card>
          </aside>
        </div>
      </section>
    </div>
  )
}

function ProfileSectionSkeleton({ lines }: { lines: number }) {
  const rows = Array.from({ length: lines }, (_, i) => `row-${i}`)
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="space-y-4">
        {rows.map((id) => (
          <div key={id} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
