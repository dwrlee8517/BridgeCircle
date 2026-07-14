import { loadMemberContext } from '@/app/_lib/load-member-context'
import { selectedMembership } from '@/lib/membership/selection'

export default async function HomePage() {
  const { context } = await loadMemberContext()
  const membership = selectedMembership(context)
  const name = membership?.profile.preferredName ?? membership?.profile.displayName
  const firstName = name?.split(/\s+/)[0] ?? null

  return (
    <div className="min-h-full bg-background">
      <section className="border-b border-border-subtle bg-surface-editorial text-surface-editorial-foreground">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-14">
          <p className="text-kicker font-bold uppercase tracking-kicker text-primary-on-dark">
            {membership?.organization.name ?? 'Your circle'}
          </p>
          <h1 className="mt-3 max-w-2xl font-heading text-display-md font-semibold leading-[1.12]">
            {firstName ? `Welcome, ${firstName}.` : 'Welcome to your circle.'}
          </h1>
          <p className="mt-3 max-w-xl text-body-lg leading-relaxed text-surface-editorial-muted">
            Your profile and circle access are ready. Help, Messages, People, and School will land
            here as each v2 domain is connected.
          </p>
        </div>
      </section>
    </div>
  )
}
