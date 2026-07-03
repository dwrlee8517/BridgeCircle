import {
  CivicButton,
  CivicButtonRow,
  CivicEmail,
  CivicHeading,
  CivicPlainLink,
  CivicText,
} from './civic-email'

type Props = {
  askerName: string
  reviewUrl: string
  askType?: 'advice' | 'mentorship'
}

export function AskRequestEmail({ askerName, reviewUrl, askType = 'mentorship' }: Props) {
  const isQuick = askType === 'advice'
  const preview = isQuick
    ? `${askerName} asked you a quick question`
    : `${askerName} asked for your ongoing help`

  return (
    <CivicEmail
      preview={preview}
      footer={
        isQuick
          ? 'You received this because this member found you through BridgeCircle and asked for help. You can review the ask before responding.'
          : "You received this because you're open to helping on BridgeCircle. You can pause or change this any time in your help settings."
      }
    >
      <CivicHeading>
        {isQuick ? 'A quick question for you' : 'An ask for ongoing help'}
      </CivicHeading>
      <CivicText>
        <strong>{askerName}</strong> asked you {isQuick ? 'a quick question' : 'for ongoing help'}{' '}
        on BridgeCircle.
      </CivicText>
      <CivicText>
        Review what they need, then decide from your inbox. Passing quietly is always an option —
        they are never told who said no.
      </CivicText>
      <CivicButtonRow>
        <CivicButton href={reviewUrl}>Review the ask</CivicButton>
      </CivicButtonRow>
      <CivicPlainLink href={reviewUrl} />
    </CivicEmail>
  )
}
