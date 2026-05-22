import {
  CivicButton,
  CivicButtonRow,
  CivicEmail,
  CivicHeading,
  CivicPlainLink,
  CivicText,
  greeting,
} from './civic-email'

type Props = {
  fullName: string | null
  schoolName: string
  joinUrl: string
}

export function InviteEmail({ fullName, schoolName, joinUrl }: Props) {
  const preview = `You're invited to join ${schoolName} on BridgeCircle`

  return (
    <CivicEmail
      preview={preview}
      footer={`This invite expires in 14 days. You received it because an admin invited this email address to join ${schoolName} on BridgeCircle. If you were not expecting it, you can ignore this message.`}
    >
      <CivicHeading>Join {schoolName} on BridgeCircle</CivicHeading>
      <CivicText>{greeting(fullName)}</CivicText>
      <CivicText>
        You have been invited to join the <strong>{schoolName}</strong> alumni network on
        BridgeCircle - a private space for verified alumni to find each other, share advice, and
        stay connected.
      </CivicText>
      <CivicButtonRow>
        <CivicButton href={joinUrl}>Accept invite</CivicButton>
      </CivicButtonRow>
      <CivicPlainLink href={joinUrl} />
    </CivicEmail>
  )
}
