import {
  EmailButton,
  EmailButtonRow,
  EmailHeading,
  EmailPlainLink,
  EmailShell,
  EmailText,
  greeting,
} from './email-kit'

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
    <EmailShell
      preview={`Your ask to ${helperName} has closed`}
      footer="You received this because you sent an ask on BridgeCircle. Asks close on their own after two weeks so nothing sits in limbo."
    >
      <EmailHeading>Your ask to {helperName} has closed</EmailHeading>
      <EmailText>{greeting(askerName)}</EmailText>
      <EmailText>
        Two weeks passed without a reply, so the ask closed on its own. This usually isn&rsquo;t
        about your ask — capacity comes and goes.
      </EmailText>
      <EmailText>Your note carries over to whoever you pick next — nothing to rewrite.</EmailText>
      <EmailButtonRow>
        <EmailButton href={detailUrl}>See who else fits</EmailButton>
      </EmailButtonRow>
      <EmailPlainLink href={detailUrl} />
    </EmailShell>
  )
}
