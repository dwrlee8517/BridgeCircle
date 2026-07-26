import {
  EmailButton,
  EmailButtonRow,
  EmailHeading,
  EmailPlainLink,
  EmailQuote,
  EmailShell,
  EmailText,
  firstName,
  greeting,
} from './email-kit'

type Props = {
  helperName: string | null
  askerName: string
  askExcerpt: string | null
  reviewUrl: string
}

/**
 * The asker's one gentle reminder, as the helper receives it. Deliberately
 * neutral — it resurfaces the note, never reads as a complaint, and the
 * footer carries the two-sided promise: passing quietly is a fine outcome.
 */
export function AskReminderEmail({ helperName, askerName, askExcerpt, reviewUrl }: Props) {
  const askerFirst = firstName(askerName) ?? askerName

  return (
    <EmailShell
      preview={`${askerName}'s ask is still open`}
      footer="You received this because you're open to helping on BridgeCircle. You can pause new asks anytime from your helper settings."
    >
      <EmailHeading>{askerName}&rsquo;s ask is still open</EmailHeading>
      <EmailText>{greeting(helperName)}</EmailText>
      <EmailText>Resurfacing it once, in case it slipped by:</EmailText>
      {askExcerpt ? <EmailQuote>&ldquo;{askExcerpt}&rdquo;</EmailQuote> : null}
      <EmailButtonRow>
        <EmailButton href={reviewUrl}>Read {askerFirst}&rsquo;s ask</EmailButton>
      </EmailButtonRow>
      <EmailText small>
        If now isn&rsquo;t right, passing is okay — {askerFirst} will be pointed to someone else.
      </EmailText>
      <EmailPlainLink href={reviewUrl} />
    </EmailShell>
  )
}
