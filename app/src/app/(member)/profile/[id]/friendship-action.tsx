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
      <Button variant="outline" disabled>
        Friends ✓
      </Button>
    )
  }

  if (state === 'pending_outgoing') {
    return (
      <Button variant="outline" disabled>
        Request sent
      </Button>
    )
  }

  if (state === 'pending_incoming') {
    return (
      <Button asChild>
        <Link href="/inbox">Accept their request</Link>
      </Button>
    )
  }

  // After a successful send, the page revalidates and re-renders with state =
  // 'pending_outgoing'. Until that round-trip completes, show optimistic copy.
  if (result?.ok) {
    return (
      <Button variant="outline" disabled>
        Request sent
      </Button>
    )
  }

  return (
    <div className="space-y-1">
      <form action={dispatch}>
        <input type="hidden" name="receiverId" value={profileUserId} />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? 'Sending…' : 'Add friend'}
        </Button>
      </form>
      {result && !result.ok ? <p className="text-xs text-destructive">{result.message}</p> : null}
    </div>
  )
}
