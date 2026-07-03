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
  recipientName: string | null
  orgName: string
  signInUrl: string
}

export function MembershipApprovedEmail({ recipientName, orgName, signInUrl }: Props) {
  const preview = `You're approved - welcome to ${orgName} on BridgeCircle`

  return (
    <CivicEmail
      preview={preview}
      footer={`You received this because an admin approved your ${orgName} BridgeCircle membership. Keep your profile current so other verified members can find you.`}
    >
      <CivicHeading>Welcome to {orgName} on BridgeCircle</CivicHeading>
      <CivicText>{greeting(recipientName)}</CivicText>
      <CivicText>
        An admin approved your membership in <strong>{orgName}</strong>. You now have access to
        search alumni, ask for help, RSVP to events, and connect with classmates.
      </CivicText>
      <CivicButtonRow>
        <CivicButton href={signInUrl}>Sign in</CivicButton>
      </CivicButtonRow>
      <CivicPlainLink href={signInUrl} />
    </CivicEmail>
  )
}
