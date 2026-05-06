import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'

type Props = {
  recipientName: string | null
  orgName: string
}

export function MembershipRejectedEmail({ recipientName, orgName }: Props) {
  const greeting = recipientName ? `Hi ${recipientName.split(' ')[0]},` : 'Hi,'
  return (
    <Html>
      <Head />
      <Preview>{`Update on your ${orgName} BridgeCircle membership request`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Update on your membership request</Heading>
          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>
            Thanks for signing up for <strong>{orgName}</strong> on BridgeCircle. After review, the
            admin team wasn&apos;t able to approve your membership at this time.
          </Text>
          <Text style={paragraph}>
            If you believe this is a mistake — for example, if you&apos;re an alum whose record we
            couldn&apos;t match — please reply to this email and the admin team will take another
            look.
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
