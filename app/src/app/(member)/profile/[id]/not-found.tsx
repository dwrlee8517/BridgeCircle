import { RouteStateCard } from '@/components/route-state-card'

export default function ProfileNotFound() {
  return (
    <RouteStateCard
      title="This profile isn’t here anymore"
      description="It may have been removed, or it may not be available in your circle."
      actionLabel="Back to People"
      href="/people"
    />
  )
}
