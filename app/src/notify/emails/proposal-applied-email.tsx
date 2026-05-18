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
  undoUrl: string
  changeSummary: string
}

/**
 * Sent to members on `auto_apply_and_notify` after the monthly sweep silently
 * applies a change. Single Undo button reverses the apply by marking the
 * proposal declined and restoring base_profiles to the prior snapshot.
 */
export function ProposalAppliedEmail({ recipientName, undoUrl, changeSummary }: Props) {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,'

  return (
    <Html>
      <Head />
      <Preview>BridgeCircle updated your profile from LinkedIn</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>BridgeCircle</Heading>
          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>We updated your profile from your latest LinkedIn:</Text>
          <Section style={summarySection}>
            <Text style={summaryText}>{changeSummary}</Text>
          </Section>
          <Section style={buttonSection}>
            <Button style={primaryButton} href={undoUrl}>
              Undo this update
            </Button>
          </Section>
          <Text style={footer}>
            You chose to let BridgeCircle apply LinkedIn updates automatically. You can switch to
            email-me-first any time from your profile settings.
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
}

const footer = {
  fontSize: '12px',
  color: '#999',
  margin: '32px 0 0',
}
