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
  fullName: string | null
  schoolName: string
  joinUrl: string
}

export function InviteEmail({ fullName, schoolName, joinUrl }: Props) {
  const preview = `You're invited to join ${schoolName} on BridgeCircle`

  return (
    <EmailShell
      preview={preview}
      footer={`This invite expires in 14 days. You received it because an admin invited this email address to join ${schoolName} on BridgeCircle. If you were not expecting it, you can ignore this message.`}
    >
      <EmailHeading>Join {schoolName} on BridgeCircle</EmailHeading>
      <EmailText>{greeting(fullName)}</EmailText>
      <EmailText>
        You&rsquo;re invited to join the <strong>{schoolName}</strong> alumni network on
        BridgeCircle — a private space for verified alumni to find each other, share advice, and
        stay connected.
      </EmailText>
      <EmailButtonRow>
        <EmailButton href={joinUrl}>Accept invite</EmailButton>
      </EmailButtonRow>
      <EmailPlainLink href={joinUrl} />
    </EmailShell>
  )
}
