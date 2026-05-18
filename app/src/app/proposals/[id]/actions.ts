'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/db/admin'
import { applyProposal } from '@/lib/enrichment/applyProposal'
import { verifyProposalToken } from '@/lib/enrichment/verifyProposalToken'
import { type ApplyExtractedInput, applyExtractedSchema } from '@/lib/resume/schemas'

export type ApplyTokenProposalState = { error?: string }

/**
 * Token-authed apply / decline. The session is never consulted — only the
 * (proposalId, token) pair from formData. Returns errors via state; success
 * redirects to a status page.
 */
export async function applyTokenProposalAction(
  _prev: ApplyTokenProposalState,
  formData: FormData,
): Promise<ApplyTokenProposalState> {
  const proposalId = String(formData.get('proposalId') ?? '')
  const token = String(formData.get('token') ?? '')
  const intent = String(formData.get('intent') ?? '')

  if (!proposalId || !token) return { error: 'Missing proposal id or token.' }

  const verified = await verifyProposalToken(proposalId, token)
  if (!verified.ok) {
    return { error: verified.error === 'expired' ? 'This link expired.' : 'This link is invalid.' }
  }

  const admin = createAdminClient()

  if (intent === 'decline') {
    const result = await applyProposal(admin, {
      userId: verified.proposal.userId,
      proposalId,
      action: 'decline',
    })
    if (!result.ok) return { error: 'Could not record your decline. Try again.' }
    redirect(`/proposals/${proposalId}?token=${encodeURIComponent(token)}&status=declined-1`)
  }

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

  const result = await applyProposal(admin, {
    userId: verified.proposal.userId,
    proposalId,
    action: 'accept',
    input: validated.data as ApplyExtractedInput,
    finalStatus: 'edited',
  })
  if (!result.ok) return { error: 'Could not apply changes. Try again.' }

  redirect(`/proposals/${proposalId}?token=${encodeURIComponent(token)}&status=confirmed-1`)
}
