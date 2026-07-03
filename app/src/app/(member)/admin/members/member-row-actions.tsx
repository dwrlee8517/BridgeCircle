'use client'

import { MoreHorizontal } from 'lucide-react'
import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  type AdminMemberActionState,
  cancelDeletionAction,
  deactivateMemberAction,
  finalizeAccountAction,
  reactivateMemberAction,
  scheduleDeletionAction,
} from './actions'

const INITIAL: AdminMemberActionState = {}

type RowProps = {
  membershipId: string
  userId: string
  status: 'active' | 'pending' | 'rejected' | 'revoked' | 'self_deactivated'
  memberName: string | null
  memberEmail: string
  deletionScheduledFor: string | null
}

type DialogKind =
  | null
  | 'deactivate'
  | 'reactivate'
  | 'schedule-deletion'
  | 'cancel-deletion'
  | 'finalize'

/**
 * Per-row admin actions dropdown + the dialogs each menu item opens. The
 * available actions depend on the combined state (status + deletion schedule):
 *
 *   active                            → Deactivate, Schedule deletion
 *   revoked / self_deactivated        → Reactivate, Schedule deletion
 *   any with deletion scheduled       → Cancel deletion, Finalize now
 *   pending / rejected                → no actions (use approval queue)
 */
export function MemberRowActions(props: RowProps) {
  const [open, setOpen] = useState<DialogKind>(null)

  const isPendingDeletion = !!props.deletionScheduledFor
  const isTerminal = props.status === 'pending' || props.status === 'rejected'

  if (isTerminal) return null

  const subject = props.memberName ?? props.memberEmail

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" aria-label={`Actions for ${subject}`}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isPendingDeletion ? (
            <>
              <DropdownMenuItem onSelect={() => setOpen('cancel-deletion')}>
                Cancel scheduled deletion
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setOpen('finalize')}
                className="text-destructive focus:text-destructive"
              >
                Finalize now
              </DropdownMenuItem>
            </>
          ) : (
            <>
              {props.status === 'active' ? (
                <DropdownMenuItem onSelect={() => setOpen('deactivate')}>
                  Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => setOpen('reactivate')}>
                  Reactivate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setOpen('schedule-deletion')}
                className="text-destructive focus:text-destructive"
              >
                Delete account…
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeactivateDialog
        open={open === 'deactivate'}
        onClose={() => setOpen(null)}
        membershipId={props.membershipId}
        subject={subject}
      />
      <ReactivateDialog
        open={open === 'reactivate'}
        onClose={() => setOpen(null)}
        membershipId={props.membershipId}
        subject={subject}
      />
      <ScheduleDeletionDialog
        open={open === 'schedule-deletion'}
        onClose={() => setOpen(null)}
        userId={props.userId}
        subject={subject}
      />
      <CancelDeletionDialog
        open={open === 'cancel-deletion'}
        onClose={() => setOpen(null)}
        userId={props.userId}
        subject={subject}
      />
      <FinalizeDialog
        open={open === 'finalize'}
        onClose={() => setOpen(null)}
        userId={props.userId}
        subject={subject}
      />
    </>
  )
}

// -----------------------------------------------------------------------------
// Dialog implementations
// -----------------------------------------------------------------------------

function DeactivateDialog({
  open,
  onClose,
  membershipId,
  subject,
}: {
  open: boolean
  onClose: () => void
  membershipId: string
  subject: string
}) {
  const [state, action, pending] = useActionState(deactivateMemberAction, INITIAL)
  // Close on success.
  if (state.ok && open) onClose()

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate {subject}?</DialogTitle>
          <DialogDescription>
            They&apos;ll lose access to the directory, asks, and messaging until reactivated. The
            reason below is included in the email they receive.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="membershipId" value={membershipId} />
          <div className="space-y-2">
            <Label htmlFor="deactivate-reason">Reason (visible to the member)</Label>
            <Textarea
              id="deactivate-reason"
              name="reason"
              required
              rows={4}
              placeholder="e.g. unable to verify alumni status from invite list"
            />
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Deactivating…' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ReactivateDialog({
  open,
  onClose,
  membershipId,
  subject,
}: {
  open: boolean
  onClose: () => void
  membershipId: string
  subject: string
}) {
  const [state, action, pending] = useActionState(reactivateMemberAction, INITIAL)
  if (state.ok && open) onClose()

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reactivate {subject}?</DialogTitle>
          <DialogDescription>
            They&apos;ll regain full access. A welcome-back email will be sent.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="membershipId" value={membershipId} />
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Reactivating…' : 'Reactivate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ScheduleDeletionDialog({
  open,
  onClose,
  userId,
  subject,
}: {
  open: boolean
  onClose: () => void
  userId: string
  subject: string
}) {
  const [state, action, pending] = useActionState(scheduleDeletionAction, INITIAL)
  if (state.ok && open) onClose()

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete {subject}&apos;s account?</DialogTitle>
          <DialogDescription>
            This schedules permanent deletion in 7 days. They&apos;ll be locked out immediately and
            their profile is hidden. You can cancel any time before finalization. After 7 days,
            their profile is tombstoned (data wiped, messages they sent become &quot;Former
            member&quot;). The reason below is included in their email.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="userId" value={userId} />
          <div className="space-y-2">
            <Label htmlFor="delete-reason">Reason (visible to the member)</Label>
            <Textarea
              id="delete-reason"
              name="reason"
              required
              rows={4}
              placeholder="e.g. repeated harassment of other members"
            />
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? 'Scheduling…' : 'Schedule deletion'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CancelDeletionDialog({
  open,
  onClose,
  userId,
  subject,
}: {
  open: boolean
  onClose: () => void
  userId: string
  subject: string
}) {
  const [state, action, pending] = useActionState(cancelDeletionAction, INITIAL)
  if (state.ok && open) onClose()

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel deletion for {subject}?</DialogTitle>
          <DialogDescription>
            Restores their access and unbans their sign-in. Memberships go back to active.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="userId" value={userId} />
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Keep schedule
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Canceling…' : 'Cancel deletion'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FinalizeDialog({
  open,
  onClose,
  userId,
  subject,
}: {
  open: boolean
  onClose: () => void
  userId: string
  subject: string
}) {
  const [state, action, pending] = useActionState(finalizeAccountAction, INITIAL)
  if (state.ok && open) onClose()

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">Finalize deletion of {subject}?</DialogTitle>
          <DialogDescription>
            This is irreversible. Their profile data (name, employer, links) is wiped, messages they
            sent become &quot;Former member&quot;, and their account is permanently banned. Backups
            are the only path to recovery after this point.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="userId" value={userId} />
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? 'Finalizing…' : 'Finalize deletion'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
