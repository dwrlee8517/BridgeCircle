import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function JoinLoading() {
  return (
    <Card className="shadow-card-hover" role="status" aria-label="Checking invitation">
      <CardHeader className="space-y-3 pb-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-4/5 rounded-full" />
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </CardContent>
    </Card>
  )
}
