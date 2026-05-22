import {
  CivicButton,
  CivicButtonRow,
  CivicCallout,
  CivicEmail,
  CivicHeading,
  CivicPlainLink,
  CivicText,
} from './civic-email'

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
    <CivicEmail
      preview={`You're going to ${eventTitle}`}
      footer="You received this because you RSVP'd to a BridgeCircle event. We do not send event reminders, so add it to your calendar if you want a nudge later."
    >
      <CivicHeading>You are going</CivicHeading>
      <CivicText>
        <strong>{eventTitle}</strong>
      </CivicText>
      <CivicCallout>
        {when}
        {eventLocation ? `\n${eventLocation}` : ''}
      </CivicCallout>
      <CivicButtonRow>
        <CivicButton href={eventUrl}>View event</CivicButton>
      </CivicButtonRow>
      <CivicPlainLink href={eventUrl} />
    </CivicEmail>
  )
}
