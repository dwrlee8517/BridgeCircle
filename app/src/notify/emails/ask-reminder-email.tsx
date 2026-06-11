import {
  CivicButton,
  CivicButtonRow,
  CivicEmail,
  CivicHeading,
  CivicPlainLink,
  CivicQuote,
  CivicText,
  firstName,
  greeting,
} from './civic-email'

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
    <CivicEmail
      preview={`${askerName}'s ask is still open — when you have a minute`}
      footer="You received this because you're open to helping on BridgeCircle. You can pause new asks anytime from your helper settings."
    >
      <CivicHeading>An open ask, resurfaced</CivicHeading>
      <CivicText>{greeting(helperName)}</CivicText>
      <CivicText>
        <strong>{askerName}</strong>&rsquo;s ask from last week is still open. Resurfacing it once,
        in case it slipped by:
      </CivicText>
      {askExcerpt ? <CivicQuote>&ldquo;{askExcerpt}&rdquo;</CivicQuote> : null}
      <CivicButtonRow>
        <CivicButton href={reviewUrl}>Read {askerFirst}&rsquo;s ask</CivicButton>
      </CivicButtonRow>
      <CivicText small>
        No pressure — if now isn&rsquo;t right, passing quietly is always okay, and {askerFirst}{' '}
        will be pointed to someone else.
      </CivicText>
      <CivicPlainLink href={reviewUrl} />
    </CivicEmail>
  )
}
