import { redirect } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { clearMembershipPreference } from '@/app/_lib/membership-cookie'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/wordmark'
import { memberEntryPath } from '@/lib/entry/routing'
import { selectedMembership } from '@/lib/membership/selection'
import { displayOrgName } from '@/lib/utils'

export default async function PendingApprovalPage() {
  const { context } = await loadMemberContext()
  const destination = memberEntryPath(context)
  if (destination !== '/pending') redirect(destination)

  const membership = selectedMembership(context)
  if (!membership) redirect('/select-circle')
  const orgName = displayOrgName(membership.organization.name)

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 py-10 sm:px-8 sm:py-14">
      <Wordmark />
      <section className="mt-20 space-y-5">
        <p className="text-kicker font-semibold uppercase tracking-hero text-muted-foreground">
          Approval pending
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Your {orgName} profile is ready.
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          A circle admin is reviewing your membership. Your setup is saved, and you can enter as
          soon as it is approved.
        </p>
        <form action={signOutFromPendingApproval}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </section>
    </main>
  )
}

async function signOutFromPendingApproval() {
  'use server'

  const { client } = await loadMemberContext()
  await client.auth.signOut()
  await clearMembershipPreference()
  redirect('/sign-in')
}
