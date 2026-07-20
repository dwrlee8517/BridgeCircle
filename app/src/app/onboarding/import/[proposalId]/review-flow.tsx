'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import type { ImportProposal } from '@/lib/onboarding/import-proposal'
import { applyProfileImportAction, declineProfileImportAction } from '../actions'
import { ConfirmStep } from '../confirm-step'

export function ImportReviewFlow({ proposal }: { proposal: ImportProposal }) {
  const [state, action, pending] = useActionState(applyProfileImportAction, {})
  return (
    <ConfirmStep
      profile={proposal.proposed}
      current={proposal.current}
      action={action}
      pending={pending}
      error={state.error}
      cancelHref="/onboarding?step=2"
      hiddenFields={{ proposalId: proposal.id }}
      headerBanner={null}
      newBadgeLabel={proposal.source === 'resume' ? 'from résumé' : 'from LinkedIn'}
      submitLabel="Apply and continue"
      extraActions={
        <Button
          type="submit"
          variant="ghost"
          formAction={declineProfileImportAction}
          disabled={pending}
        >
          Discard import
        </Button>
      }
    />
  )
}
