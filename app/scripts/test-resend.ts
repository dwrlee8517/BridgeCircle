/**
 * One-off Resend smoke test. Verifies the API key works and that an email
 * actually lands in your inbox.
 *
 * Run from app/:
 *   TEST_TO=your-email@gmail.com pnpm dlx tsx --env-file=.env.local scripts/test-resend.ts
 *
 * Defaults:
 *   - From: onboarding@resend.dev (Resend's reserved test sender — works even
 *     before bridgecircle.org is verified)
 *   - To: whatever you pass in TEST_TO
 *
 * Once bridgecircle.org is verified, swap the from address to
 * invites@bridgecircle.org to confirm the verified domain works end-to-end.
 *
 * Throwaway script — fine to delete after src/notify/resend.ts lands.
 */

import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const to = process.env.TEST_TO

if (!apiKey) {
  console.error('Missing RESEND_API_KEY in .env.local')
  process.exit(1)
}

if (!to) {
  console.error('Set TEST_TO=<your-email> in the environment, e.g.:')
  console.error('  TEST_TO=you@gmail.com pnpm dlx tsx --env-file=.env.local scripts/test-resend.ts')
  process.exit(1)
}

const resend = new Resend(apiKey)

async function main() {
  const { data, error } = await resend.emails.send({
    from: 'BridgeCircle <invites@bridgecircle.org>',
    to: [to!],
    subject: 'BridgeCircle Resend smoke test',
    html: `
      <p>Hi —</p>
      <p>If you can read this, your Resend API key works and the send path is live.</p>
      <p>Sent from <code>scripts/test-resend.ts</code> at ${new Date().toISOString()}.</p>
    `,
  })

  if (error) {
    console.error('[test-resend] failed:', error)
    process.exit(1)
  }

  console.log(`[test-resend] sent. id=${data?.id}`)
  console.log(`[test-resend] check ${to} (and the spam folder).`)
}

main().catch((err) => {
  console.error('[test-resend] failed:', err)
  process.exit(1)
})
