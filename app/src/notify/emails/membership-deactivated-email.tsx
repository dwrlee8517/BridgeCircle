import { EmailCallout, EmailHeading, EmailShell, EmailText, greeting } from './email-kit'

type Props = {
  recipientName: string | null
  orgName: string
  reason: string | null
}

export function MembershipDeactivatedEmail({ recipientName, orgName, reason }: Props) {
  const preview = `Your ${orgName} BridgeCircle access has been deactivated`

  return (
    <EmailShell
      preview={preview}
      footer={`You received this because an admin changed your ${orgName} BridgeCircle membership status. Reply to this email if you believe this needs another review.`}
    >
      <EmailHeading>Access deactivated</EmailHeading>
      <EmailText>{greeting(recipientName)}</EmailText>
      <EmailText>
        An admin deactivated your access to <strong>{orgName}</strong> on BridgeCircle. You
        won&rsquo;t appear in the directory or be reachable for new asks unless your access is
        restored.
      </EmailText>
      {reason ? (
        <>
          <EmailText>Reason given:</EmailText>
          <EmailCallout tone="danger">{reason}</EmailCallout>
        </>
      ) : null}
      <EmailText>
        If you believe this is a mistake, reply to this email and the admin team will take another
        look.
      </EmailText>
    </EmailShell>
  )
}
