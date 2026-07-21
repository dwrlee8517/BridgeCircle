'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FormMessage } from '@/components/ui/form-message'
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
  const [rejectOpen, setRejectOpen] = useState(false)
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
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogTrigger asChild>
            <Button type="button" size="sm" variant="outline" disabled={approving || rejecting}>
              Reject
            </Button>
          </DialogTrigger>
          <DialogContent showCloseButton={!rejecting}>
            <DialogHeader>
              <DialogTitle>Reject this membership?</DialogTitle>
              <DialogDescription>
                This person will not receive access to the circle. This decision cannot be undone
                from this screen.
              </DialogDescription>
            </DialogHeader>
            <form action={rejectAction} className="contents">
              <input type="hidden" name="membershipId" value={membershipId} />
              <input type="hidden" name="decision" value="reject" />
              {stateReject.error ? (
                <FormMessage tone="error">{stateReject.error}</FormMessage>
              ) : null}
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={rejecting}>
                    Keep pending
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={rejecting}
                  aria-busy={rejecting}
                >
                  {rejecting ? 'Rejecting…' : 'Reject membership'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {lastError && !rejectOpen ? (
        <FormMessage tone="error" className="text-xs">
          {lastError}
        </FormMessage>
      ) : null}
    </div>
  )
}
