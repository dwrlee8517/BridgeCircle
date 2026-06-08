import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'
import { markProfileEmbeddingDirty } from '@/lib/search/matching/indexStatus'
import type { ApplyExtractedInput } from './schemas'

export type ApplyResult = { ok: true } | { ok: false; error: 'db_error'; detail?: string }

type BaseProfileUpdate = Database['public']['Tables']['base_profiles']['Update']

/**
 * Take the user-confirmed selections and write them to base_profiles.
 *
 * Scalars: updates only the keys the user kept (`use === true`).
 *
 * Arrays (career_history, education_history, skills): replaced wholesale
 * with whatever the user kept. The confirm step is seeded with both
 * already-saved entries AND newly-extracted ones, so unchecking either
 * type means "remove from my profile". An empty kept-set explicitly
 * clears the field — that's intentional, not a bug. Callers who want to
 * leave an array untouched should not show it on the confirm screen at
 * all (the action wouldn't include it in `input` then).
 *
 * Idempotent: re-running with the same selections is a no-op-ish update.
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
  if (input.scalars.currentEmployer.use)
    update.current_employer = norm(input.scalars.currentEmployer.value)
  if (input.scalars.currentTitle.use) update.current_title = norm(input.scalars.currentTitle.value)
  if (input.scalars.university.use) update.university = norm(input.scalars.university.value)
  if (input.scalars.major.use) update.major = norm(input.scalars.major.value)

  // Arrays: always assign. Empty array = user explicitly cleared the field.
  // null is reserved for "never had this set"; once a user has interacted
  // with the section, store [] rather than null so the distinction is clear.
  update.career_history = input.careerHistory
    .filter((e) => e.use)
    .map((e) => ({
      employer: e.employer,
      title: e.title,
      start_date: e.startDate,
      end_date: e.endDate,
      description: e.description,
    }))

  update.education_history = input.educationHistory
    .filter((e) => e.use)
    .map((e) => ({
      school: e.school,
      degree: e.degree,
      field: e.field,
      start_date: e.startDate,
      end_date: e.endDate,
    }))

  update.skills = input.skills.filter((s) => s.use).map((s) => s.value)

  const { error } = await supabase.from('base_profiles').update(update).eq('user_id', userId)

  if (error) return { ok: false, error: 'db_error', detail: error.message }

  await markProfileEmbeddingDirty({
    userId,
    reason: 'profile_import_apply',
  })

  return { ok: true }
}
