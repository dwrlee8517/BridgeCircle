import {
  EmailButton,
  EmailButtonRow,
  EmailHeading,
  EmailPlainLink,
  EmailShell,
  EmailText,
} from './email-kit'

type Props = {
  accepterName: string
  profileUrl: string
}

export function ConnectRequestAcceptedEmail({ accepterName, profileUrl }: Props) {
  return (
    <EmailShell
      preview={`You and ${accepterName} are connected`}
      footer="You received this because your BridgeCircle connection request was accepted. You can now message this member directly."
    >
      <EmailHeading>You&rsquo;re connected</EmailHeading>
      <EmailText>
        <strong>{accepterName}</strong> accepted — you&rsquo;re in each other&apos;s circle on
        BridgeCircle.
      </EmailText>
      <EmailText>You can now message them directly from their profile or Messages.</EmailText>
      <EmailButtonRow>
        <EmailButton href={profileUrl}>View their profile</EmailButton>
      </EmailButtonRow>
      <EmailPlainLink href={profileUrl} />
    </EmailShell>
  )
}
