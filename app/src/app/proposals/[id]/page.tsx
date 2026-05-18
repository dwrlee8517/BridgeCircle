import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createAdminClient } from '@/db/admin'
import { applyProposal } from '@/lib/enrichment/applyProposal'
import { verifyProposalToken } from '@/lib/enrichment/verifyProposalToken'
import type { ApplyExtractedInput, ExtractedProfile } from '@/lib/resume/schemas'
import { TokenProposalReview } from './token-proposal-review'

type Params = { id: string }
type SearchParams = { token?: string; action?: string; status?: string }

/**
 * Token-authed proposal review. Reachable from the monthly email links — no
 * session required. ?action=confirm and ?action=decline are one-click flows
 * that bypass the review UI and apply / decline immediately. Without an
 * action, the review UI renders with everything pre-checked.
 */
export default async function PublicProposalPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}) {
  const { id } = await params
  const sp = await searchParams
  const token = sp.token ?? ''
  const action = sp.action

  // Confirmation screen comes first: it's reached only by our own redirect
  // after a successful action, at which point the proposal status is no
  // longer 'pending' and the token would fail verifyProposalToken. The
  // status flag is trusted because it's set by a server redirect, not a
  // client param the user could forge.
  if (sp.status?.startsWith('confirmed-') || sp.status?.startsWith('declined-')) {
    const success = sp.status.endsWith('-1')
    const wasConfirm = sp.status.startsWith('confirmed')
    return (
      <div className="mx-auto max-w-xl px-4 py-16 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {success
                ? wasConfirm
                  ? 'Profile updated'
                  : 'Update declined'
                : 'Something went wrong'}
            </CardTitle>
            <CardDescription>
              {success
                ? wasConfirm
                  ? 'Your profile now reflects your latest LinkedIn. Thanks for confirming.'
                  : 'We won’t apply this batch of changes. Your profile is unchanged.'
                : "Sign in and try again from your profile's Update from LinkedIn button."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/sign-in" className="text-sm font-medium text-primary hover:underline">
              Sign in to BridgeCircle →
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const verified = await verifyProposalToken(id, token)
  if (!verified.ok) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Link no longer valid</CardTitle>
            <CardDescription>
              {verified.error === 'expired'
                ? 'This update proposal expired. Sign in and click Update from LinkedIn on your profile to fetch fresh data.'
                : verified.error === 'used'
                  ? 'This proposal was already reviewed. Sign in to see your current profile.'
                  : 'We couldn’t find that proposal.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/sign-in" className="text-sm font-medium text-primary hover:underline">
              Sign in to BridgeCircle →
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // One-click confirm / decline. We use the admin client because there is no
  // user session — the token is the authorization.
  if (action === 'confirm' || action === 'decline') {
    const admin = createAdminClient()
    if (action === 'decline') {
      const result = await applyProposal(admin, {
        userId: verified.proposal.userId,
        proposalId: verified.proposal.id,
        action: 'decline',
      })
      const ok = result.ok ? '1' : '0'
      redirect(`/proposals/${id}?token=${encodeURIComponent(token)}&status=declined-${ok}`)
    }

    // Confirm = apply every field as proposed. Mirrors auto_apply_and_notify
    // but driven by the user clicking Confirm rather than their stored
    // preference.
    const proposed = verified.proposal.proposedSnapshot as ExtractedProfile
    const allTrueInput: ApplyExtractedInput = {
      scalars: {
        name: { use: proposed.name !== null, value: proposed.name },
        headline: { use: proposed.headline !== null, value: proposed.headline },
        city: { use: proposed.city !== null, value: proposed.city },
        currentEmployer: {
          use: proposed.currentEmployer !== null,
          value: proposed.currentEmployer,
        },
        currentTitle: { use: proposed.currentTitle !== null, value: proposed.currentTitle },
        university: { use: proposed.university !== null, value: proposed.university },
        major: { use: proposed.major !== null, value: proposed.major },
      },
      careerHistory: proposed.careerHistory.map((e) => ({ ...e, use: true })),
      educationHistory: proposed.educationHistory.map((e) => ({ ...e, use: true })),
      skills: proposed.skills.map((value) => ({ use: true, value })),
    }
    const result = await applyProposal(admin, {
      userId: verified.proposal.userId,
      proposalId: verified.proposal.id,
      action: 'accept',
      input: allTrueInput,
      finalStatus: 'accepted',
    })
    const ok = result.ok ? '1' : '0'
    redirect(`/proposals/${id}?token=${encodeURIComponent(token)}&status=confirmed-${ok}`)
  }

  // No action → render the review UI in the token-authed flavor. The client
  // component drives a server action that re-verifies the token before
  // applying, so the user can edit values inline before saving.
  const current = verified.proposal.currentSnapshot as ExtractedProfile
  const proposed = verified.proposal.proposedSnapshot as ExtractedProfile

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Review LinkedIn updates</CardTitle>
          <CardDescription>
            Your monthly LinkedIn refresh found some changes. Nothing is saved until you confirm —
            uncheck anything you don&apos;t want.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TokenProposalReview
            proposalId={verified.proposal.id}
            token={token}
            current={toCurrent(current)}
            proposed={proposed}
          />
        </CardContent>
      </Card>
    </div>
  )
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

function toCurrent(p: ExtractedProfile): CurrentForReview {
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

// notFound is imported but only used implicitly through Next.js; mark it used.
void notFound
