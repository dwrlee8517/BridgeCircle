import { CivicEmail, CivicHeading, CivicText, greeting } from './civic-email'

type Props = {
  recipientName: string | null
  orgName: string
}

export function MembershipRejectedEmail({ recipientName, orgName }: Props) {
  const preview = `Update on your ${orgName} BridgeCircle membership request`

  return (
    <CivicEmail
      preview={preview}
      footer={`You received this because this email address was used to request access to ${orgName} on BridgeCircle. Reply to the email if you believe the decision needs another review.`}
    >
      <CivicHeading>Update on your membership request</CivicHeading>
      <CivicText>{greeting(recipientName)}</CivicText>
      <CivicText>
        Thanks for signing up for <strong>{orgName}</strong> on BridgeCircle. After review, the
        admin team was not able to approve your membership at this time.
      </CivicText>
      <CivicText>
        If you believe this is a mistake - for example, if you are an alum whose record could not be
        matched - reply to this email and the admin team will take another look.
      </CivicText>
    </CivicEmail>
  )
}
