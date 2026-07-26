import { RouteStateCard } from '@/components/route-state-card'

export default function HelpNotFound() {
  return (
    <RouteStateCard
      kind="not-found"
      title="This help request is not available"
      description="It closed, or it isn’t in your selected circle."
      actionLabel="Back to Help"
      href="/help"
    />
  )
}
