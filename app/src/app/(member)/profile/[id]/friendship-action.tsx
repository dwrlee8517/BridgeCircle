'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import {
  type FriendActionState,
  respondToFriendRequestAction,
  sendFriendRequestAction,
} from './friendship-actions'

export type FriendshipActionKind = 'friends' | 'pending_outgoing' | 'pending_incoming' | 'none'

/**
 * Renders the right friendship CTA based on the resolved state. The "send"
 * path uses a server action with useActionState so the button can show
 * pending + inline status without a full navigation.
 */
export function FriendshipAction({
  profileUserId,
  requestId,
  state,
}: {
  profileUserId: string
  requestId: string | null
  state: FriendshipActionKind
}) {
  const [result, dispatch, pending] = useActionState<FriendActionState | null, FormData>(
    sendFriendRequestAction,
    null,
  )

  if (state === 'friends') {
    return (
      <Button variant="outline" disabled className="w-full">
        Friends ✓
      </Button>
    )
  }

  if (state === 'pending_outgoing') {
    return <PendingOutgoingState />
  }

  if (state === 'pending_incoming') {
    return requestId ? <IncomingRequestState requestId={requestId} /> : null
  }

  // After a successful send, the page revalidates and re-renders with state =
  // 'pending_outgoing'. Until that round-trip completes, show optimistic copy.
  if (result?.ok) {
    return <PendingOutgoingState />
  }

  return (
    <div className="space-y-1 w-full">
      <form action={dispatch} className="w-full">
        <input type="hidden" name="receiverId" value={profileUserId} />
        <Button type="submit" variant="outline" disabled={pending} className="w-full">
          {pending ? 'Sending…' : 'Add friend'}
        </Button>
      </form>
      {result && !result.ok ? <p className="text-xs text-destructive">{result.message}</p> : null}
    </div>
  )
}

/**
 * Disabled state used both for the server-resolved pending request and the
 * optimistic post-send state before the page revalidates.
 */
function PendingOutgoingState() {
  return (
    <div className="space-y-1 w-full">
      <Button variant="outline" disabled className="w-full">
        Request sent
      </Button>
      <p className="text-xs text-muted-foreground text-center">Awaiting their reply.</p>
    </div>
  )
}

function IncomingRequestState({ requestId }: { requestId: string }) {
  const [acceptState, acceptAction, accepting] = useActionState<FriendActionState | null, FormData>(
    respondToFriendRequestAction,
    null,
  )
  const [declineState, declineAction, declining] = useActionState<
    FriendActionState | null,
    FormData
  >(respondToFriendRequestAction, null)
  const result = acceptState ?? declineState

  if (result?.ok) {
    return <p className="text-sm text-accent-sage">{result.message}</p>
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <form action={acceptAction}>
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="response" value="accept" />
          <Button type="submit" className="w-full" disabled={accepting || declining}>
            {accepting ? 'Accepting…' : 'Connect'}
          </Button>
        </form>
        <form action={declineAction}>
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="response" value="decline" />
          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={accepting || declining}
          >
            {declining ? 'Declining…' : 'Not now'}
          </Button>
        </form>
      </div>
      {result && !result.ok ? <p className="text-xs text-destructive">{result.message}</p> : null}
    </div>
  )
}
