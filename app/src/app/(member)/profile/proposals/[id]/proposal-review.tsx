'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import type { ExtractedProfile } from '@/lib/resume/schemas'
import { ConfirmStep, type CurrentProfile } from '../../import/confirm-step'
import { type ApplyProposalState, applyProposalAction } from './actions'

type Props = {
  proposalId: string
  current: CurrentProfile
  proposed: ExtractedProfile
}

/**
 * Wraps the shared `ConfirmStep` with proposal-specific submit semantics:
 *   - Hidden field `proposalId` rides along on every submit.
 *   - "Decline" button submits a separate form with `intent=decline`.
 */
export function ProposalReview({ proposalId, current, proposed }: Props) {
  const [applyState, applyAction, applyPending] = useActionState<ApplyProposalState, FormData>(
    applyProposalAction,
    {},
  )

  function decline() {
    const fd = new FormData()
    fd.set('proposalId', proposalId)
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
      cancelHref="/profile/edit"
      hiddenFields={{ proposalId, intent: 'accept' }}
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
