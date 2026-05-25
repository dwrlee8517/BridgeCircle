import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type * as React from 'react'

export const emailTokens = {
  background: '#fafaf9',
  card: '#ffffff',
  foreground: '#0c0c0b',
  muted: '#4d4d4a',
  border: '#dcdcd6',
  primary: '#2563eb',
  // CTA — amber, mirrors the app `--cta` token. Use CivicButton variant="cta"
  // for the single highest-stakes action per email (Accept invitation, RSVP,
  // Open the ask). Keep variant="primary" (blue) for links and secondary
  // positive actions like "View profile" or "Open thread."
  cta: '#f59e0b',
  ctaForeground: '#0c0c0b',
  destructive: '#9b2c1f',
  radius: '10px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
} as const

type CivicEmailProps = {
  preview: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function CivicEmail({ preview, children, footer }: CivicEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <Section style={emailStyles.header}>
            <Text style={emailStyles.wordmark}>BridgeCircle</Text>
            <Text style={emailStyles.headerLabel}>Verified alumni network</Text>
          </Section>
          <Section style={emailStyles.content}>{children}</Section>
          {footer ? (
            <Section style={emailStyles.footerSection}>
              <Hr style={emailStyles.rule} />
              <Text style={emailStyles.footer}>{footer}</Text>
            </Section>
          ) : null}
        </Container>
      </Body>
    </Html>
  )
}

export function CivicHeading({ children }: { children: React.ReactNode }) {
  return <Heading style={emailStyles.heading}>{children}</Heading>
}

export function CivicText({
  children,
  small = false,
}: {
  children: React.ReactNode
  small?: boolean
}) {
  return <Text style={small ? emailStyles.smallText : emailStyles.paragraph}>{children}</Text>
}

export function CivicButton({
  href,
  children,
  variant = 'primary',
}: {
  href: string
  children: React.ReactNode
  variant?: 'cta' | 'primary' | 'secondary'
}) {
  const style =
    variant === 'cta'
      ? emailStyles.ctaButton
      : variant === 'primary'
        ? emailStyles.primaryButton
        : emailStyles.secondaryButton
  return (
    <Button style={style} href={href}>
      {children}
    </Button>
  )
}

export function CivicButtonRow({ children }: { children: React.ReactNode }) {
  return <Section style={emailStyles.buttonSection}>{children}</Section>
}

export function CivicCallout({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'danger'
}) {
  return (
    <Section style={tone === 'danger' ? emailStyles.dangerCallout : emailStyles.callout}>
      <Text style={emailStyles.calloutText}>{children}</Text>
    </Section>
  )
}

export function CivicQuote({ children }: { children: React.ReactNode }) {
  return <Text style={emailStyles.quote}>{children}</Text>
}

export function CivicPlainLink({ href }: { href: string }) {
  return (
    <Text style={emailStyles.smallText}>
      Or paste this link into your browser:
      <br />
      <Link href={href} style={emailStyles.plainLink}>
        {href}
      </Link>
    </Text>
  )
}

export function CivicLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={emailStyles.inlineLink}>
      {children}
    </Link>
  )
}

export function firstName(name: string | null) {
  return name?.trim().split(/\s+/)[0] || null
}

export function greeting(name: string | null) {
  const shortName = firstName(name)
  return shortName ? `Hi ${shortName},` : 'Hi,'
}

export const emailStyles = {
  body: {
    backgroundColor: emailTokens.background,
    fontFamily: emailTokens.fontFamily,
    margin: '0',
    padding: '0',
  },
  container: {
    backgroundColor: emailTokens.card,
    border: `1px solid ${emailTokens.border}`,
    borderRadius: emailTokens.radius,
    margin: '32px auto',
    maxWidth: '560px',
  },
  header: {
    borderBottom: `1px solid ${emailTokens.border}`,
    padding: '22px 32px 16px',
  },
  wordmark: {
    color: emailTokens.foreground,
    fontSize: '18px',
    fontWeight: '700',
    lineHeight: '24px',
    margin: '0',
  },
  headerLabel: {
    color: emailTokens.muted,
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.06em',
    lineHeight: '16px',
    margin: '4px 0 0',
    textTransform: 'uppercase' as const,
  },
  content: {
    padding: '28px 32px 30px',
  },
  heading: {
    color: emailTokens.foreground,
    fontSize: '22px',
    fontWeight: '650',
    lineHeight: '28px',
    margin: '0 0 16px',
  },
  paragraph: {
    color: emailTokens.foreground,
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0 0 14px',
  },
  smallText: {
    color: emailTokens.muted,
    fontSize: '13px',
    lineHeight: '20px',
    margin: '16px 0 0',
  },
  buttonSection: {
    margin: '24px 0',
  },
  primaryButton: {
    backgroundColor: emailTokens.primary,
    borderRadius: emailTokens.radius,
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '15px',
    fontWeight: '650',
    lineHeight: '20px',
    padding: '12px 20px',
    textDecoration: 'none',
  },
  ctaButton: {
    backgroundColor: emailTokens.cta,
    borderRadius: emailTokens.radius,
    color: emailTokens.ctaForeground,
    display: 'inline-block',
    fontSize: '15px',
    fontWeight: '650',
    lineHeight: '20px',
    padding: '12px 20px',
    textDecoration: 'none',
  },
  secondaryButton: {
    backgroundColor: emailTokens.card,
    border: `1px solid ${emailTokens.border}`,
    borderRadius: emailTokens.radius,
    color: emailTokens.foreground,
    display: 'inline-block',
    fontSize: '15px',
    fontWeight: '650',
    lineHeight: '20px',
    marginLeft: '8px',
    padding: '11px 19px',
    textDecoration: 'none',
  },
  callout: {
    backgroundColor: '#f4f3ee',
    border: `1px solid ${emailTokens.border}`,
    borderRadius: emailTokens.radius,
    margin: '16px 0',
    padding: '12px 16px',
  },
  dangerCallout: {
    backgroundColor: '#f8ebe9',
    border: `1px solid ${emailTokens.destructive}`,
    borderRadius: emailTokens.radius,
    margin: '16px 0',
    padding: '12px 16px',
  },
  calloutText: {
    color: emailTokens.foreground,
    fontSize: '14px',
    lineHeight: '22px',
    margin: '0',
    whiteSpace: 'pre-line' as const,
  },
  quote: {
    borderLeft: `3px solid ${emailTokens.border}`,
    color: emailTokens.muted,
    fontSize: '14px',
    fontStyle: 'italic' as const,
    lineHeight: '22px',
    margin: '14px 0',
    padding: '2px 0 2px 14px',
  },
  plainLink: {
    color: emailTokens.primary,
    textDecoration: 'underline',
    wordBreak: 'break-all' as const,
  },
  inlineLink: {
    color: emailTokens.primary,
    textDecoration: 'underline',
  },
  footerSection: {
    padding: '0 32px 26px',
  },
  rule: {
    borderColor: emailTokens.border,
    margin: '0 0 16px',
  },
  footer: {
    color: emailTokens.muted,
    fontSize: '12px',
    lineHeight: '18px',
    margin: '0',
  },
} satisfies Record<string, React.CSSProperties>
