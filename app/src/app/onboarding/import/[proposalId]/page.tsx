import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { Wordmark } from '@/components/ui/wordmark'
import { createProfileImportRepository } from '@/db/repositories/profile-imports'
import { requireSession } from '@/lib/auth/session'
import { selectedMembership } from '@/lib/membership/selection'
import { ImportReviewFlow } from './review-flow'

export default async function ProfileImportReviewPage({
  params,
}: {
  params: Promise<{ proposalId: string }>
}) {
  await requireSession('/onboarding')
  const [{ proposalId }, { client, context }] = await Promise.all([params, loadMemberContext()])
  const membership = selectedMembership(context)
  if (!membership) redirect('/select-circle')
  const proposal = await createProfileImportRepository(client).get(
    membership.membershipId,
    proposalId,
  )
  if (!proposal) notFound()
  if (proposal.status !== 'pending') redirect('/onboarding?step=2')

  const sourceLabel = proposal.source === 'resume' ? 'résumé' : 'LinkedIn'
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
      <header className="flex items-center justify-between gap-4">
        <Link
          href="/onboarding?step=2"
          aria-label="BridgeCircle onboarding"
          className="inline-flex"
        >
          <Wordmark withIcon={false} textClassName="text-xl tracking-tight" />
        </Link>
        <Link
          href="/onboarding?step=2"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-text-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to fast fill
        </Link>
      </header>

      <section className="mt-10 max-w-2xl">
        <p className="text-kicker font-semibold tracking-hero text-text-secondary uppercase">
          Review import
        </p>
        <h1 className="font-heading mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Choose what joins your profile.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          We found these details from your {sourceLabel}. Keep, edit, or remove anything below.
          Nothing changes until you apply your choices.
        </p>
      </section>

      <div className="mt-8 rounded-[var(--radius-card-xl)] bg-surface-card-elevated p-5 shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)] sm:p-7">
        <ImportReviewFlow proposal={proposal} />
      </div>
    </main>
  )
}
