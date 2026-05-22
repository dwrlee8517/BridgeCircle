import {
  CivicButton,
  CivicButtonRow,
  CivicEmail,
  CivicHeading,
  CivicPlainLink,
  CivicQuote,
  CivicText,
} from './civic-email'

type Props = {
  senderName: string
  reviewUrl: string
  message: string | null
}

export function FriendRequestEmail({ senderName, reviewUrl, message }: Props) {
  return (
    <CivicEmail
      preview={`${senderName} sent you a friend request`}
      footer="You received this because a verified BridgeCircle member asked to connect with you. Friends can message you directly. Declining is not shared with the sender."
    >
      <CivicHeading>New friend request</CivicHeading>
      <CivicText>
        <strong>{senderName}</strong> wants to connect with you on BridgeCircle.
      </CivicText>
      {message ? <CivicQuote>&ldquo;{message}&rdquo;</CivicQuote> : null}
      <CivicButtonRow>
        <CivicButton href={reviewUrl}>Review request</CivicButton>
      </CivicButtonRow>
      <CivicPlainLink href={reviewUrl} />
    </CivicEmail>
  )
}
