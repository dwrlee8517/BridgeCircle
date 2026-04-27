import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

export type ProfileView = {
  userId: string
  membershipId: string
  organizationId: string
  organizationName: string
  name: string | null
  headline: string | null
  currentEmployer: string | null
  currentTitle: string | null
  city: string | null
  university: string | null
  major: string | null
  linkedinUrl: string | null
  avatarUrl: string | null
  bio: string | null
  graduationYear: number | null
  mentoringTopics: string[] | null
  openToMentor: boolean
  isOpenAsMentor: boolean
  mentorPaused: boolean
}

/**
 * Fetch a profile for display. RLS enforces visibility — caller must already
 * be authenticated; if the viewer doesn't share an org with the target user,
 * the query returns null.
 */
export async function getProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ProfileView | null> {
  const { data: base } = await supabase
    .from('base_profiles')
    .select('user_id, name, headline, current_employer, current_title, city, university, major, linkedin_url, avatar_url')
    .eq('user_id', userId)
    .maybeSingle()
  if (!base) return null

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('id, organization_id, organizations(name)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()
  if (!membership) return null

  const { data: orgProfile } = await supabase
    .from('organization_profiles')
    .select('graduation_year, bio, mentoring_topics, open_to_mentor')
    .eq('organization_membership_id', membership.id)
    .maybeSingle()

  const { data: pref } = await supabase
    .from('mentorship_preferences')
    .select('is_open, paused_at')
    .eq('organization_membership_id', membership.id)
    .maybeSingle()

  const orgName = (membership.organizations as { name: string } | null)?.name ?? ''

  return {
    userId: base.user_id,
    membershipId: membership.id,
    organizationId: membership.organization_id,
    organizationName: orgName,
    name: base.name,
    headline: base.headline,
    currentEmployer: base.current_employer,
    currentTitle: base.current_title,
    city: base.city,
    university: base.university,
    major: base.major,
    linkedinUrl: base.linkedin_url,
    avatarUrl: base.avatar_url,
    bio: orgProfile?.bio ?? null,
    graduationYear: orgProfile?.graduation_year ?? null,
    mentoringTopics: orgProfile?.mentoring_topics ?? null,
    openToMentor: orgProfile?.open_to_mentor ?? false,
    isOpenAsMentor: !!pref?.is_open && !pref.paused_at,
    mentorPaused: !!pref?.paused_at,
  }
}
