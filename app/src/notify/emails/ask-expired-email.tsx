import {
  CivicButton,
  CivicButtonRow,
  CivicEmail,
  CivicHeading,
  CivicPlainLink,
  CivicText,
  greeting,
} from './civic-email'

type Props = {
  askerName: string | null
  helperName: string
  detailUrl: string
}

/**
 * Quiet close for an ask that sat unanswered past the expiry window. The
 * job is dignity plus momentum: this wasn't a rejection, and the detail
 * page it links to already shows who else fits with the note carried over.
 */
export function AskExpiredEmail({ askerName, helperName, detailUrl }: Props) {
  return (
    <CivicEmail
      preview={`Your ask to ${helperName} closed quietly`}
      footer="You received this because you sent an ask on BridgeCircle. Asks close on their own after two weeks so nothing sits in limbo."
    >
      <CivicHeading>Your ask closed quietly</CivicHeading>
      <CivicText>{greeting(askerName)}</CivicText>
      <CivicText>
        Your ask to <strong>{helperName}</strong> sat quiet for two weeks, so we closed it — no
        awkward limbo. Capacity comes and goes; this usually isn&rsquo;t about your ask.
      </CivicText>
      <CivicText>
        We&rsquo;ve lined up who else fits, and your note carries over — nothing to rewrite.
      </CivicText>
      <CivicButtonRow>
        <CivicButton href={detailUrl}>See who else fits</CivicButton>
      </CivicButtonRow>
      <CivicPlainLink href={detailUrl} />
    </CivicEmail>
  )
}
