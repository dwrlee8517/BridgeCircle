import {
  CivicButton,
  CivicButtonRow,
  CivicEmail,
  CivicHeading,
  CivicPlainLink,
  CivicText,
} from './civic-email'

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
    <CivicEmail
      preview={heading}
      footer="You received this because of your Help activity or availability on BridgeCircle. You can change email preferences in your settings."
    >
      <CivicHeading>{heading}</CivicHeading>
      <CivicText>Hi {recipientName},</CivicText>
      <CivicText>{body}</CivicText>
      <CivicButtonRow>
        <CivicButton href={actionUrl}>{actionLabel}</CivicButton>
      </CivicButtonRow>
      <CivicPlainLink href={actionUrl} />
    </CivicEmail>
  )
}
