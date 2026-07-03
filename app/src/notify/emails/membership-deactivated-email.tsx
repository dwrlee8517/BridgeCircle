import { CivicCallout, CivicEmail, CivicHeading, CivicText, greeting } from './civic-email'

type Props = {
  recipientName: string | null
  orgName: string
  reason: string | null
}

export function MembershipDeactivatedEmail({ recipientName, orgName, reason }: Props) {
  const preview = `Your ${orgName} BridgeCircle access has been deactivated`

  return (
    <CivicEmail
      preview={preview}
      footer={`You received this because an admin changed your ${orgName} BridgeCircle membership status. Reply to this email if you believe this needs another review.`}
    >
      <CivicHeading>Access deactivated</CivicHeading>
      <CivicText>{greeting(recipientName)}</CivicText>
      <CivicText>
        An admin deactivated your access to <strong>{orgName}</strong> on BridgeCircle. You will not
        appear in the directory or be reachable for new asks unless your access is restored.
      </CivicText>
      {reason ? (
        <>
          <CivicText>Reason given:</CivicText>
          <CivicCallout tone="danger">{reason}</CivicCallout>
        </>
      ) : null}
      <CivicText>
        If you believe this is a mistake, reply to this email and the admin team will take another
        look.
      </CivicText>
    </CivicEmail>
  )
}
