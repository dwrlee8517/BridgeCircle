import {
  CivicButton,
  CivicButtonRow,
  CivicEmail,
  CivicHeading,
  CivicPlainLink,
  CivicText,
  greeting,
} from './civic-email'

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
  const dateText = new Date(eventStartsAt).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <CivicEmail
      preview={`A spot opened up for ${eventTitle}`}
      footer="You received this because you were on the waitlist for this BridgeCircle event. If you can no longer attend, update your RSVP so the next person can take the spot."
    >
      <CivicHeading>You are off the waitlist</CivicHeading>
      <CivicText>{greeting(recipientName)}</CivicText>
      <CivicText>
        A spot opened up for <strong>{eventTitle}</strong>, and you are now confirmed for{' '}
        <strong>{dateText}</strong>
        {eventLocation ? (
          <>
            {' at '}
            <strong>{eventLocation}</strong>
          </>
        ) : null}
        .
      </CivicText>
      <CivicButtonRow>
        <CivicButton href={eventUrl}>View event</CivicButton>
      </CivicButtonRow>
      <CivicPlainLink href={eventUrl} />
    </CivicEmail>
  )
}
