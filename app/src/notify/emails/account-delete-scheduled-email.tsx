import { CivicCallout, CivicEmail, CivicHeading, CivicText, greeting } from './civic-email'

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
    <CivicEmail
      preview="Your BridgeCircle account has been deactivated"
      footer="You received this because an admin deactivated your BridgeCircle account. Reply to this email if you believe this needs another review."
    >
      <CivicHeading>Account deactivated</CivicHeading>
      <CivicText>{greeting(recipientName)}</CivicText>
      <CivicText>
        An admin deactivated your BridgeCircle account. Your profile is no longer visible and you
        cannot sign in.
      </CivicText>
      <CivicText>Reason given:</CivicText>
      <CivicCallout tone="danger">{reason}</CivicCallout>
      <CivicText>
        If you believe this is a mistake, reply to this email by <strong>{dateText}</strong> and the
        admin team will review.
      </CivicText>
    </CivicEmail>
  )
}
