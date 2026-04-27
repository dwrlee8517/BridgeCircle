'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { parseMessageForm } from '@/lib/mentorship/schemas'
import { sendMessage } from '@/lib/mentorship/sendMessage'

export type MessageFormState = {
  error?: string
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

  revalidatePath(`/mentorship/thread/${parsed.data.threadId}`)
  return {}
}
