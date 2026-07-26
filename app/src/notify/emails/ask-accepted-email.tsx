import {
  EmailButton,
  EmailButtonRow,
  EmailHeading,
  EmailPlainLink,
  EmailShell,
  EmailText,
} from './email-kit'

type Props = {
  helperName: string
  threadUrl: string
}

export function AskAcceptedEmail({ helperName, threadUrl }: Props) {
  return (
    <EmailShell
      preview={`${helperName} accepted your ask`}
      footer="You received this because this conversation started through BridgeCircle. You can continue it from the thread."
    >
      <EmailHeading>{helperName} accepted your ask</EmailHeading>
      <EmailText>
        <strong>{helperName}</strong> accepted your ask on BridgeCircle.
      </EmailText>
      <EmailText>Open the conversation whenever you&rsquo;re ready.</EmailText>
      <EmailButtonRow>
        <EmailButton href={threadUrl}>Open the conversation</EmailButton>
      </EmailButtonRow>
      <EmailPlainLink href={threadUrl} />
    </EmailShell>
  )
}
