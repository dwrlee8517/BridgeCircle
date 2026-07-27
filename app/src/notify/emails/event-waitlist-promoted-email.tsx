import {
  EmailButton,
  EmailButtonRow,
  EmailHeading,
  EmailPlainLink,
  EmailShell,
  EmailText,
  greeting,
} from './email-kit'

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
    <EmailShell
      preview={`A spot opened up for ${eventTitle}`}
      footer="You received this because you were on the waitlist for this BridgeCircle event. If you can no longer attend, update your RSVP so the next person can take the spot."
    >
      <EmailHeading>You&rsquo;re off the waitlist</EmailHeading>
      <EmailText>{greeting(recipientName)}</EmailText>
      <EmailText>
        A spot opened up for <strong>{eventTitle}</strong>, and you&rsquo;re confirmed for{' '}
        <strong>{dateText}</strong>
        {eventLocation ? (
          <>
            {' at '}
            <strong>{eventLocation}</strong>
          </>
        ) : null}
        .
      </EmailText>
      <EmailButtonRow>
        <EmailButton href={eventUrl}>View event</EmailButton>
      </EmailButtonRow>
      <EmailPlainLink href={eventUrl} />
    </EmailShell>
  )
}
