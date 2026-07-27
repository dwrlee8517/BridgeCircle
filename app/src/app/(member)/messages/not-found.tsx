import { RouteStateCard } from '@/components/route-state-card'

export default function MessagesNotFound() {
  return (
    <RouteStateCard
      kind="not-found"
      title="This conversation is not available"
      description="It ended, or it isn’t in your selected circle."
      actionLabel="Back to Messages"
      href="/messages"
    />
  )
}
