import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { markProfileEmbeddingDirty } from '@/lib/search/matching/indexStatus'
import type { ProfileFormInput } from './schemas'

export type SaveProfileResult =
  | { ok: true }
  | { ok: false; error: 'no_membership' | 'db_error'; detail?: string }

/**
 * Persist a profile-form submission across base_profiles + organization_profiles.
 *
 * The supabase client is passed in (rather than created here) so the same
 * function works from server actions on behalf of the signed-in user (RLS
 * enforced) — no admin client needed because the user is updating their
 * own rows, which their RLS policies allow.
 */
export async function saveProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: ProfileFormInput,
): Promise<SaveProfileResult> {
  // career_history / education_history land in JSONB with snake_case fields,
  // matching what the resume-import path writes — keeps the two write paths
  // schema-compatible.
  const careerHistory = input.careerHistory.map((e) => ({
    employer: e.employer,
    title: e.title,
    start_date: e.startDate,
    end_date: e.endDate,
    description: e.description,
  }))
  const educationHistory = input.educationHistory.map((e) => ({
    school: e.school,
    degree: e.degree,
    field: e.field,
    start_date: e.startDate,
    end_date: e.endDate,
  }))

  const { error: baseErr } = await supabase
    .from('base_profiles')
    .update({
      name: input.name,
      preferred_name: input.preferredName || null,
      name_other: input.nameOther || null,
      headline: input.headline || null,
      current_employer: input.currentEmployer,
      current_title: input.currentTitle,
      city: input.city,
      university: input.university,
      major: input.major,
      linkedin_url: input.linkedinUrl || null,
      avatar_url: input.avatarUrl || null,
      skills: input.skills,
      career_history: careerHistory,
      education_history: educationHistory,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (baseErr) {
    return { ok: false, error: 'db_error', detail: baseErr.message }
  }

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!membership) {
    return { ok: false, error: 'no_membership' }
  }

  const { error: orgErr } = await supabase
    .from('organization_profiles')
    .update({
      graduation_year: input.graduationYear,
      bio: input.bio || null,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_membership_id', membership.id)

  if (orgErr) {
    return { ok: false, error: 'db_error', detail: orgErr.message }
  }

  await markProfileEmbeddingDirty({
    userId,
    organizationMembershipId: membership.id,
    reason: 'profile_edit',
  })

  return { ok: true }
}
