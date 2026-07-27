import {
  EmailButton,
  EmailButtonRow,
  EmailHeading,
  EmailPlainLink,
  EmailShell,
  EmailText,
} from './email-kit'

type Props = {
  recipientName: string
  heading: string
  body: string
  actionLabel: string
  actionUrl: string
}

export function HelpNotificationEmail({
  recipientName,
  heading,
  body,
  actionLabel,
  actionUrl,
}: Props) {
  return (
    <EmailShell
      preview={heading}
      footer="You received this because of your Help activity or availability on BridgeCircle. You can change email preferences in your settings."
    >
      <EmailHeading>{heading}</EmailHeading>
      <EmailText>Hi {recipientName},</EmailText>
      <EmailText>{body}</EmailText>
      <EmailButtonRow>
        <EmailButton href={actionUrl}>{actionLabel}</EmailButton>
      </EmailButtonRow>
      <EmailPlainLink href={actionUrl} />
    </EmailShell>
  )
}
