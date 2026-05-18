import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

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
 * Confirm = one-click apply. Edit = open the review UI (with all changes
 * pre-checked; user can untick before saving). Decline = one-click dismiss.
 * All three links carry the same signed token; the route validates it.
 */
export function ProposalReviewEmail({
  recipientName,
  reviewUrl,
  confirmUrl,
  declineUrl,
  changeSummary,
}: Props) {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,'

  return (
    <Html>
      <Head />
      <Preview>BridgeCircle found updates to your profile from LinkedIn</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>BridgeCircle</Heading>
          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>Your monthly LinkedIn refresh found a few changes:</Text>
          <Section style={summarySection}>
            <Text style={summaryText}>{changeSummary}</Text>
          </Section>
          <Text style={paragraph}>How would you like to handle them?</Text>
          <Section style={buttonSection}>
            <Button style={primaryButton} href={confirmUrl}>
              Confirm all
            </Button>
            <Button style={secondaryButton} href={reviewUrl}>
              Review &amp; edit
            </Button>
          </Section>
          <Text style={paragraphSmall}>
            Or{' '}
            <a href={declineUrl} style={declineLink}>
              decline these changes
            </a>{' '}
            to skip this refresh.
          </Text>
          <Text style={footer}>
            This proposal expires in 14 days. You can change your refresh preferences any time from
            your profile settings.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const body = {
  backgroundColor: '#f6f6f6',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '32px',
  maxWidth: '560px',
  borderRadius: '8px',
}

const heading = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#111',
  margin: '0 0 24px',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333',
  margin: '0 0 16px',
}

const paragraphSmall = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#666',
  margin: '16px 0 0',
}

const summarySection = {
  backgroundColor: '#f3f4f6',
  borderRadius: '6px',
  padding: '12px 16px',
  margin: '16px 0',
}

const summaryText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#1f2937',
  margin: 0,
  whiteSpace: 'pre-line' as const,
}

const buttonSection = {
  margin: '24px 0',
}

const primaryButton = {
  backgroundColor: '#111',
  color: '#fff',
  padding: '12px 24px',
  borderRadius: '6px',
  fontSize: '15px',
  fontWeight: '500',
  textDecoration: 'none',
  display: 'inline-block',
  marginRight: '8px',
}

const secondaryButton = {
  backgroundColor: '#fff',
  color: '#111',
  padding: '12px 24px',
  borderRadius: '6px',
  fontSize: '15px',
  fontWeight: '500',
  textDecoration: 'none',
  display: 'inline-block',
  border: '1px solid #d1d5db',
}

const declineLink = {
  color: '#6b7280',
  textDecoration: 'underline',
}

const footer = {
  fontSize: '12px',
  color: '#999',
  margin: '32px 0 0',
}
