import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Mirrors notifications/page.tsx — max-w-3xl list of notification rows
// inside a single divided card.
export default function NotificationsLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <Card>
        <CardContent className="p-0">
          <ul className="divide-y">
            {['n-a', 'n-b', 'n-c', 'n-d', 'n-e', 'n-f', 'n-g'].map((id) => (
              <li key={id}>
                <div className="flex items-start gap-3 px-4 py-3">
                  <Skeleton className="mt-0.5 size-4 shrink-0 rounded" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
