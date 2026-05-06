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
  eventTitle: string
  eventStartsAt: string
  eventLocation: string | null
  eventUrl: string
}

export function EventWaitlistPromotedEmail({
  recipientName,
  eventTitle,
  eventStartsAt,
  eventLocation,
  eventUrl,
}: Props) {
  const greeting = recipientName ? `Hi ${recipientName.split(' ')[0]},` : 'Hi,'
  const dateText = new Date(eventStartsAt).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
  return (
    <Html>
      <Head />
      <Preview>{`A spot opened up for ${eventTitle}`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>You&apos;re in 🎉</Heading>
          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>
            A spot just opened up for <strong>{eventTitle}</strong>, and you&apos;ve been moved off
            the waitlist. You&apos;re now confirmed for <strong>{dateText}</strong>
            {eventLocation ? (
              <>
                {' at '}
                <strong>{eventLocation}</strong>
              </>
            ) : null}
            .
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href={eventUrl}>
              View event
            </Button>
          </Section>
          <Text style={footer}>
            If you can no longer attend, please update your RSVP so the next person on the waitlist
            can take your spot.
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
