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
import { type InviteRowActionState, resendInviteAction, revokeInviteAction } from './actions'

const INITIAL: InviteRowActionState = {}

export function InviteRowActions({ inviteId, email }: { inviteId: string; email: string }) {
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [resendState, resendAction, resending] = useActionState(resendInviteAction, INITIAL)
  const [revokeState, revokeAction, revoking] = useActionState(revokeInviteAction, INITIAL)
  const busy = resending || revoking

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex justify-end gap-1">
        <form action={resendAction}>
          <input type="hidden" name="inviteId" value={inviteId} />
          <Button type="submit" size="xs" variant="ghost" disabled={busy} aria-busy={resending}>
            {resending ? 'Resending…' : 'Resend'}
          </Button>
        </form>
        <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              className="text-state-danger hover:bg-danger-tint hover:text-state-danger"
              disabled={busy}
            >
              Revoke
            </Button>
          </DialogTrigger>
          <DialogContent showCloseButton={!revoking}>
            <DialogHeader>
              <DialogTitle>Revoke this invitation?</DialogTitle>
              <DialogDescription>
                {email} will no longer be able to use this join link. You can send a new invitation
                later.
              </DialogDescription>
            </DialogHeader>
            <form action={revokeAction} className="contents">
              <input type="hidden" name="inviteId" value={inviteId} />
              {revokeState.error ? (
                <FormMessage tone="error">{revokeState.error}</FormMessage>
              ) : null}
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={revoking}>
                    Keep invitation
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={revoking}
                  aria-busy={revoking}
                >
                  {revoking ? 'Revoking…' : 'Revoke invitation'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {resendState.error ? <FormMessage tone="error">{resendState.error}</FormMessage> : null}
      {resendState.success === 'resent' ? (
        <FormMessage tone="success">Invite resent.</FormMessage>
      ) : null}
    </div>
  )
}
