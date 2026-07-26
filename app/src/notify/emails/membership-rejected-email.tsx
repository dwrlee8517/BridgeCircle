import { EmailHeading, EmailShell, EmailText, greeting } from './email-kit'

type Props = {
  recipientName: string | null
  orgName: string
}

export function MembershipRejectedEmail({ recipientName, orgName }: Props) {
  const preview = `Update on your ${orgName} BridgeCircle membership request`

  return (
    <EmailShell
      preview={preview}
      footer={`You received this because this email address was used to request access to ${orgName} on BridgeCircle. Reply to the email if you believe the decision needs another review.`}
    >
      <EmailHeading>Update on your membership request</EmailHeading>
      <EmailText>{greeting(recipientName)}</EmailText>
      <EmailText>
        Thanks for signing up for <strong>{orgName}</strong> on BridgeCircle. After review, the
        admin team wasn&rsquo;t able to approve your membership at this time.
      </EmailText>
      <EmailText>
        If you believe this is a mistake — for example, if you&rsquo;re an alum whose record
        couldn&rsquo;t be matched — reply to this email and the admin team will take another look.
      </EmailText>
    </EmailShell>
  )
}
