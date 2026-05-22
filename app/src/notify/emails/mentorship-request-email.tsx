import {
  CivicButton,
  CivicButtonRow,
  CivicEmail,
  CivicHeading,
  CivicPlainLink,
  CivicText,
} from './civic-email'

type Props = {
  menteeName: string
  reviewUrl: string
  askType?: 'advice' | 'mentorship'
}

export function MentorshipRequestEmail({ menteeName, reviewUrl, askType = 'mentorship' }: Props) {
  const isAdvice = askType === 'advice'
  const preview = isAdvice
    ? `${menteeName} asked you for advice`
    : `${menteeName} sent you a mentorship request`

  return (
    <CivicEmail
      preview={preview}
      footer={
        isAdvice
          ? 'You received this because this member found you through BridgeCircle and asked for advice. You can review the request before responding.'
          : 'You received this because you are listed as open to mentor on BridgeCircle. You can pause or close mentoring any time in your mentor settings.'
      }
    >
      <CivicHeading>{isAdvice ? 'New advice request' : 'New mentorship request'}</CivicHeading>
      <CivicText>
        <strong>{menteeName}</strong> sent you{' '}
        {isAdvice ? 'an advice request' : 'a mentorship request'} on BridgeCircle.
      </CivicText>
      <CivicText>
        Review what they are asking for, then decide whether you can help from your inbox.
      </CivicText>
      <CivicButtonRow>
        <CivicButton href={reviewUrl}>Review request</CivicButton>
      </CivicButtonRow>
      <CivicPlainLink href={reviewUrl} />
    </CivicEmail>
  )
}
