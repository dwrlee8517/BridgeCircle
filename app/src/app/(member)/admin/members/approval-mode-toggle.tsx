'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { type ApprovalModeState, setApprovalModeAction } from './actions'

const INITIAL: ApprovalModeState = {}

/**
 * Single-button toggle for organization-level approval mode. Sends the
 * opposite of the current state to the server action — flips on click.
 *
 * UI states:
 *   currently-on  → button shows "Turn off approval mode" (sends 'false')
 *   currently-off → button shows "Require admin approval"  (sends 'true')
 */
export function ApprovalModeToggle({ requiresApproval }: { requiresApproval: boolean }) {
  const [state, action, pending] = useActionState(setApprovalModeAction, INITIAL)

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="requiresApproval" value={requiresApproval ? 'false' : 'true'} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending
          ? 'Saving…'
          : requiresApproval
            ? 'Turn off approval mode'
            : 'Require admin approval'}
      </Button>
      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
    </form>
  )
}
