import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import type { ApplyExtractedInput } from './schemas'

export type ApplyResult = { ok: true } | { ok: false; error: 'db_error'; detail?: string }

type BaseProfileUpdate = Database['public']['Tables']['base_profiles']['Update']

/**
 * Take the user-confirmed extraction selections and write them to
 * base_profiles. Updates only fields where `use === true`. Replaces the
 * career_history / education_history JSONB arrays wholesale (the user
 * picks which entries to keep on the confirm screen, so we trust the
 * outcome). skills is replaced with the kept tags.
 *
 * Idempotent: re-running with the same selections is a no-op-ish update
 * (just bumps updated_at).
 */
export async function applyExtractedToProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: ApplyExtractedInput,
): Promise<ApplyResult> {
  const update: BaseProfileUpdate = {
    updated_at: new Date().toISOString(),
  }

  // Scalars: only set the keys the user chose to overwrite. Each value can
  // be a non-empty string (override) or null (clear it back to null).
  const norm = (v: string | null) => (v && v.length > 0 ? v : null)
  if (input.scalars.name.use) update.name = norm(input.scalars.name.value)
  if (input.scalars.headline.use) update.headline = norm(input.scalars.headline.value)
  if (input.scalars.city.use) update.city = norm(input.scalars.city.value)
  if (input.scalars.currentEmployer.use) update.current_employer = norm(input.scalars.currentEmployer.value)
  if (input.scalars.currentTitle.use) update.current_title = norm(input.scalars.currentTitle.value)
  if (input.scalars.university.use) update.university = norm(input.scalars.university.value)
  if (input.scalars.major.use) update.major = norm(input.scalars.major.value)

  const careerKept = input.careerHistory
    .filter((e) => e.use)
    .map((e) => ({
      employer: e.employer,
      title: e.title,
      start_date: e.startDate,
      end_date: e.endDate,
      description: e.description,
    }))
  if (careerKept.length > 0) update.career_history = careerKept

  const educationKept = input.educationHistory
    .filter((e) => e.use)
    .map((e) => ({
      school: e.school,
      degree: e.degree,
      field: e.field,
      start_date: e.startDate,
      end_date: e.endDate,
    }))
  if (educationKept.length > 0) update.education_history = educationKept

  const skillsKept = input.skills.filter((s) => s.use).map((s) => s.value)
  if (skillsKept.length > 0) update.skills = skillsKept

  const { error } = await supabase.from('base_profiles').update(update).eq('user_id', userId)

  if (error) return { ok: false, error: 'db_error', detail: error.message }
  return { ok: true }
}
