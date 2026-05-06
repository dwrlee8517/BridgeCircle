import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'

type Props = {
  recipientName: string | null
  eventTitle: string
  eventStartsAt: string
  eventLocation: string | null
  reason: string | null
}

export function EventCanceledEmail({
  recipientName,
  eventTitle,
  eventStartsAt,
  eventLocation,
  reason,
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
      <Preview>{`${eventTitle} has been canceled`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>{eventTitle} — canceled</Heading>
          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>
            The admin team has canceled <strong>{eventTitle}</strong>, originally scheduled for{' '}
            <strong>{dateText}</strong>
            {eventLocation ? (
              <>
                {' at '}
                <strong>{eventLocation}</strong>
              </>
            ) : null}
            .
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
            No action needed on your end. Your RSVP has been removed and you won&apos;t see this
            event on the schedule anymore.
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
