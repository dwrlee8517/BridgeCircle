'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { type MessageFormState, sendMessageAction } from './actions'

const initialState: MessageFormState = {}

export function MessageForm({ threadId }: { threadId: string }) {
  const [state, action, pending] = useActionState(sendMessageAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!pending && !state.error && formRef.current) {
      formRef.current.reset()
      textareaRef.current?.focus()
    }
  }, [pending, state.error])

  return (
    <form ref={formRef} action={action} className="space-y-2">
      <input type="hidden" name="threadId" value={threadId} />
      <Textarea
        ref={textareaRef}
        name="body"
        rows={3}
        required
        placeholder="Type a message…"
        className="text-base"
      />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </form>
  )
}
