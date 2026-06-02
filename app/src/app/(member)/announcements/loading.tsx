import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Mirrors announcements/page.tsx — simple max-w-3xl list of cards.
export default function AnnouncementsLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>

      {['a-a', 'a-b', 'a-c', 'a-d'].map((id) => (
        <Card key={id}>
          <CardHeader>
            <div className="flex items-baseline justify-between gap-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-20 shrink-0" />
            </div>
            <Skeleton className="mt-2 h-3 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
