import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function FreshnessReviewCard({
  daysSinceLastReview = 999,
  staleAfterDays = 30,
}: {
  daysSinceLastReview?: number
  staleAfterDays?: number
} = {}) {
  if (daysSinceLastReview < staleAfterDays) return null
  return (
    <Card className="rounded-md border-border bg-card p-5 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/[0.08] text-primary">
          <Sparkles className="size-5" />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold leading-tight text-foreground">
            Keep your profile current so the right people can find you.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Review imported changes or confirm everything still looks right.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-md">
              <Link href="/profile/import">Review updates</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-md">
              <Link href="/profile/edit">Edit profile</Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
