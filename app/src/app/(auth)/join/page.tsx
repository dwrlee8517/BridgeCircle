import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { verifyInviteFromServer } from '@/lib/entry/invite-service'
import { InviteStateAction } from './invite-state-action'
import { JoinForm } from './join-form'

type SearchParams = { token?: string; error?: string }

export default async function JoinPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const token = params.token

  if (!token) {
    return (
      <InviteStateCard
        title="This invite isn’t available."
        description="Open the most recent invitation email from your school. If the link still does not work, ask the school team for a fresh one."
      />
    )
  }

  const verified = await verifyInviteFromServer(token)
  if (!verified.ok) {
    return <InviteStateCard state={verified.error} />
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

function InviteStateCard({
  state,
  title,
  description,
}: {
  state?: 'not_found' | 'expired' | 'revoked' | 'accepted'
  title?: string
  description?: string
}) {
  const copy = state ? describeError(state) : { title: title ?? '', description: description ?? '' }
  return (
    <Card className="shadow-card-hover">
      <CardHeader className="pb-2">
        <CardTitle>
          <h1 className="font-heading text-h1 font-extrabold tracking-heading">{copy.title}</h1>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pb-6">
        <p className="text-control leading-[1.65] font-medium text-muted-foreground text-pretty">
          {copy.description}
        </p>
        <InviteStateAction accepted={state === 'accepted'} />
        {state === 'accepted' ? (
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Wasn’t you? Ask your school team to reset the invitation.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function describeError(err: 'not_found' | 'expired' | 'revoked' | 'accepted'): {
  title: string
  description: string
} {
  switch (err) {
    case 'not_found':
      return {
        title: 'This invite isn’t available.',
        description:
          'Open the most recent invitation email from your school. If the link still does not work, ask the school team for a fresh one.',
      }
    case 'expired':
      return {
        title: 'This invite has expired.',
        description:
          'Invite links last 14 days, and this one ran out. Your spot didn’t — ask your school team to send a fresh link.',
      }
    case 'revoked':
      return {
        title: 'This invite isn’t available.',
        description:
          'The school team replaced or withdrew this link. Open the most recent invitation email, or ask them for a fresh one.',
      }
    case 'accepted':
      return {
        title: 'This link was already used.',
        description:
          'If that was you, your account is ready — just sign in. Invite links work once, so no one else can use yours.',
      }
  }
}
