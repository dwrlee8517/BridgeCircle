'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/db/server'
import {
  closeOpenAsk,
  createOpenAsk,
  OPEN_ASK_MAX_LENGTH,
  OPEN_ASK_MIN_LENGTH,
} from '@/lib/asks/openAsks'
import { requireSession } from '@/lib/auth/session'

const keepOpenSchema = z.object({
  question: z.string().trim().min(OPEN_ASK_MIN_LENGTH).max(OPEN_ASK_MAX_LENGTH),
})

export async function keepAskOpenAction(formData: FormData) {
  const session = await requireSession()
  const parsed = keepOpenSchema.safeParse({ question: formData.get('question') })
  if (!parsed.success) redirect('/ask')

  const supabase = await createClient()
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', session.userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()
  if (!membership) redirect('/ask')

  await createOpenAsk(supabase, {
    userId: session.userId,
    organizationId: membership.organization_id,
    question: parsed.data.question,
  })

  // Either it was created or one already exists — the starter's open-ask row
  // shows the live state either way.
  revalidatePath('/ask')
  redirect('/ask')
}

const closeSchema = z.object({ openAskId: z.string().uuid() })

export async function closeOpenAskAction(formData: FormData) {
  const session = await requireSession()
  const parsed = closeSchema.safeParse({ openAskId: formData.get('openAskId') })
  if (!parsed.success) return

  const supabase = await createClient()
  await closeOpenAsk(supabase, {
    userId: session.userId,
    openAskId: parsed.data.openAskId,
    reason: 'member_closed',
  })

  revalidatePath('/ask')
}
