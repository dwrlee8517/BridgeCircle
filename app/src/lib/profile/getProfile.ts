import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import {
  canSeeSection,
  deriveViewerKind,
  type PrivacySettings,
  parseStoredPrivacySettings,
} from './privacy'

export type CareerEntry = {
  employer: string
  title: string
  start_date: string | null
  end_date: string | null
  description: string | null
}

export type EducationEntry = {
  school: string
  degree: string | null
  field: string | null
  start_date: string | null
  end_date: string | null
}

export type ProfileView = {
  userId: string
  membershipId: string
  organizationId: string
  organizationName: string
  // Directory fields — always visible to org-mates regardless of privacy.
  name: string | null
  headline: string | null
  currentEmployer: string | null
  currentTitle: string | null
  city: string | null
  university: string | null
  major: string | null
  graduationYear: number | null
  avatarUrl: string | null
  // Configurable sections — null when redacted by privacy.
  linkedinUrl: string | null
  bio: string | null
  mentoringTopics: string[] | null
  careerHistory: CareerEntry[] | null
  educationHistory: EducationEntry[] | null
  skills: string[] | null
  // Helper-side state on the profile owner. Two opt-ins (advice + mentorship);
  // each has a "raw" toggle and a "currently accepting" derived flag that
  // also accounts for the mentor inactivity auto-pause.
  openToAdvice: boolean
  isOpenAsAdviceHelper: boolean
  openToMentor: boolean
  isOpenAsMentor: boolean
  mentorPaused: boolean
  // Viewer-relative metadata. Lets the UI render a "Some sections are
  // hidden by this member's privacy settings" hint without re-deriving.
  isSelf: boolean
  isFriend: boolean
  privacySettings: PrivacySettings
}

/**
 * Fetch a profile for display, applying per-section privacy redaction
 * based on the viewer's relationship to the profile owner.
 *
 * Relationship is derived from {viewerId, target}:
 *   - viewerId === userId → 'self', no redaction
 *   - friends row exists → 'friend', sees org + friends sections
 *   - otherwise → 'orgmate' (RLS guarantees we got this far), sees org sections only
 *
 * The function returns null when:
 *   - the target's base_profiles row is hidden from the viewer by RLS
 *   - the target has no active org membership (orphaned profile)
 */
export async function getProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  viewerId: string,
): Promise<ProfileView | null> {
  const { data: base } = await supabase
    .from('base_profiles')
    .select(
      'user_id, name, headline, current_employer, current_title, city, university, major, linkedin_url, avatar_url, career_history, education_history, skills, privacy_settings',
    )
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
    .select('graduation_year, bio, mentoring_topics')
    .eq('organization_membership_id', membership.id)
    .maybeSingle()

  const { data: pref } = await supabase
    .from('helper_preferences')
    .select('open_to_advice, open_to_mentorship, paused_at')
    .eq('organization_membership_id', membership.id)
    .maybeSingle()

  const orgName = (membership.organizations as { name: string } | null)?.name ?? ''

  // Resolve viewer relationship for privacy redaction.
  const isSelf = viewerId === userId
  let isFriend = false
  if (!isSelf) {
    const [a, b] = viewerId < userId ? [viewerId, userId] : [userId, viewerId]
    const { data: friendship } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_a_id', a)
      .eq('user_b_id', b)
      .maybeSingle()
    isFriend = !!friendship
  }
  const viewer = deriveViewerKind(isSelf, isFriend)
  const privacy = parseStoredPrivacySettings(base.privacy_settings)

  // Apply section-level redaction. `null` here represents "hidden by
  // privacy"; `null` from the DB also surfaces as null (which is fine —
  // both render as "no data" on the profile page, and self always sees
  // the truth so the owner can still edit).
  const showContact = canSeeSection(privacy, 'contact_links', viewer)
  const showCareer = canSeeSection(privacy, 'career_history', viewer)
  const showEducation = canSeeSection(privacy, 'education_history', viewer)
  const showBio = canSeeSection(privacy, 'bio', viewer)
  const showSkills = canSeeSection(privacy, 'skills', viewer)

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
    graduationYear: orgProfile?.graduation_year ?? null,
    avatarUrl: base.avatar_url,
    linkedinUrl: showContact ? base.linkedin_url : null,
    bio: showBio ? (orgProfile?.bio ?? null) : null,
    // Mentoring topics ride along with the bio gate — they're the
    // owner-authored mentoring blurb, not a directory field.
    mentoringTopics: showBio ? (orgProfile?.mentoring_topics ?? null) : null,
    careerHistory: showCareer ? ((base.career_history as CareerEntry[] | null) ?? null) : null,
    educationHistory: showEducation
      ? ((base.education_history as EducationEntry[] | null) ?? null)
      : null,
    skills: showSkills ? (base.skills ?? null) : null,
    openToAdvice: pref?.open_to_advice ?? false,
    isOpenAsAdviceHelper: !!pref?.open_to_advice && !pref.paused_at,
    openToMentor: pref?.open_to_mentorship ?? false,
    isOpenAsMentor: !!pref?.open_to_mentorship && !pref.paused_at,
    mentorPaused: !!pref?.paused_at,
    isSelf,
    isFriend,
    privacySettings: privacy,
  }
}
