import {
  EmailButton,
  EmailButtonRow,
  EmailHeading,
  EmailPlainLink,
  EmailShell,
  EmailText,
} from './email-kit'

type Props = {
  askerName: string
  reviewUrl: string
}

export function AskRequestEmail({ askerName, reviewUrl }: Props) {
  return (
    <EmailShell
      preview={`${askerName} asked for your help`}
      footer="You received this because this member found you through BridgeCircle and asked for help. You can pause or change your availability any time in your help settings."
    >
      <EmailHeading>{askerName} asked for your help</EmailHeading>
      <EmailText>
        <strong>{askerName}</strong> sent you an ask on BridgeCircle.
      </EmailText>
      <EmailText>
        Review what they need, then decide. Passing is always an option — they&rsquo;re never told
        who said no.
      </EmailText>
      <EmailButtonRow>
        <EmailButton href={reviewUrl}>Review the ask</EmailButton>
      </EmailButtonRow>
      <EmailPlainLink href={reviewUrl} />
    </EmailShell>
  )
}
