import { CivicCallout, CivicEmail, CivicHeading, CivicText, greeting } from './civic-email'

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
  const dateText = new Date(eventStartsAt).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <CivicEmail
      preview={`${eventTitle} has been canceled`}
      footer="You received this because you had RSVP'd to this BridgeCircle event. No action is needed; your RSVP has been removed."
    >
      <CivicHeading>{eventTitle} has been canceled</CivicHeading>
      <CivicText>{greeting(recipientName)}</CivicText>
      <CivicText>
        The admin team canceled <strong>{eventTitle}</strong>, originally scheduled for{' '}
        <strong>{dateText}</strong>
        {eventLocation ? (
          <>
            {' at '}
            <strong>{eventLocation}</strong>
          </>
        ) : null}
        .
      </CivicText>
      {reason ? (
        <>
          <CivicText>Reason given:</CivicText>
          <CivicCallout>{reason}</CivicCallout>
        </>
      ) : null}
      <CivicText>
        No action is needed on your end. You will not see this event on the schedule anymore.
      </CivicText>
    </CivicEmail>
  )
}
