import { EmailCallout, EmailHeading, EmailShell, EmailText, greeting } from './email-kit'

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
    <EmailShell
      preview={`${eventTitle} has been canceled`}
      footer="You received this because you had RSVP'd to this BridgeCircle event. No action is needed; your RSVP has been removed."
    >
      <EmailHeading>{eventTitle} has been canceled</EmailHeading>
      <EmailText>{greeting(recipientName)}</EmailText>
      <EmailText>
        The admin team canceled <strong>{eventTitle}</strong>, originally scheduled for{' '}
        <strong>{dateText}</strong>
        {eventLocation ? (
          <>
            {' at '}
            <strong>{eventLocation}</strong>
          </>
        ) : null}
        .
      </EmailText>
      {reason ? (
        <>
          <EmailText>Reason given:</EmailText>
          <EmailCallout>{reason}</EmailCallout>
        </>
      ) : null}
      <EmailText>No action is needed on your end.</EmailText>
    </EmailShell>
  )
}
