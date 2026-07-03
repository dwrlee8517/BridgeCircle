import {
  CivicButton,
  CivicButtonRow,
  CivicEmail,
  CivicHeading,
  CivicPlainLink,
  CivicText,
} from './civic-email'

type Props = {
  accepterName: string
  profileUrl: string
}

export function FriendRequestAcceptedEmail({ accepterName, profileUrl }: Props) {
  return (
    <CivicEmail
      preview={`You and ${accepterName} are connected`}
      footer="You received this because your BridgeCircle connection request was accepted. You can now message this member directly."
    >
      <CivicHeading>You are now connected</CivicHeading>
      <CivicText>
        <strong>{accepterName}</strong> accepted — you are in each other&apos;s circle on
        BridgeCircle.
      </CivicText>
      <CivicText>You can now message them directly from their profile or your inbox.</CivicText>
      <CivicButtonRow>
        <CivicButton href={profileUrl}>View their profile</CivicButton>
      </CivicButtonRow>
      <CivicPlainLink href={profileUrl} />
    </CivicEmail>
  )
}
