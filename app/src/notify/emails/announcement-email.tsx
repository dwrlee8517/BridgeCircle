import {
  EmailButton,
  EmailButtonRow,
  EmailCallout,
  EmailHeading,
  EmailPlainLink,
  EmailShell,
  EmailText,
  greeting,
} from './email-kit'

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
    <EmailShell
      preview={`${orgName}: ${title}`}
      footer={`You received this because you are an active member of ${orgName} on BridgeCircle. Announcements also appear on the School page.`}
    >
      <EmailText small>{orgName}</EmailText>
      <EmailHeading>{title}</EmailHeading>
      <EmailText>{greeting(recipientName)}</EmailText>
      {body ? <EmailCallout>{body}</EmailCallout> : null}
      <EmailButtonRow>
        <EmailButton href={announcementsUrl}>View on BridgeCircle</EmailButton>
      </EmailButtonRow>
      <EmailPlainLink href={announcementsUrl} />
    </EmailShell>
  )
}
