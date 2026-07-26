import { RouteStateCard } from '@/components/route-state-card'

export default function MemberNotFound() {
  return (
    <RouteStateCard
      kind="not-found"
      title="This isn’t here anymore."
      description="This link is old, or the page moved."
      actionLabel="← Back home"
      href="/"
    />
  )
}
