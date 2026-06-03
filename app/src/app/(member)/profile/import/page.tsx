import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { getImportCurrentProfile } from '@/lib/profile/importCurrentProfile'
import { FreshnessReviewCard } from '../../help-network-ui'
import { ImportFlow, type ImportSource } from './import-flow'

type SearchParams = { return?: string; source?: string }

export default async function ImportResumePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireSession()
  const params = await searchParams
  const returnTo = memberImportReturnTo(params.return, session.userId)
  const source: ImportSource = params.source === 'linkedin' ? 'linkedin' : 'resume'

  const supabase = await createClient()
  const current = await getImportCurrentProfile(supabase, session.userId)

  const titleCopy =
    source === 'linkedin'
      ? {
          title: 'Import from LinkedIn',
          description:
            'Paste your LinkedIn URL. We pull current role, career history, education, and skills, then let you review every field before saving.',
        }
      : {
          title: 'Import from resume',
          description:
            'Upload a PDF, DOCX, or PNG. We extract your career history, education, and skills, then let you review every field — including ones already on your profile — before saving.',
        }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <Link href={returnTo} className="text-sm text-muted-foreground hover:underline">
        {returnTo.startsWith('/profile/edit') ? '← Back to edit profile' : '← Back to profile'}
      </Link>
      <FreshnessReviewCard />
      <Card>
        <CardHeader>
          <CardTitle>{titleCopy.title}</CardTitle>
          <CardDescription>{titleCopy.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ImportFlow current={current} returnTo={returnTo} source={source} />
        </CardContent>
      </Card>
    </div>
  )
}

function memberImportReturnTo(raw: string | undefined, userId: string) {
  if (raw?.startsWith('/profile/edit')) return raw
  if (raw?.startsWith('/profile/') && !raw.startsWith('/profile/import')) return raw
  return `/profile/${userId}`
}
