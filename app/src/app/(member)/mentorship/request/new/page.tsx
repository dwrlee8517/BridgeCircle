import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import type { AskType } from '@/lib/asks/schemas'
import { requireSession } from '@/lib/auth/session'
import { getProfile } from '@/lib/profile/getProfile'
import { RequestForm } from './request-form'

type SearchParams = { to?: string; type?: string }

function parseAskType(t: string | undefined): AskType {
  return t === 'advice' ? 'advice' : 'mentorship'
}

export default async function NewAskPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireSession()
  const params = await searchParams

  if (!params.to) notFound()

  const askType = parseAskType(params.type)

  const supabase = await createClient()
  // Pass viewerId so privacy redaction applies — per locked decision,
  // mentorship doesn't override privacy. The asker sees only what
  // privacy settings + their (likely non-friend) relationship allows.
  const helper = await getProfile(supabase, params.to, session.userId)
  if (!helper) notFound()

  const isOpenForType = askType === 'advice' ? helper.isOpenAsAdviceHelper : helper.isOpenAsMentor
  if (!isOpenForType) {
    const label = askType === 'advice' ? 'open to advice' : 'open to mentorship'
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Not {label} right now</CardTitle>
            <CardDescription>
              {helper.name} isn&apos;t accepting {askType} requests right now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/profile/${helper.userId}`} className="text-sm underline">
              ← Back to profile
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const title =
    askType === 'advice'
      ? `Ask ${helper.name} for advice`
      : `Request mentorship from ${helper.name}`
  const description =
    askType === 'advice'
      ? "Send a single quick question. They'll get an email and can reply at their pace."
      : "They'll get an email notification and can accept or decline. Be specific — concrete asks get answered faster."

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <Link
        href={`/profile/${helper.userId}`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Back to {helper.name}&apos;s profile
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <RequestForm
            helperId={helper.userId}
            helperName={helper.name ?? 'this person'}
            askType={askType}
            placeholderContext={{
              helperFirstName: (helper.name ?? '').split(' ')[0] || 'them',
              helperCurrentTitle: helper.currentTitle,
              helperCurrentEmployer: helper.currentEmployer,
              helperUniversity: helper.university,
              helperMajor: helper.major,
              helperCity: helper.city,
              helperMentoringTopics: helper.mentoringTopics,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
