'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { applyProposal } from '@/lib/enrichment/applyProposal'
import { type ApplyExtractedInput, applyExtractedSchema } from '@/lib/resume/schemas'

export type ApplyProposalState = { error?: string }

export async function applyProposalAction(
  _prev: ApplyProposalState,
  formData: FormData,
): Promise<ApplyProposalState> {
  const session = await requireSession()
  const proposalId = String(formData.get('proposalId') ?? '')
  const intent = String(formData.get('intent') ?? '')
  if (!proposalId) return { error: 'Missing proposal id.' }

  const supabase = await createClient()

  if (intent === 'decline') {
    const declined = await applyProposal(supabase, {
      userId: session.userId,
      proposalId,
      action: 'decline',
    })
    if (!declined.ok) return { error: declineErrorMessage(declined.error) }
    redirect('/profile/edit?refresh=declined')
  }

  // Accept (or edited-then-accepted). Selections come as a JSON blob in the
  // same shape the resume confirm UI uses.
  const raw = formData.get('selections')
  if (typeof raw !== 'string' || raw.length === 0) {
    return { error: 'Nothing to apply.' }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { error: 'Could not read your selections.' }
  }
  const validated = applyExtractedSchema.safeParse(parsed)
  if (!validated.success) return { error: 'Selections were not valid.' }

  // Caller-supplied finalStatus distinguishes "accepted as-is" vs "edited":
  // the page client sets `finalStatus` based on whether anything changed.
  const finalStatusRaw = formData.get('finalStatus')
  const finalStatus =
    finalStatusRaw === 'edited' || finalStatusRaw === 'accepted' ? finalStatusRaw : 'accepted'

  const result = await applyProposal(supabase, {
    userId: session.userId,
    proposalId,
    action: 'accept',
    input: validated.data as ApplyExtractedInput,
    finalStatus,
  })
  if (!result.ok) return { error: declineErrorMessage(result.error) }

  redirect(`/profile/${session.userId}?saved=1`)
}

function declineErrorMessage(err: string): string {
  switch (err) {
    case 'not_found':
      return "Couldn't find that proposal."
    case 'not_pending':
      return 'This proposal has already been reviewed.'
    case 'expired':
      return 'This proposal has expired. Run Update from LinkedIn again.'
    default:
      return 'Could not save changes. Try again.'
  }
}
