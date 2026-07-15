import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

export type ImportCurrentProfile = {
  name: string | null
  headline: string | null
  city: string | null
  currentEmployer: string | null
  currentTitle: string | null
  university: string | null
  major: string | null
  linkedinUrl: string | null
  careerHistory: Array<{
    employer: string
    title: string
    start_date: string | null
    end_date: string | null
    description: string | null
  }>
  educationHistory: Array<{
    school: string
    degree: string | null
    field: string | null
    start_date: string | null
    end_date: string | null
  }>
  skills: string[]
}

type CareerEntryFromDb = ImportCurrentProfile['careerHistory'][number]
type EducationEntryFromDb = ImportCurrentProfile['educationHistory'][number]

export async function getImportCurrentProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ImportCurrentProfile> {
  const { data: base } = await supabase
    .from('base_profiles')
    .select(
      'name, headline, city, current_employer, current_title, university, major, linkedin_url, career_history, education_history, skills',
    )
    .eq('user_id', userId)
    .maybeSingle()

  return {
    name: base?.name ?? null,
    headline: base?.headline ?? null,
    city: base?.city ?? null,
    currentEmployer: base?.current_employer ?? null,
    currentTitle: base?.current_title ?? null,
    university: base?.university ?? null,
    major: base?.major ?? null,
    linkedinUrl: base?.linkedin_url ?? null,
    careerHistory: (base?.career_history as CareerEntryFromDb[] | null) ?? [],
    educationHistory: (base?.education_history as EducationEntryFromDb[] | null) ?? [],
    skills: base?.skills ?? [],
  }
}
