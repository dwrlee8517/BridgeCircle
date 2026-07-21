import { RouteStateCard } from '@/components/route-state-card'

export default function HelpNotFound() {
  return (
    <RouteStateCard
      kind="not-found"
      title="This help request is not available"
      description="It may have closed, or it may not belong to your selected circle."
      actionLabel="Back to Help"
      href="/help"
    />
  )
}
