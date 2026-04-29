'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  type SelfDeactivateState,
  type SelfDeleteState,
  scheduleSelfDeleteAction,
  selfDeactivateAction,
} from './actions'

const DEACTIVATE_INITIAL: SelfDeactivateState = {}
const DELETE_INITIAL: SelfDeleteState = {}

const REASON_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'no_longer_relevant', label: 'No longer relevant to me' },
  { value: 'privacy_concerns', label: 'Privacy concerns' },
  { value: 'too_many_emails', label: 'Too many emails' },
  { value: 'didnt_find_value', label: "Didn't find value" },
  { value: 'other', label: 'Other' },
]

/**
 * Danger zone on /profile/edit. Two actions:
 *   1. Deactivate (silent, no dialog) — pauses, reversible at any time
 *      by signing back in.
 *   2. Delete account (red) — two-step dialog: warning → reason → submit.
 *      Schedules a 30-day grace; user lands on /cancel-delete to confirm or
 *      change their mind.
 */
export function DangerZone() {
  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Danger zone</CardTitle>
        <CardDescription>
          Pause your account if you need a break, or delete it permanently. Both can be reversed
          while you're in the grace window.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DeactivateRow />
        <hr className="border-dashed" />
        <DeleteRow />
      </CardContent>
    </Card>
  )
}

function DeactivateRow() {
  const [state, action, pending] = useActionState(selfDeactivateAction, DEACTIVATE_INITIAL)

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm">
        <div className="font-medium">Deactivate my account</div>
        <p className="text-muted-foreground">
          Pause access. Your profile is hidden from other members. Sign back in any time to
          reactivate.
        </p>
      </div>
      <form action={action}>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? 'Deactivating…' : 'Deactivate'}
        </Button>
      </form>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </div>
  )
}

function DeleteRow() {
  // Two-stage dialog: confirm → reason → submit.
  const [stage, setStage] = useState<'closed' | 'confirm' | 'reason'>('closed')
  const [state, action, pending] = useActionState(scheduleSelfDeleteAction, DELETE_INITIAL)

  // Close on success (action redirects, but state.ok is also a fallback).
  if (state.ok && stage !== 'closed') setStage('closed')

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm">
        <div className="font-medium text-destructive">Delete my account</div>
        <p className="text-muted-foreground">
          Schedules permanent deletion in 30 days. Your profile is hidden immediately and you can
          cancel any time before the grace window ends.
        </p>
      </div>
      <Button variant="destructive" onClick={() => setStage('confirm')}>
        Delete account
      </Button>

      {/* Stage 1: warning */}
      <Dialog open={stage === 'confirm'} onOpenChange={(o) => !o && setStage('closed')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete your account?</DialogTitle>
            <DialogDescription>
              You'll be hidden from other members right away. After 30 days, your profile data is
              wiped and your messages become "Former member" in other people's history. You can
              cancel any time during the 30 days by signing back in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStage('closed')}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => setStage('reason')}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage 2: reason capture */}
      <Dialog open={stage === 'reason'} onOpenChange={(o) => !o && setStage('closed')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mind sharing why?</DialogTitle>
            <DialogDescription>
              Optional context helps us improve. Pick the closest match and add detail if you want.
            </DialogDescription>
          </DialogHeader>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reasonCategory">Reason</Label>
              <Select name="reasonCategory" required defaultValue="no_longer_relevant">
                <SelectTrigger id="reasonCategory">
                  <SelectValue placeholder="Pick a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customReason">Anything else? (optional)</Label>
              <Textarea
                id="customReason"
                name="customReason"
                rows={3}
                placeholder="Anything you want us to know"
              />
            </div>
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStage('closed')}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={pending}>
                {pending ? 'Scheduling…' : 'Delete my account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
