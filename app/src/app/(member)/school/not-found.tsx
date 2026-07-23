import { RouteStateCard } from '@/components/route-state-card'

export default function SchoolNotFound() {
  return (
    <RouteStateCard
      kind="not-found"
      title="This isn’t here anymore."
      description="It may have moved, or it may not be available in your circle."
      actionLabel="← Back to School"
      href="/school"
    />
  )
}
