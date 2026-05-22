import {
  CivicButton,
  CivicButtonRow,
  CivicCallout,
  CivicEmail,
  CivicHeading,
  CivicPlainLink,
  CivicText,
  greeting,
} from './civic-email'

type Props = {
  recipientName: string | null
  undoUrl: string
  changeSummary: string
}

/**
 * Sent to members on `auto_apply_and_notify` after the monthly sweep silently
 * applies a change. Single Undo button reverses the apply by marking the
 * proposal declined and restoring base_profiles to the prior snapshot.
 */
export function ProposalAppliedEmail({ recipientName, undoUrl, changeSummary }: Props) {
  return (
    <CivicEmail
      preview="BridgeCircle updated your profile from LinkedIn"
      footer="You received this because your profile refresh preference allows BridgeCircle to apply LinkedIn updates automatically. You can switch back to review-before-update from profile settings."
    >
      <CivicHeading>Your profile was updated</CivicHeading>
      <CivicText>{greeting(recipientName)}</CivicText>
      <CivicText>BridgeCircle applied these updates from your latest LinkedIn data:</CivicText>
      <CivicCallout>{changeSummary}</CivicCallout>
      <CivicButtonRow>
        <CivicButton href={undoUrl}>Undo this update</CivicButton>
      </CivicButtonRow>
      <CivicPlainLink href={undoUrl} />
    </CivicEmail>
  )
}
