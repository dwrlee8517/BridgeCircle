'use client'

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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type CancelEventFormState, cancelEventAction, deleteEventAction } from './actions'

const CANCEL_INITIAL: CancelEventFormState = {}
const DELETE_INITIAL = {} as { error?: string }

/**
 * Two destructive actions on the event edit page:
 *   - Cancel event: keeps a visible record and queues durable in-app notices.
 *   - Delete event: allowed only while the event has no responses.
 *
 * Each has its own confirmation dialog so the admin can't fat-finger one
 * for the other.
 */
export function CancelDeleteButtons({
  eventId,
  goingCount,
  waitlistCount,
  isCanceled,
}: {
  eventId: string
  goingCount: number
  waitlistCount: number
  isCanceled: boolean
}) {
  const [cancelOpen, setCancelOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelEventAction,
    CANCEL_INITIAL,
  )
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteEventAction,
    DELETE_INITIAL,
  )

  // Close cancel dialog on success.
  if (cancelState.ok && cancelOpen) setCancelOpen(false)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isCanceled ? (
        <Button variant="outline" onClick={() => setCancelOpen(true)}>
          Cancel event
        </Button>
      ) : (
        <span className="text-sm text-muted-foreground italic">This event is canceled.</span>
      )}
      <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
        Delete event
      </Button>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this event?</DialogTitle>
            <DialogDescription>
              The event will stay available as a cancelled record. We&apos;ll notify{' '}
              {goingCount + waitlistCount === 0
                ? 'no one (no RSVPs yet)'
                : `${goingCount} going${
                    waitlistCount > 0 ? ` + ${waitlistCount} waitlisted` : ''
                  }`}{' '}
              in the app with the reason below.
            </DialogDescription>
          </DialogHeader>
          <form action={cancelAction} className="space-y-4">
            <input type="hidden" name="eventId" value={eventId} />
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Reason (optional, shown to members)</Label>
              <Textarea
                id="cancel-reason"
                name="reason"
                rows={3}
                placeholder="e.g. venue had to be rebooked"
              />
            </div>
            {cancelState.error ? (
              <p className="text-sm text-destructive">{cancelState.error}</p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCancelOpen(false)}
                disabled={cancelPending}
              >
                Keep event
              </Button>
              <Button type="submit" variant="destructive" disabled={cancelPending}>
                {cancelPending ? 'Canceling…' : 'Cancel event'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete this event permanently?</DialogTitle>
            <DialogDescription>
              This is irreversible and only works before anyone responds. Use it for a typo or
              mistake event. Cancel a real event so members keep a clear record.
            </DialogDescription>
          </DialogHeader>
          <form action={deleteAction} className="space-y-4">
            <input type="hidden" name="eventId" value={eventId} />
            {deleteState.error ? (
              <p className="text-sm text-destructive">{deleteState.error}</p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteOpen(false)}
                disabled={deletePending}
              >
                Keep event
              </Button>
              <Button type="submit" variant="destructive" disabled={deletePending}>
                {deletePending ? 'Deleting…' : 'Delete event'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
