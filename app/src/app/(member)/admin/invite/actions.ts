'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { loadSchoolAdminContext } from '@/app/(member)/admin/_lib/school-admin'
import { createAdminInviteRepository } from '@/db/repositories/invites'

const formSchema = z.object({
  email: z.email().trim().toLowerCase(),
  fullName: z.string().trim().optional(),
  graduationYear: z
    .string()
    .optional()
    .transform((v) => (v && /^\d{4}$/.test(v) ? Number(v) : null)),
})

export type InviteFormState = {
  success?: boolean
  error?: string
  emailJustSent?: string
}

export async function inviteFromForm(
  _prev: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const { client, membership } = await loadSchoolAdminContext()

  const parsed = formSchema.safeParse({
    email: formData.get('email'),
    fullName: formData.get('fullName'),
    graduationYear: formData.get('graduationYear'),
  })
  if (!parsed.success) {
    return { error: 'Enter a valid email and (optionally) a 4-digit grad year.' }
  }

  const result = await createAdminInviteRepository(client).issue({
    organizationId: membership.organization.id,
    email: parsed.data.email,
    fullName: parsed.data.fullName || null,
    graduationYear: parsed.data.graduationYear,
    requestId: crypto.randomUUID(),
  })

  if (!result.ok) {
    return { error: inviteErrorMessage(result.error) }
  }

  revalidatePath('/admin/invite')
  return { success: true, emailJustSent: parsed.data.email }
}

export async function resendInviteAction(formData: FormData) {
  const { client } = await loadSchoolAdminContext()
  const inviteId = z.guid().safeParse(formData.get('inviteId'))
  if (!inviteId.success) return
  await createAdminInviteRepository(client).resend(inviteId.data, crypto.randomUUID())
  revalidatePath('/admin/invite')
}

export async function revokeInviteAction(formData: FormData) {
  const { client } = await loadSchoolAdminContext()
  const inviteId = z.guid().safeParse(formData.get('inviteId'))
  if (!inviteId.success) return
  await createAdminInviteRepository(client).revoke(inviteId.data, crypto.randomUUID())
  revalidatePath('/admin/invite')
}

function inviteErrorMessage(error: 'accepted' | 'expired' | 'not_available' | 'invalid_input') {
  if (error === 'accepted') return 'That person has already joined this circle.'
  if (error === 'invalid_input') return 'Check the invite details and try again.'
  return 'This invite is no longer available. Refresh and try again.'
}
