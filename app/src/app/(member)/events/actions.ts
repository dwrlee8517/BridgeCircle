'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/db/server'
import { getAppOrigin } from '@/lib/auth/app-url'
import { requireSession } from '@/lib/auth/session'
import { respondRsvp } from '@/lib/events/respondRsvp'
import { parseRsvpForm } from '@/lib/events/schemas'

export async function rsvpAction(formData: FormData) {
  const session = await requireSession()
  const parsed = parseRsvpForm(formData)
  if (!parsed.success) return

  const supabase = await createClient()
  const origin = await getAppOrigin()
  await respondRsvp(supabase, origin, session.userId, session.email, parsed.data)

  revalidatePath('/events')
}
