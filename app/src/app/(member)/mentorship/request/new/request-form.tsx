'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type RequestFormState, submitRequest } from './actions'

const initialState: RequestFormState = {}

type Props = {
  mentorId: string
  mentorName: string
}

export function RequestForm({ mentorId, mentorName }: Props) {
  const [state, action, pending] = useActionState(submitRequest, initialState)
  const fe = state.fieldErrors ?? {}

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="mentorId" value={mentorId} />

      <div className="space-y-2">
        <Label htmlFor="reason">
          Why are you reaching out to {mentorName}? <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="reason"
          name="reason"
          rows={3}
          required
          placeholder="A short context for the mentor — your situation, why their background fits."
        />
        {fe.reason ? <p className="text-xs text-destructive">{fe.reason}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="helpNeeded">
          What would help look like? <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="helpNeeded"
          name="helpNeeded"
          rows={3}
          required
          placeholder="A 30-min call. Quick advice on X. Intro to someone in Y. Resume review."
        />
        {fe.helpNeeded ? <p className="text-xs text-destructive">{fe.helpNeeded}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="background">Anything else (optional)</Label>
        <Textarea
          id="background"
          name="background"
          rows={3}
          placeholder="Additional context, constraints, or what you've already tried."
        />
        {fe.background ? <p className="text-xs text-destructive">{fe.background}</p> : null}
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'Send request'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/profile/${mentorId}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
