import { RouteStateCard } from '@/components/route-state-card'

export default function ProfileNotFound() {
  return (
    <RouteStateCard
      title="This profile isn’t available"
      description="It was removed, or it isn’t in your circle."
      actionLabel="Back to People"
      href="/people"
    />
  )
}
