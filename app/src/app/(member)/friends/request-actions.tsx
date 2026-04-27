'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { type FriendActionState, respondToFriendRequestAction } from './actions'

/**
 * Two side-by-side forms for accept / decline. Each is its own form so the
 * inline status message reflects which action the user took. The whole row
 * disables itself while either is pending.
 */
export function RequestActions({ requestId }: { requestId: string }) {
  const [acceptState, acceptDispatch, acceptPending] = useActionState<
    FriendActionState | null,
    FormData
  >(respondToFriendRequestAction, null)
  const [declineState, declineDispatch, declinePending] = useActionState<
    FriendActionState | null,
    FormData
  >(respondToFriendRequestAction, null)

  const pending = acceptPending || declinePending
  const message = acceptState?.message ?? declineState?.message ?? null
  const ok = acceptState?.ok ?? declineState?.ok ?? null

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <form action={acceptDispatch}>
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="response" value="accept" />
          <Button type="submit" size="sm" disabled={pending}>
            {acceptPending ? 'Accepting…' : 'Accept'}
          </Button>
        </form>
        <form action={declineDispatch}>
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="response" value="decline" />
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            {declinePending ? 'Declining…' : 'Decline'}
          </Button>
        </form>
      </div>
      {message ? (
        <p className={`text-xs ${ok ? 'text-emerald-600' : 'text-destructive'}`}>{message}</p>
      ) : null}
    </div>
  )
}
