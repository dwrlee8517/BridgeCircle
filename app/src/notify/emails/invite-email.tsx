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
  fullName: string | null
  schoolName: string
  joinUrl: string
}

export function InviteEmail({ fullName, schoolName, joinUrl }: Props) {
  const greeting = fullName ? `Hi ${fullName},` : 'Hi,'

  return (
    <Html>
      <Head />
      <Preview>{`You're invited to join ${schoolName} on BridgeCircle`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>BridgeCircle</Heading>
          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>
            You've been invited to join the <strong>{schoolName}</strong> alumni network on
            BridgeCircle — a private space for {schoolName} alumni to find each other, share advice,
            and stay connected.
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href={joinUrl}>
              Accept invite
            </Button>
          </Section>
          <Text style={paragraphSmall}>
            Or paste this link into your browser:
            <br />
            <span style={{ wordBreak: 'break-all', color: '#555' }}>{joinUrl}</span>
          </Text>
          <Text style={footer}>
            This invite expires in 14 days. If you weren't expecting this email, you can ignore it.
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
  margin: '24px 0 0',
}

const buttonSection = {
  margin: '24px 0',
}

const button = {
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
