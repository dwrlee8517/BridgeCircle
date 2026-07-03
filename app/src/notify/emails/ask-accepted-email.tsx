import {
  CivicButton,
  CivicButtonRow,
  CivicEmail,
  CivicHeading,
  CivicPlainLink,
  CivicText,
} from './civic-email'

type Props = {
  helperName: string
  threadUrl: string
  askType?: 'advice' | 'mentorship'
}

export function AskAcceptedEmail({ helperName, threadUrl, askType = 'mentorship' }: Props) {
  const isQuick = askType === 'advice'
  const preview = isQuick
    ? `${helperName} replied to your ask`
    : `${helperName} said yes to your ask`

  return (
    <CivicEmail
      preview={preview}
      footer="You received this because this conversation started through BridgeCircle. You can continue it from the thread."
    >
      <CivicHeading>{isQuick ? 'Your ask has a reply' : 'They said yes'}</CivicHeading>
      <CivicText>
        <strong>{helperName}</strong> {isQuick ? 'replied to' : 'said yes to'} your ask on
        BridgeCircle.
      </CivicText>
      <CivicText>Open the conversation whenever you are ready.</CivicText>
      <CivicButtonRow>
        <CivicButton href={threadUrl}>Open the conversation</CivicButton>
      </CivicButtonRow>
      <CivicPlainLink href={threadUrl} />
    </CivicEmail>
  )
}
