import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { StatusBadge } from '@/components/ui/status-badge'
import { createHelpRepository } from '@/db/repositories/help'
import { selectedMembership } from '@/lib/membership/selection'
import { SettingsForm } from './settings-form'

export default async function HelperSettingsPage() {
  const { client, context } = await loadMemberContext()
  const membership = selectedMembership(context)
  const pref = membership
    ? await createHelpRepository(client).getHelperPreferences(membership.membershipId)
    : null

  if (!pref) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-sm text-muted-foreground">
          You need an active organization membership to set help preferences.
        </p>
      </div>
    )
  }

  return (
    // density-cozy: member-facing surface. Editorial header (kicker + heading)
    // over the reduced one-state form (ADR 0011 Phase 2).
    <div className="density-cozy mx-auto max-w-[720px] space-y-6 px-4 py-8 sm:px-8">
      <Link
        href="/help"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Help
      </Link>

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <p className="bc-section-kicker">Your availability</p>
          {pref.pausedAt ? (
            <StatusBadge tone="warn" dot>
              Paused while away
            </StatusBadge>
          ) : null}
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          How you&apos;d like to help
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          One switch — open to helping, or not — and the topics where classmates should find you.
          Status auto-expires after 14 days away.
        </p>
      </div>

      {pref.pausedAt ? (
        <p className="rounded-lg border border-accent-ochre/25 bg-accent-ochre/10 p-3 text-xs text-foreground">
          {pauseMessage(pref.pauseReason)}
        </p>
      ) : null}

      <SettingsForm
        key={[pref.openToHelp, pref.topics.join(',')].join('|')}
        defaults={{
          openToHelp: pref.openToHelp,
          topics: pref.topics.join(', '),
        }}
      />
    </div>
  )
}

function pauseMessage(reason: 'manual' | 'unresponsive' | 'admin' | null) {
  if (reason === 'admin') {
    return 'Your circle administrator paused matching. Contact them if you think this should change.'
  }
  if (reason === 'unresponsive') {
    return 'Matching paused after three direct asks closed without a response. Saving with availability on resumes it.'
  }
  return 'Matching is paused. Saving with availability on resumes it.'
}
