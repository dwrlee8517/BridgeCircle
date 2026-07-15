'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import type { ExtractedProfile } from '@/lib/resume/schemas'
import { ConfirmStep, type CurrentProfile } from '../../onboarding/import/confirm-step'
import { type ApplyTokenProposalState, applyTokenProposalAction } from './actions'

type Props = {
  proposalId: string
  token: string
  current: CurrentProfile
  proposed: ExtractedProfile
}

/**
 * Token-authed wrapper around ConfirmStep. Identical to the session-authed
 * proposal-review.tsx except it carries the one-time token in hidden form
 * fields instead of relying on session cookies.
 */
export function TokenProposalReview({ proposalId, token, current, proposed }: Props) {
  const [applyState, applyAction, applyPending] = useActionState<ApplyTokenProposalState, FormData>(
    applyTokenProposalAction,
    {},
  )

  function decline() {
    const fd = new FormData()
    fd.set('proposalId', proposalId)
    fd.set('token', token)
    fd.set('intent', 'decline')
    applyAction(fd)
  }

  return (
    <ConfirmStep
      profile={proposed}
      current={current}
      action={applyAction}
      pending={applyPending}
      error={applyState.error}
      cancelHref={`/proposals/${proposalId}?token=${encodeURIComponent(token)}`}
      hiddenFields={{ proposalId, token, intent: 'accept' }}
      headerBanner={null}
      newBadgeLabel="from LinkedIn"
      submitLabel="Apply selected"
      extraActions={
        <Button
          type="button"
          variant="ghost"
          onClick={decline}
          disabled={applyPending}
          className="text-muted-foreground"
        >
          Decline all
        </Button>
      }
    />
  )
}
