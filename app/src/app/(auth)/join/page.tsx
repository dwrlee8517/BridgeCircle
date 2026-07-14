import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createAdminClient } from '@/db/admin'
import { createInviteVerificationRepository } from '@/db/repositories/invites'
import { verifyInviteToken } from '@/lib/invite/verify'
import { JoinForm } from './join-form'

type SearchParams = { token?: string; error?: string }

export default async function JoinPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const token = params.token

  if (!token) {
    return (
      <ErrorCard title="No invite token">
        This page only loads with a valid invite link. Check your email for the link your admin sent
        you.
      </ErrorCard>
    )
  }

  const verified = await verifyInviteToken(
    token,
    createInviteVerificationRepository(createAdminClient()),
  )
  if (!verified.ok) {
    return <ErrorCard title="Invite unavailable">{describeError(verified.error)}</ErrorCard>
  }

  return (
    <Card className="shadow-card-hover">
      <CardContent className="pt-6">
        <JoinForm
          token={token}
          email={verified.invite.email}
          fullName={verified.invite.fullName}
          organizationName={verified.invite.organizationName}
        />
      </CardContent>
    </Card>
  )
}

function ErrorCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{children}</p>
      </CardContent>
    </Card>
  )
}

function describeError(err: 'not_found' | 'expired' | 'revoked' | 'accepted'): string {
  switch (err) {
    case 'not_found':
      return 'This invite link is not valid. Check that you opened the most recent email.'
    case 'expired':
      return 'This invite has expired. Ask your admin to send a new one.'
    case 'revoked':
      return 'This invite has been revoked.'
    case 'accepted':
      return 'This invite has already been used. Sign in instead.'
  }
}
