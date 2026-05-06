import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'

type Props = {
  recipientName: string | null
  reason: string
  scheduledFor: string // ISO timestamp
}

export function AccountDeleteScheduledEmail({ recipientName, reason, scheduledFor }: Props) {
  const greeting = recipientName ? `Hi ${recipientName.split(' ')[0]},` : 'Hi,'
  // Format the date for human consumption. Email clients can't run JS, so we
  // pre-format here. Long-form like "May 6, 2026".
  const dateText = new Date(scheduledFor).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Html>
      <Head />
      <Preview>Your BridgeCircle account has been deactivated</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Account deactivated</Heading>
          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>
            An admin has deactivated your BridgeCircle account. Your profile is no longer visible
            and you can&apos;t sign in.
          </Text>
          <Text style={paragraph}>
            <strong>Reason given:</strong>
          </Text>
          <Text style={reasonBlock}>{reason}</Text>
          <Text style={paragraph}>
            If you believe this is a mistake, reply to this email by <strong>{dateText}</strong> and
            the admin team will review.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const body = {
  backgroundColor: '#f6f6f6',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}
const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '32px',
  maxWidth: '560px',
  borderRadius: '8px',
}
const heading = { fontSize: '22px', fontWeight: '600', color: '#111', margin: '0 0 16px' }
const paragraph = { fontSize: '16px', lineHeight: '24px', color: '#333', margin: '0 0 12px' }
const reasonBlock = {
  fontSize: '15px',
  lineHeight: '22px',
  color: '#444',
  backgroundColor: '#f3f4f6',
  borderLeft: '3px solid #9ca3af',
  padding: '12px 16px',
  borderRadius: '4px',
  margin: '0 0 16px',
}
