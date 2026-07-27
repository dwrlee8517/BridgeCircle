import {
  EmailButton,
  EmailButtonRow,
  EmailHeading,
  EmailPlainLink,
  EmailQuote,
  EmailShell,
  EmailText,
} from './email-kit'

type Props = {
  senderName: string
  reviewUrl: string
  message: string | null
}

export function ConnectRequestEmail({ senderName, reviewUrl, message }: Props) {
  return (
    <EmailShell
      preview={`${senderName} would like to connect`}
      footer="You received this because a verified BridgeCircle member asked to connect with you. Connections can message you directly. Declining is not shared with the sender."
    >
      <EmailHeading>{senderName} would like to connect</EmailHeading>
      <EmailText>
        <strong>{senderName}</strong> wants you in their circle on BridgeCircle.
      </EmailText>
      {message ? <EmailQuote>&ldquo;{message}&rdquo;</EmailQuote> : null}
      <EmailButtonRow>
        <EmailButton href={reviewUrl}>Review request</EmailButton>
      </EmailButtonRow>
      <EmailPlainLink href={reviewUrl} />
    </EmailShell>
  )
}
