import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createAdminClient } from '@/db/admin'
import { requireSession } from '@/lib/auth/session'
import type { ExtractedProfile } from '@/lib/resume/schemas'
import { ProposalReview } from './proposal-review'

type Params = { id: string }

export default async function ProposalReviewPage({ params }: { params: Promise<Params> }) {
  const session = await requireSession()
  const { id } = await params

  const admin = createAdminClient()
  const { data: proposal } = await admin
    .from('profile_change_proposals')
    .select('id, user_id, status, source, current_snapshot, proposed_snapshot, expires_at')
    .eq('id', id)
    .maybeSingle()

  if (!proposal || proposal.user_id !== session.userId) notFound()

  const expired = proposal.expires_at && new Date(proposal.expires_at) < new Date()
  const current = proposal.current_snapshot as unknown as ExtractedProfile
  const proposed = proposal.proposed_snapshot as unknown as ExtractedProfile

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <Link href="/profile/edit" className="text-sm text-muted-foreground hover:underline">
        ← Back to edit profile
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Review LinkedIn updates</CardTitle>
          <CardDescription>
            {sourceCopy(proposal.source)} Nothing is saved until you confirm — uncheck anything you
            don&apos;t want.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {proposal.status !== 'pending' ? (
            <p className="text-sm text-muted-foreground">
              This proposal was already {proposal.status}.{' '}
              <Link href="/profile/edit" className="underline">
                Go back to edit profile
              </Link>
              .
            </p>
          ) : expired ? (
            <p className="text-sm text-muted-foreground">
              This proposal expired.{' '}
              <Link href="/profile/edit" className="underline">
                Click Update from LinkedIn again
              </Link>{' '}
              to fetch fresh data.
            </p>
          ) : (
            <ProposalReview
              proposalId={proposal.id}
              current={toCurrentForReview(current)}
              proposed={proposed}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function sourceCopy(source: string): string {
  if (source === 'linkdapi' || source === 'pdl') return 'We pulled fresh data from LinkedIn.'
  if (source === 'brightdata') return 'Your monthly LinkedIn refresh found some changes.'
  return 'Profile updates ready for your review.'
}

type CurrentForReview = {
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

function toCurrentForReview(p: ExtractedProfile): CurrentForReview {
  return {
    name: p.name,
    headline: p.headline,
    city: p.city,
    currentEmployer: p.currentEmployer,
    currentTitle: p.currentTitle,
    university: p.university,
    major: p.major,
    linkedinUrl: null,
    careerHistory: p.careerHistory.map((e) => ({
      employer: e.employer,
      title: e.title,
      start_date: e.startDate,
      end_date: e.endDate,
      description: e.description,
    })),
    educationHistory: p.educationHistory.map((e) => ({
      school: e.school,
      degree: e.degree,
      field: e.field,
      start_date: e.startDate,
      end_date: e.endDate,
    })),
    skills: p.skills,
  }
}
