import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

type Props = {
  recipientName: string | null
  orgName: string
  signInUrl: string
}

export function MembershipApprovedEmail({ recipientName, orgName, signInUrl }: Props) {
  const greeting = recipientName ? `Hi ${recipientName.split(' ')[0]},` : 'Hi,'
  return (
    <Html>
      <Head />
      <Preview>{`You're approved — welcome to ${orgName} on BridgeCircle`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>You're in 🎉</Heading>
          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>
            An admin just approved your membership in <strong>{orgName}</strong> on BridgeCircle.
            You now have full access to search alumni, request mentorship, RSVP to events, and
            connect with classmates.
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href={signInUrl}>
              Sign in
            </Button>
          </Section>
          <Text style={footer}>
            Tip: fill out your profile so other alumni can find you. The more complete your profile,
            the better the matches.
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
const footer = { fontSize: '14px', lineHeight: '22px', color: '#666', margin: '24px 0 0' }
const buttonSection = { margin: '24px 0' }
const button = {
  backgroundColor: '#111',
  color: '#fff',
  padding: '12px 24px',
  borderRadius: '6px',
  fontSize: '15px',
  fontWeight: '500',
  textDecoration: 'none',
  display: 'inline-block',
}
