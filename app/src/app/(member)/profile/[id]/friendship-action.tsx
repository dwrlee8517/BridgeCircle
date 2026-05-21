'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { type FriendActionState, sendFriendRequestAction } from '../../inbox/friendship-actions'

export type FriendshipActionKind = 'friends' | 'pending_outgoing' | 'pending_incoming' | 'none'

/**
 * Renders the right friendship CTA based on the resolved state. The "send"
 * path uses a server action with useActionState so the button can show
 * pending + inline status without a full navigation.
 */
export function FriendshipAction({
  profileUserId,
  state,
}: {
  profileUserId: string
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
    return (
      <Button asChild className="w-full">
        <Link href="/inbox">Accept their request</Link>
      </Button>
    )
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
 * Disabled "Request sent" button + a one-line pointer to /inbox so the
 * user knows where to track outgoing requests. Used both for the
 * server-resolved `pending_outgoing` state and the optimistic post-send
 * state before the page revalidates.
 */
function PendingOutgoingState() {
  return (
    <div className="space-y-1 w-full">
      <Button variant="outline" disabled className="w-full">
        Request sent
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Awaiting their reply — track in your{' '}
        <Link href="/inbox" className="underline hover:text-foreground">
          inbox
        </Link>
        .
      </p>
    </div>
  )
}
