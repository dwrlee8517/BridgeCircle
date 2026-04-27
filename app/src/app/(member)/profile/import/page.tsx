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
    .select('name, headline, city, current_employer, current_title, university, major')
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
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <Link href={returnTo} className="text-sm text-muted-foreground hover:underline">
        ← Back
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Import from resume</CardTitle>
          <CardDescription>
            Upload a PDF or DOCX. We extract your career history, education, and skills, then let
            you review every field before saving anything.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImportFlow current={current} returnTo={returnTo} />
        </CardContent>
      </Card>
    </div>
  )
}
