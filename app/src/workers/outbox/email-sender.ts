import { OutboxJobError } from '@/lib/outbox/contracts'
import { sendTransactionalNotificationEmail } from '@/notify/resend'
import type { NotificationEmailSender } from './handlers'

export const resendNotificationEmailSender: NotificationEmailSender = {
  async send(input, signal) {
    if (signal.aborted) throw new OutboxJobError('email_send_aborted', false)
    const result = await sendTransactionalNotificationEmail(input)
    if (!result.ok) throw new OutboxJobError('email_send_failed', false)
    if (signal.aborted) throw new OutboxJobError('email_send_aborted', false)
    return { providerId: result.id }
  },
}
