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
  menteeName: string
  reviewUrl: string
}

export function MentorshipRequestEmail({ menteeName, reviewUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>{`${menteeName} sent you a mentorship request`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>New mentorship request</Heading>
          <Text style={paragraph}>
            <strong>{menteeName}</strong> sent you a mentorship request on BridgeCircle.
          </Text>
          <Text style={paragraph}>
            Take a look — you can read what they're asking for and either accept or decline.
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href={reviewUrl}>
              Review request
            </Button>
          </Section>
          <Text style={footer}>
            You're receiving this because you're listed as open to mentor on BridgeCircle. You can
            pause or close mentoring any time in your mentor settings.
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
const footer = { fontSize: '12px', color: '#999', margin: '32px 0 0' }
