import { redirect } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/wordmark'
import { requireSession } from '@/lib/auth/session'
import {
  memberDestination,
  selectableMemberships,
  selectedMembership,
} from '@/lib/membership/selection'
import { chooseCircleAction } from './actions'

type SearchParams = { error?: string }

export default async function SelectCirclePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireSession('/select-circle')
  const [{ error }, { context }] = await Promise.all([searchParams, loadMemberContext()])

  if (!context.requiresCircleChoice && selectedMembership(context)) {
    switch (memberDestination(context)) {
      case 'onboarding':
        return redirect('/onboarding')
      case 'pending-approval':
        return redirect('/pending')
      case 'cancel-delete':
        return redirect('/cancel-delete')
      case 'member-shell':
        return redirect('/')
    }
  }

  const memberships = selectableMemberships(context)
  if (memberships.length === 0) redirect('/sign-in?error=membership_unavailable')

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 py-10 sm:px-8 sm:py-14">
      <Wordmark />
      <section className="mt-16 space-y-6">
        <div className="space-y-2">
          <p className="text-kicker font-semibold uppercase tracking-hero text-muted-foreground">
            Choose a circle
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Where would you like to start?
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You belong to more than one circle. You can switch again from your account menu.
          </p>
        </div>

        {error ? (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            That circle is no longer available. Choose another one.
          </p>
        ) : null}

        <div className="space-y-3">
          {memberships.map((membership) => (
            <form action={chooseCircleAction} key={membership.membershipId}>
              <input type="hidden" name="membershipId" value={membership.membershipId} />
              <Button
                type="submit"
                variant="outline"
                className="h-auto w-full justify-between rounded-2xl px-5 py-4 text-left"
              >
                <span>
                  <span className="block font-bold">{membership.organization.name}</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {membership.status === 'pending' ? 'Approval pending' : 'Member'}
                  </span>
                </span>
                <span aria-hidden>→</span>
              </Button>
            </form>
          ))}
        </div>
      </section>
    </main>
  )
}
