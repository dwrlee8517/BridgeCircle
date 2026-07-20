import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/db/database.types'

const membershipSchema = z.object({
  membershipId: z.guid(),
  status: z.enum(['active', 'pending', 'rejected', 'revoked']),
  joinedAt: z.string().nullable(),
  organization: z.object({
    id: z.guid(),
    slug: z.string(),
    name: z.string(),
    requiresAdminApproval: z.boolean(),
  }),
  profile: z.object({
    displayName: z.string().nullable(),
    preferredName: z.string().nullable(),
    avatarPath: z.string().nullable(),
    graduationYear: z.number().int().nullable(),
    bio: z.string().nullable(),
  }),
  roles: z.array(z.enum(['super_admin', 'admin', 'event_moderator', 'ambassador'])),
})

const memberContextRowSchema = z.object({
  account_state: z.enum(['active', 'deletion_scheduled', 'deleted']),
  onboarding_completed_at: z.string().nullable(),
  delete_scheduled_for: z.string().nullable(),
  delete_initiated_by_admin: z.boolean(),
  deleted_at: z.string().nullable(),
  selected_membership_id: z.guid().nullable(),
  requires_circle_choice: z.boolean(),
  unread_notification_count: z.coerce.number().int().nonnegative(),
  messages_attention_count: z.coerce.number().int().nonnegative(),
  memberships: z.array(membershipSchema),
})

export type MemberContext = {
  accountState: 'active' | 'deletion_scheduled' | 'deleted'
  onboardingCompletedAt: string | null
  deleteScheduledFor: string | null
  deleteInitiatedByAdmin: boolean
  deletedAt: string | null
  selectedMembershipId: string | null
  requiresCircleChoice: boolean
  unreadNotificationCount: number
  messagesAttentionCount: number
  memberships: z.infer<typeof membershipSchema>[]
}

export function parseMemberContextRow(row: unknown): MemberContext {
  const parsed = memberContextRowSchema.parse(row)
  return {
    accountState: parsed.account_state,
    onboardingCompletedAt: parsed.onboarding_completed_at,
    deleteScheduledFor: parsed.delete_scheduled_for,
    deleteInitiatedByAdmin: parsed.delete_initiated_by_admin,
    deletedAt: parsed.deleted_at,
    selectedMembershipId: parsed.selected_membership_id,
    requiresCircleChoice: parsed.requires_circle_choice,
    unreadNotificationCount: parsed.unread_notification_count,
    messagesAttentionCount: parsed.messages_attention_count,
    memberships: parsed.memberships,
  }
}

export async function getMemberContext(
  client: SupabaseClient<Database>,
  preferredMembershipId?: string,
): Promise<MemberContext> {
  const { data, error } = await client
    .schema('api')
    .rpc('get_my_member_context', {
      p_preferred_membership_id: preferredMembershipId,
    })
    .single()

  if (error) throw new Error(`getMemberContext: ${error.message}`)
  return parseMemberContextRow(data)
}
