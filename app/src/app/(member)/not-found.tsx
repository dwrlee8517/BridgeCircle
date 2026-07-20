import { RouteStateCard } from '@/components/route-state-card'

export default function MemberNotFound() {
  return (
    <RouteStateCard
      kind="not-found"
      title="This isn’t here anymore."
      description="The link may be old, or the page may have moved. Nothing you did — things just move."
      actionLabel="← Back home"
      href="/"
    />
  )
}
