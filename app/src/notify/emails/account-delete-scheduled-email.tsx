import { EmailCallout, EmailHeading, EmailShell, EmailText, greeting } from './email-kit'

type Props = {
  recipientName: string | null
  reason: string
  scheduledFor: string
}

export function AccountDeleteScheduledEmail({ recipientName, reason, scheduledFor }: Props) {
  const dateText = new Date(scheduledFor).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <EmailShell
      preview="Your BridgeCircle account has been deactivated"
      footer="You received this because an admin deactivated your BridgeCircle account. Reply to this email if you believe this needs another review."
    >
      <EmailHeading>Account deactivated</EmailHeading>
      <EmailText>{greeting(recipientName)}</EmailText>
      <EmailText>
        An admin deactivated your BridgeCircle account. Your profile is no longer visible and you
        cannot sign in.
      </EmailText>
      <EmailText>Reason given:</EmailText>
      <EmailCallout tone="danger">{reason}</EmailCallout>
      <EmailText>
        If you believe this is a mistake, reply to this email by <strong>{dateText}</strong> and the
        admin team will review.
      </EmailText>
    </EmailShell>
  )
}
