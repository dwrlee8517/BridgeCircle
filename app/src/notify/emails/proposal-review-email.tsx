import {
  CivicButton,
  CivicButtonRow,
  CivicCallout,
  CivicEmail,
  CivicHeading,
  CivicLink,
  CivicPlainLink,
  CivicText,
  greeting,
} from './civic-email'

type Props = {
  recipientName: string | null
  reviewUrl: string
  confirmUrl: string
  declineUrl: string
  changeSummary: string
}

/**
 * Monthly LinkedIn refresh: "we found changes, here they are, want to apply?"
 *
 * Confirm = one-click apply. Review = open the review UI with all changes
 * pre-checked. Decline = one-click dismiss. All links carry the same signed
 * token; the route validates it.
 */
export function ProposalReviewEmail({
  recipientName,
  reviewUrl,
  confirmUrl,
  declineUrl,
  changeSummary,
}: Props) {
  return (
    <CivicEmail
      preview="BridgeCircle found updates to your profile from LinkedIn"
      footer="You received this because your profile refresh preference is set to review before update. This proposal expires in 14 days, and you can change refresh preferences from profile settings."
    >
      <CivicHeading>Review profile updates</CivicHeading>
      <CivicText>{greeting(recipientName)}</CivicText>
      <CivicText>Your monthly LinkedIn refresh found a few possible profile changes:</CivicText>
      <CivicCallout>{changeSummary}</CivicCallout>
      <CivicText>Choose how you want BridgeCircle to handle them.</CivicText>
      <CivicButtonRow>
        <CivicButton href={confirmUrl}>Confirm all</CivicButton>
        <CivicButton href={reviewUrl} variant="secondary">
          Review and edit
        </CivicButton>
      </CivicButtonRow>
      <CivicText small>
        Or <CivicLink href={declineUrl}>decline these changes</CivicLink> to skip this refresh.
      </CivicText>
      <CivicPlainLink href={reviewUrl} />
    </CivicEmail>
  )
}
