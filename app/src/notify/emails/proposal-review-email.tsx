import {
  EmailButton,
  EmailButtonRow,
  EmailCallout,
  EmailHeading,
  EmailLink,
  EmailPlainLink,
  EmailShell,
  EmailText,
  greeting,
} from './email-kit'

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
    <EmailShell
      preview="BridgeCircle found updates to your profile from LinkedIn"
      footer="You received this because your profile refresh preference is set to review before update. This proposal expires in 14 days, and you can change refresh preferences from profile settings."
    >
      <EmailHeading>Review profile updates</EmailHeading>
      <EmailText>{greeting(recipientName)}</EmailText>
      <EmailText>Your monthly LinkedIn refresh found a few possible profile changes:</EmailText>
      <EmailCallout>{changeSummary}</EmailCallout>
      <EmailText>Choose how you want BridgeCircle to handle them.</EmailText>
      <EmailButtonRow>
        <EmailButton href={confirmUrl}>Confirm all</EmailButton>
        <EmailButton href={reviewUrl} variant="secondary">
          Review and edit
        </EmailButton>
      </EmailButtonRow>
      <EmailText small>
        Or <EmailLink href={declineUrl}>decline these changes</EmailLink> to skip this refresh.
      </EmailText>
      <EmailPlainLink href={reviewUrl} />
    </EmailShell>
  )
}
