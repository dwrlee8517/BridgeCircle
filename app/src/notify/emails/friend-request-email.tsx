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
  senderName: string
  reviewUrl: string
  message: string | null
}

export function FriendRequestEmail({ senderName, reviewUrl, message }: Props) {
  return (
    <Html>
      <Head />
      <Preview>{`${senderName} sent you a friend request`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>New friend request</Heading>
          <Text style={paragraph}>
            <strong>{senderName}</strong> wants to connect with you on BridgeCircle.
          </Text>
          {message ? <Text style={quote}>&ldquo;{message}&rdquo;</Text> : null}
          <Section style={buttonSection}>
            <Button style={button} href={reviewUrl}>
              Review request
            </Button>
          </Section>
          <Text style={footer}>
            Friends can message you directly. You can ignore or decline this request — declining is
            not shared with the sender.
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
const quote = {
  fontSize: '15px',
  lineHeight: '22px',
  color: '#555',
  margin: '12px 0',
  padding: '8px 14px',
  borderLeft: '3px solid #ddd',
  fontStyle: 'italic' as const,
}
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
