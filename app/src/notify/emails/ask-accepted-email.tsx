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
}

export function AskAcceptedEmail({ helperName, threadUrl }: Props) {
  return (
    <CivicEmail
      preview={`${helperName} said yes`}
      footer="You received this because this conversation started through BridgeCircle. You can continue it from the thread."
    >
      <CivicHeading>{helperName} said yes</CivicHeading>
      <CivicText>
        <strong>{helperName}</strong> said yes to your ask on BridgeCircle.
      </CivicText>
      <CivicText>Open the conversation whenever you are ready.</CivicText>
      <CivicButtonRow>
        <CivicButton href={threadUrl}>Open the conversation</CivicButton>
      </CivicButtonRow>
      <CivicPlainLink href={threadUrl} />
    </CivicEmail>
  )
}
