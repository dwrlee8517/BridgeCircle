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
}

export function AskRequestEmail({ askerName, reviewUrl }: Props) {
  return (
    <CivicEmail
      preview={`${askerName} is hoping you can help`}
      footer="You received this because this member found you through BridgeCircle and asked for help. You can pause or change your availability any time in your help settings."
    >
      <CivicHeading>{askerName} is hoping you can help</CivicHeading>
      <CivicText>
        <strong>{askerName}</strong> sent you an ask on BridgeCircle.
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
