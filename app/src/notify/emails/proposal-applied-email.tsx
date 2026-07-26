import {
  EmailButton,
  EmailButtonRow,
  EmailCallout,
  EmailHeading,
  EmailPlainLink,
  EmailShell,
  EmailText,
  greeting,
} from './email-kit'

type Props = {
  recipientName: string | null
  undoUrl: string
  changeSummary: string
}

/**
 * Sent to members on `auto_apply_and_notify` after the monthly sweep silently
 * applies a change. Single Undo button reverses the apply by marking the
 * proposal declined and restoring profiles to the prior snapshot.
 */
export function ProposalAppliedEmail({ recipientName, undoUrl, changeSummary }: Props) {
  return (
    <EmailShell
      preview="BridgeCircle updated your profile from LinkedIn"
      footer="You received this because your profile refresh preference allows BridgeCircle to apply LinkedIn updates automatically. You can switch back to review-before-update from profile settings."
    >
      <EmailHeading>Your profile was updated</EmailHeading>
      <EmailText>{greeting(recipientName)}</EmailText>
      <EmailText>BridgeCircle applied these updates from your latest LinkedIn data:</EmailText>
      <EmailCallout>{changeSummary}</EmailCallout>
      <EmailButtonRow>
        <EmailButton href={undoUrl}>Undo this update</EmailButton>
      </EmailButtonRow>
      <EmailPlainLink href={undoUrl} />
    </EmailShell>
  )
}
