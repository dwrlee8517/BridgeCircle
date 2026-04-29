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
  title: string
  body: string | null
  announcementsUrl: string
}

export function AnnouncementEmail({
  recipientName,
  orgName,
  title,
  body,
  announcementsUrl,
}: Props) {
  const greeting = recipientName ? `Hi ${recipientName.split(' ')[0]},` : 'Hi,'
  return (
    <Html>
      <Head />
      <Preview>{`${orgName}: ${title}`}</Preview>
      <BodyEl>
        <Container style={container}>
          <Text style={kicker}>{orgName}</Text>
          <Heading style={heading}>{title}</Heading>
          <Text style={paragraph}>{greeting}</Text>
          {body ? <Text style={{ ...paragraph, whiteSpace: 'pre-line' }}>{body}</Text> : null}
          <Section style={buttonSection}>
            <Button style={button} href={announcementsUrl}>
              View on BridgeCircle
            </Button>
          </Section>
          <Text style={footer}>
            You're receiving this because you're an active member of {orgName} on BridgeCircle.
          </Text>
        </Container>
      </BodyEl>
    </Html>
  )
}

// React-email's Body alias to avoid clashing with our local body style object.
function BodyEl({ children }: { children: React.ReactNode }) {
  return <Body style={bodyStyle}>{children}</Body>
}

const bodyStyle = {
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
const kicker = {
  fontSize: '12px',
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const,
  color: '#6b7280',
  margin: '0 0 8px',
}
const heading = { fontSize: '22px', fontWeight: '600', color: '#111', margin: '0 0 16px' }
const paragraph = { fontSize: '16px', lineHeight: '24px', color: '#333', margin: '0 0 12px' }
const footer = { fontSize: '12px', lineHeight: '18px', color: '#6b7280', margin: '24px 0 0' }
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
