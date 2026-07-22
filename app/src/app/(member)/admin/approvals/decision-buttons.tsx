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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { MembershipRejectionReason } from '@/lib/admin/contracts'
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
  const [reasonCode, setReasonCode] = useState<MembershipRejectionReason | ''>('')
  const [stateApprove, approveAction, approving] = useActionState(decideMembershipAction, INITIAL)
  const [stateReject, rejectAction, rejecting] = useActionState(decideMembershipAction, INITIAL)

  const lastError = stateApprove.error ?? stateReject.error
  const rejectDialogOpen = stateReject.ok ? false : rejectOpen

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
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectOpen}>
          <DialogTrigger asChild>
            <Button type="button" size="sm" variant="outline" disabled={approving || rejecting}>
              Reject
            </Button>
          </DialogTrigger>
          <DialogContent showCloseButton={!rejecting}>
            <DialogHeader>
              <DialogTitle>Reject this membership?</DialogTitle>
              <DialogDescription>
                This person will not receive access to the circle. Record the reason for other
                admins; these details stay private.
              </DialogDescription>
            </DialogHeader>
            <form action={rejectAction} className="space-y-4">
              <input type="hidden" name="membershipId" value={membershipId} />
              <input type="hidden" name="decision" value="reject" />
              <div className="space-y-2">
                <Label htmlFor={`rejection-reason-${membershipId}`}>Reason</Label>
                <Select
                  name="reasonCode"
                  value={reasonCode}
                  onValueChange={(value) => setReasonCode(value as MembershipRejectionReason)}
                  required
                  disabled={rejecting}
                >
                  <SelectTrigger id={`rejection-reason-${membershipId}`} className="w-full">
                    <SelectValue placeholder="Choose a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="could_not_verify">Couldn’t verify identity</SelectItem>
                    <SelectItem value="not_eligible">Not eligible for this circle</SelectItem>
                    <SelectItem value="duplicate_request">Duplicate request</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`rejection-note-${membershipId}`}>Private note (optional)</Label>
                <Textarea
                  id={`rejection-note-${membershipId}`}
                  name="privateNote"
                  rows={3}
                  maxLength={4_000}
                  disabled={rejecting}
                  placeholder="Add context another admin may need"
                />
                <p className="text-xs text-muted-foreground">Only admins can see this note.</p>
              </div>
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
                  disabled={rejecting || !reasonCode}
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
      {stateApprove.ok ? (
        <span className="sr-only" role="status">
          Membership approved.
        </span>
      ) : null}
      {stateReject.ok ? (
        <span className="sr-only" role="status">
          Membership rejected.
        </span>
      ) : null}
    </div>
  )
}
