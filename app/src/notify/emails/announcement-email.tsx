import {
  CivicButton,
  CivicButtonRow,
  CivicCallout,
  CivicEmail,
  CivicHeading,
  CivicPlainLink,
  CivicText,
  greeting,
} from './civic-email'

type Props = {
  recipientName: string | null
  orgName: string
  title: string
  body: string | null
  announcementsUrl: string
}

export function AnnouncementEmail({
  recipientName,
  orgName,
  title,
  body,
  announcementsUrl,
}: Props) {
  return (
    <CivicEmail
      preview={`${orgName}: ${title}`}
      footer={`You received this because you are an active member of ${orgName} on BridgeCircle. Admin announcements also appear in your BridgeCircle inbox.`}
    >
      <CivicText small>{orgName}</CivicText>
      <CivicHeading>{title}</CivicHeading>
      <CivicText>{greeting(recipientName)}</CivicText>
      {body ? <CivicCallout>{body}</CivicCallout> : null}
      <CivicButtonRow>
        <CivicButton href={announcementsUrl}>View on BridgeCircle</CivicButton>
      </CivicButtonRow>
      <CivicPlainLink href={announcementsUrl} />
    </CivicEmail>
  )
}
