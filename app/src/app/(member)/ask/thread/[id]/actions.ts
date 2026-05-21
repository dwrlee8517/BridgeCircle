'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/db/server'
import { parseMessageForm } from '@/lib/asks/schemas'
import { sendMessage } from '@/lib/asks/sendMessage'
import { requireSession } from '@/lib/auth/session'

export type MessageFormState = {
  error?: string
  ok?: boolean
}

export async function sendMessageAction(
  _prev: MessageFormState,
  formData: FormData,
): Promise<MessageFormState> {
  const session = await requireSession()
  const parsed = parseMessageForm(formData)
  if (!parsed.success) {
    return { error: "Message can't be empty." }
  }

  const supabase = await createClient()
  const result = await sendMessage(supabase, session.userId, parsed.data)

  if (!result.ok) {
    if (result.error === 'thread_archived') return { error: 'This thread has been archived.' }
    if (result.error === 'not_participant') return { error: 'You are not in this thread.' }
    return { error: 'Could not send. Try again.' }
  }

  revalidatePath(`/ask/thread/${parsed.data.threadId}`)
  return { ok: true }
}
