import {
  CivicButton,
  CivicButtonRow,
  CivicEmail,
  CivicHeading,
  CivicPlainLink,
  CivicText,
} from './civic-email'

type Props = {
  mentorName: string
  threadUrl: string
  askType?: 'advice' | 'mentorship'
}

export function MentorshipAcceptedEmail({ mentorName, threadUrl, askType = 'mentorship' }: Props) {
  const isAdvice = askType === 'advice'
  const preview = isAdvice
    ? `${mentorName} replied to your advice request`
    : `${mentorName} accepted your mentorship request`

  return (
    <CivicEmail
      preview={preview}
      footer="You received this because this relationship started through BridgeCircle. You can continue the conversation from the thread."
    >
      <CivicHeading>
        {isAdvice ? 'Your advice request has a reply' : 'Your request was accepted'}
      </CivicHeading>
      <CivicText>
        <strong>{mentorName}</strong>{' '}
        {isAdvice ? 'replied to your advice request' : 'accepted your mentorship request'} on
        BridgeCircle.
      </CivicText>
      <CivicText>Open the thread to continue the conversation.</CivicText>
      <CivicButtonRow>
        <CivicButton href={threadUrl}>Open thread</CivicButton>
      </CivicButtonRow>
      <CivicPlainLink href={threadUrl} />
    </CivicEmail>
  )
}
