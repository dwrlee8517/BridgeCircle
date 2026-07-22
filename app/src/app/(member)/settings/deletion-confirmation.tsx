'use client'

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
import { FormSubmitButton } from '@/components/ui/form-submit-button'
import { scheduleDeletionAction } from './actions'

export function DeletionConfirmation() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-[var(--state-danger-text)]">
          Delete…
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule account deletion?</DialogTitle>
          <DialogDescription className="leading-relaxed">
            Your profile will stop appearing and BridgeCircle will schedule your account data for
            deletion in seven days. You can restore access from the cancellation page any time
            before finalization.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Keep my account</Button>
          </DialogClose>
          <form action={scheduleDeletionAction}>
            <FormSubmitButton variant="destructive" pendingLabel="Scheduling…">
              Schedule deletion
            </FormSubmitButton>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
