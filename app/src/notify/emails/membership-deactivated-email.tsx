import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'

type Props = {
  recipientName: string | null
  orgName: string
  reason: string | null
}

export function MembershipDeactivatedEmail({ recipientName, orgName, reason }: Props) {
  const greeting = recipientName ? `Hi ${recipientName.split(' ')[0]},` : 'Hi,'
  return (
    <Html>
      <Head />
      <Preview>{`Your ${orgName} BridgeCircle access has been deactivated`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Access deactivated</Heading>
          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>
            An admin has deactivated your access to <strong>{orgName}</strong> on BridgeCircle. You
            won't appear in the directory or be reachable for new mentorship requests until you're
            reactivated.
          </Text>
          {reason ? (
            <>
              <Text style={paragraph}>
                <strong>Reason given:</strong>
              </Text>
              <Text style={reasonBlock}>{reason}</Text>
            </>
          ) : null}
          <Text style={paragraph}>
            If you believe this is a mistake, reply to this email and the admin team will take
            another look.
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
