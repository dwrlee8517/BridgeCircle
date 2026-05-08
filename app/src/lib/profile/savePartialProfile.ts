import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/db/admin'
import type { Database } from '@/db/database.types'
import { setOpenToMentorship } from '@/lib/asks/preferences'
import type {
  OnboardingAboutInput,
  OnboardingCurrentInput,
  OnboardingEducationInput,
  OnboardingHelpInput,
  OnboardingPastInput,
} from './schemas'

export type SavePartialResult =
  | { ok: true }
  | { ok: false; error: 'no_membership' | 'db_error'; detail?: string }

/**
 * Onboarding step-by-step save helpers. Each function writes only the fields
 * its step touches, leaving everything else null/untouched. This is what
 * lets a user skip a step without breaking validation or wiping prior fields.
 *
 * Compare to saveProfile() which is the all-at-once edit path used by
 * /profile/edit. That one validates the *full* profile; these don't.
 *
 * RLS: the supabase client is the user's own (server-side, with their auth
 * cookie). Each user can update their own base_profiles / org_profiles /
 * helper_preferences rows under existing policies — no admin escalation.
 */

// --- Step 1: About you --------------------------------------------------

export async function saveOnboardingAbout(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: OnboardingAboutInput,
): Promise<SavePartialResult> {
  const { error: baseErr } = await supabase
    .from('base_profiles')
    .update({
      name: input.name,
      preferred_name: input.preferredName || null,
      name_other: input.nameOther || null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
  if (baseErr) return { ok: false, error: 'db_error', detail: baseErr.message }

  const membership = await getActiveMembership(supabase, userId)
  if (!membership) return { ok: false, error: 'no_membership' }

  const { error: orgErr } = await supabase
    .from('organization_profiles')
    .update({
      graduation_year: input.graduationYear,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_membership_id', membership.id)
  if (orgErr) return { ok: false, error: 'db_error', detail: orgErr.message }

  return { ok: true }
}

// --- Step 2: Education --------------------------------------------------

export async function saveOnboardingEducation(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: OnboardingEducationInput,
): Promise<SavePartialResult> {
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
      university: input.university || null,
      major: input.major || null,
      education_history: educationHistory.length > 0 ? educationHistory : null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
  if (baseErr) return { ok: false, error: 'db_error', detail: baseErr.message }
  return { ok: true }
}

// --- Step 3: Where you are now -----------------------------------------

export async function saveOnboardingCurrent(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: OnboardingCurrentInput,
): Promise<SavePartialResult> {
  const { error: baseErr } = await supabase
    .from('base_profiles')
    .update({
      current_employer: input.currentEmployer || null,
      current_title: input.currentTitle || null,
      city: input.city || null,
      headline: input.headline || null,
      linkedin_url: input.linkedinUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
  if (baseErr) return { ok: false, error: 'db_error', detail: baseErr.message }
  return { ok: true }
}

// --- Step 4: Where you've been -----------------------------------------

export async function saveOnboardingPast(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: OnboardingPastInput,
): Promise<SavePartialResult> {
  const careerHistory = input.careerHistory.map((e) => ({
    employer: e.employer,
    title: e.title,
    start_date: e.startDate,
    end_date: e.endDate,
    description: e.description,
  }))

  const { error: baseErr } = await supabase
    .from('base_profiles')
    .update({
      career_history: careerHistory.length > 0 ? careerHistory : null,
      skills: input.skills.length > 0 ? input.skills : null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
  if (baseErr) return { ok: false, error: 'db_error', detail: baseErr.message }
  return { ok: true }
}

// --- Step 5: How you can help ------------------------------------------

export async function saveOnboardingHelp(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: OnboardingHelpInput,
): Promise<SavePartialResult> {
  const topics = input.mentoringTopics
    ? input.mentoringTopics
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : null

  const { error: baseErr } = await supabase
    .from('base_profiles')
    .update({
      avatar_url: input.avatarUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
  if (baseErr) return { ok: false, error: 'db_error', detail: baseErr.message }

  const membership = await getActiveMembership(supabase, userId)
  if (!membership) return { ok: false, error: 'no_membership' }

  const { error: orgErr } = await supabase
    .from('organization_profiles')
    .update({
      bio: input.bio || null,
      mentoring_topics: topics,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_membership_id', membership.id)
  if (orgErr) return { ok: false, error: 'db_error', detail: orgErr.message }

  const prefResult = await setOpenToMentorship(supabase, membership.id, input.openToMentor)
  if (!prefResult.ok) return prefResult

  return { ok: true }
}

// --- Mark onboarding complete + helpers --------------------------------

export async function markOnboardingComplete(
  _userClient: SupabaseClient<Database>,
  userId: string,
): Promise<SavePartialResult> {
  // Why admin client: RLS on `users` has read-only policies for the user's
  // own row (see 20260426233156_rls.sql — `users read self`, `users read
  // org mates`). There's no UPDATE policy. Using the user-scoped client
  // makes Supabase silently succeed with 0 rows affected — no error
  // surfaces, but onboarding_completed_at never actually gets set, and
  // the user gets bounced back to step 1 on next visit. The admin client
  // bypasses RLS for this one targeted column.
  //
  // We accept the user-scoped client as the first arg (and ignore it) for
  // call-site symmetry with the other save* helpers. The narrow surface
  // of this update — only the onboarding_completed_at column on the
  // signed-in user's own row — is what makes the admin escalation safe.
  const admin = createAdminClient()
  const { error } = await admin
    .from('users')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) return { ok: false, error: 'db_error', detail: error.message }
  return { ok: true }
}

async function getActiveMembership(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from('organization_memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()
  return data
}
