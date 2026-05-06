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
  eventTitle: string
  eventStartsAt: string
  eventLocation: string | null
  eventUrl: string
}

export function EventRsvpConfirmationEmail({
  eventTitle,
  eventStartsAt,
  eventLocation,
  eventUrl,
}: Props) {
  const when = new Date(eventStartsAt).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  return (
    <Html>
      <Head />
      <Preview>{`You're going to ${eventTitle}`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>You&apos;re going 🎟️</Heading>
          <Text style={paragraph}>
            <strong>{eventTitle}</strong>
          </Text>
          <Text style={paragraph}>{when}</Text>
          {eventLocation ? <Text style={paragraph}>{eventLocation}</Text> : null}
          <Text style={paragraph}>
            We won&apos;t email reminders, so add it to your calendar now if you want a nudge later.
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href={eventUrl}>
              View event
            </Button>
          </Section>
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
