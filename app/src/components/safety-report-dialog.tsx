'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { ReportReason } from '@/lib/safety/contracts'
import { cn } from '@/lib/utils'

const REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: 'harassment', label: 'Harassment' },
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'other', label: 'Other' },
]

export function SafetyReportDialog({
  open,
  onOpenChange,
  endpoint,
  subject,
}: {
  open: boolean
  onOpenChange(open: boolean): void
  endpoint: string
  subject: 'ask' | 'message'
}) {
  const [reason, setReason] = useState<ReportReason>('harassment')
  const [note, setNote] = useState('')
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function submit() {
    if (pending) return
    setPending(true)
    setResult(null)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, note: note.trim() || null }),
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('report_failed')
      setResult('Thanks — we’ll look into it.')
      window.setTimeout(() => onOpenChange(false), 650)
    } catch {
      setResult('Couldn’t send the report. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (nextOpen) setResult(null)
      }}
    >
      <DialogContent className="sm:max-w-[440px]">
        <DialogTitle className="text-body-lg font-extrabold tracking-tight">
          Report this {subject}
        </DialogTitle>
        <DialogDescription className="text-body-sm leading-relaxed font-medium">
          This goes only to the BridgeCircle team. The other member won’t be notified.
        </DialogDescription>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={reason === item.value}
              onClick={() => setReason(item.value)}
              className={cn(
                'min-h-10 rounded-full px-3.5 text-xs font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                reason === item.value
                  ? 'bg-[var(--action-weak)] text-[var(--blue-600)] shadow-[inset_0_0_0_1px_var(--action-primary)]'
                  : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)]',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="text-xs font-bold text-[var(--text-secondary)]" htmlFor="report-note">
          Anything else? <span className="font-medium text-[var(--text-faint)]">Optional</span>
        </label>
        <textarea
          id="report-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={4_000}
          rows={3}
          className="w-full resize-y rounded-xl border-0 bg-card px-3.5 py-3 text-body-sm shadow-[var(--ring-outline)] outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring)]"
        />
        {result ? (
          <p role="status" className="text-xs font-semibold text-[var(--text-secondary)]">
            {result}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void submit()}
          disabled={pending}
          className="min-h-11 rounded-xl bg-[image:var(--gradient-primary-btn)] px-5 text-body-sm font-bold text-white shadow-[var(--shadow-primary-btn)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-55"
        >
          {pending ? 'Sending…' : 'Send report'}
        </button>
      </DialogContent>
    </Dialog>
  )
}
