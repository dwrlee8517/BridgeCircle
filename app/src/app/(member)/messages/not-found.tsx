import { RouteStateCard } from '@/components/route-state-card'

export default function MessagesNotFound() {
  return (
    <RouteStateCard
      kind="not-found"
      title="This conversation is not available"
      description="It may have ended, or it may not belong to your selected circle."
      actionLabel="Back to Messages"
      href="/messages"
    />
  )
}
