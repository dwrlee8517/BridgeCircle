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
  mentorName: string
  threadUrl: string
}

export function MentorshipAcceptedEmail({ mentorName, threadUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>{`${mentorName} accepted your mentorship request`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>{mentorName} said yes 🎉</Heading>
          <Text style={paragraph}>
            <strong>{mentorName}</strong> accepted your mentorship request on BridgeCircle.
          </Text>
          <Text style={paragraph}>
            Open the thread to introduce yourself and figure out a time to chat.
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href={threadUrl}>
              Open thread
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body = {
  backgroundColor: '#f6f6f6',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
