'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { type DecideFormState, decideMembershipAction } from './actions'

const INITIAL: DecideFormState = {}

/**
 * Two-button row (Approve / Reject) for a single pending membership. Each
 * button is its own <form>, so the action gets `decision` as a hidden field
 * along with the membershipId. useActionState keeps the rendered state in sync
 * after the server action revalidates `/admin/approvals` (the row will simply
 * disappear from the queue on success).
 */
export function DecisionButtons({ membershipId }: { membershipId: string }) {
  const [stateApprove, approveAction, approving] = useActionState(decideMembershipAction, INITIAL)
  const [stateReject, rejectAction, rejecting] = useActionState(decideMembershipAction, INITIAL)

  const lastError = stateApprove.error ?? stateReject.error

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <form action={approveAction}>
          <input type="hidden" name="membershipId" value={membershipId} />
          <input type="hidden" name="decision" value="approve" />
          <Button type="submit" size="sm" disabled={approving || rejecting}>
            {approving ? 'Approving…' : 'Approve'}
          </Button>
        </form>
        <form action={rejectAction}>
          <input type="hidden" name="membershipId" value={membershipId} />
          <input type="hidden" name="decision" value="reject" />
          <Button type="submit" size="sm" variant="outline" disabled={approving || rejecting}>
            {rejecting ? 'Rejecting…' : 'Reject'}
          </Button>
        </form>
      </div>
      {lastError ? <p className="text-xs text-destructive">{lastError}</p> : null}
    </div>
  )
}
