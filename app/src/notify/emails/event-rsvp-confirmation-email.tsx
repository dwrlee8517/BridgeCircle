import {
  EmailButton,
  EmailButtonRow,
  EmailCallout,
  EmailHeading,
  EmailPlainLink,
  EmailShell,
  EmailText,
} from './email-kit'

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
    <EmailShell
      preview={`You're going to ${eventTitle}`}
      footer="You received this because you RSVP'd to a BridgeCircle event. We do not send event reminders, so add it to your calendar if you want a nudge later."
    >
      <EmailHeading>You&rsquo;re going</EmailHeading>
      <EmailText>
        <strong>{eventTitle}</strong>
      </EmailText>
      <EmailCallout>
        {when}
        {eventLocation ? `\n${eventLocation}` : ''}
      </EmailCallout>
      <EmailButtonRow>
        <EmailButton href={eventUrl}>View event</EmailButton>
      </EmailButtonRow>
      <EmailPlainLink href={eventUrl} />
    </EmailShell>
  )
}
