import { OutboxJobError } from '@/lib/outbox/contracts'
import { sendHelpNotificationEmail } from '@/notify/resend'
import type { HelpEmailSender } from './handlers'

export const resendHelpEmailSender: HelpEmailSender = {
  async send(input, signal) {
    if (signal.aborted) throw new OutboxJobError('email_send_aborted', false)
    const result = await sendHelpNotificationEmail(input)
    if (!result.ok) throw new OutboxJobError('email_send_failed', false)
    if (signal.aborted) throw new OutboxJobError('email_send_aborted', false)
    return { providerId: result.id }
  },
}
