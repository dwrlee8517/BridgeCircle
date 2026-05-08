import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { type CurrentProfile, ImportFlow } from './import-flow'

type SearchParams = { return?: string }

export default async function ImportResumePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireSession()
  const params = await searchParams
  const returnTo =
    typeof params.return === 'string' && params.return.startsWith('/')
      ? params.return
      : `/profile/${session.userId}`

  const supabase = await createClient()
  const { data: base } = await supabase
    .from('base_profiles')
    .select(
      'name, headline, city, current_employer, current_title, university, major, career_history, education_history, skills',
    )
    .eq('user_id', session.userId)
    .maybeSingle()

  const current: CurrentProfile = {
    name: base?.name ?? null,
    headline: base?.headline ?? null,
    city: base?.city ?? null,
    currentEmployer: base?.current_employer ?? null,
    currentTitle: base?.current_title ?? null,
    university: base?.university ?? null,
    major: base?.major ?? null,
    // Existing arrays are passed in so the confirm step can show them
    // alongside the freshly-extracted entries — that's the only way the
    // user can untick something they've previously saved.
    careerHistory: (base?.career_history as CareerEntryFromDb[] | null) ?? [],
    educationHistory: (base?.education_history as EducationEntryFromDb[] | null) ?? [],
    skills: base?.skills ?? [],
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <Link href={returnTo} className="text-sm text-muted-foreground hover:underline">
        {returnTo.startsWith('/onboarding')
          ? '← Back to onboarding'
          : returnTo.startsWith('/profile/edit')
            ? '← Back to edit profile'
            : '← Back to profile'}
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Import from resume</CardTitle>
          <CardDescription>
            Upload a PDF or DOCX. We extract your career history, education, and skills, then let
            you review every field — including ones already on your profile — before saving.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImportFlow current={current} returnTo={returnTo} />
        </CardContent>
      </Card>
    </div>
  )
}

// Shape of entries as they live in base_profiles JSONB columns. snake_case
// because that's what we serialize. Promoted to a type so the cast above is
// not silently `any`.
type CareerEntryFromDb = {
  employer: string
  title: string
  start_date: string | null
  end_date: string | null
  description: string | null
}
type EducationEntryFromDb = {
  school: string
  degree: string | null
  field: string | null
  start_date: string | null
  end_date: string | null
}
