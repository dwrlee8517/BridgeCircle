import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { getProfile } from '@/lib/profile/getProfile'
import { RequestForm } from './request-form'

type SearchParams = { to?: string }

export default async function NewMentorshipRequestPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireSession()
  const params = await searchParams

  if (!params.to) notFound()

  const supabase = await createClient()
  // Pass viewerId so privacy redaction applies — per locked decision,
  // mentorship doesn't override privacy. The mentee sees only what
  // privacy settings + their (likely non-friend) relationship allows.
  const mentor = await getProfile(supabase, params.to, session.userId)
  if (!mentor) notFound()

  if (!mentor.isOpenAsMentor) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Not open to mentor</CardTitle>
            <CardDescription>
              {mentor.name} isn&apos;t accepting new mentorship requests right now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/profile/${mentor.userId}`} className="text-sm underline">
              ← Back to profile
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <Link
        href={`/profile/${mentor.userId}`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Back to {mentor.name}&apos;s profile
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Request mentorship from {mentor.name}</CardTitle>
          <CardDescription>
            They&apos;ll get an email notification and can accept or decline. Be specific — concrete
            asks get answered faster.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RequestForm mentorId={mentor.userId} mentorName={mentor.name ?? 'this mentor'} />
        </CardContent>
      </Card>
    </div>
  )
}
