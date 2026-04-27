'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/session'
import { createClient } from '@/db/server'
import { sendInvite } from '@/lib/invite/send'

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
  const session = await requireAdmin()
  const supabase = await createClient()

  const parsed = formSchema.safeParse({
    email: formData.get('email'),
    fullName: formData.get('fullName'),
    graduationYear: formData.get('graduationYear'),
  })
  if (!parsed.success) {
    return { error: 'Enter a valid email and (optionally) a 4-digit grad year.' }
  }

  // Find the admin's first admin/super_admin org. At launch there's only one,
  // so this is fine; multi-org admin UI gets an org selector in a later PR.
  const { data: roles } = await supabase
    .from('admin_role_assignments')
    .select('organization_id')
    .eq('user_id', session.userId)
    .in('role', ['super_admin', 'admin'])
    .limit(1)

  const orgId = roles?.[0]?.organization_id
  if (!orgId) {
    return { error: 'No admin role found. (This should not happen if you reached this page.)' }
  }

  const result = await sendInvite({
    organizationId: orgId,
    email: parsed.data.email,
    fullName: parsed.data.fullName || null,
    graduationYear: parsed.data.graduationYear,
    sentBy: session.userId,
  })

  if (!result.ok) {
    if (result.error === 'duplicate') {
      return { error: 'That email already has an invite for this organization.' }
    }
    return { error: result.detail ?? 'Could not send invite.' }
  }

  revalidatePath('/admin/invite')
  return { success: true, emailJustSent: parsed.data.email }
}
