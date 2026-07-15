'use client'

import { SafetyReportDialog } from '@/components/safety-report-dialog'

export function HelpReportDialog({
  open,
  onOpenChange,
  endpoint,
  subject = 'ask',
}: {
  open: boolean
  onOpenChange(open: boolean): void
  endpoint: string
  subject?: 'ask' | 'message'
}) {
  return (
    <SafetyReportDialog
      open={open}
      onOpenChange={onOpenChange}
      endpoint={endpoint}
      subject={subject}
    />
  )
}
