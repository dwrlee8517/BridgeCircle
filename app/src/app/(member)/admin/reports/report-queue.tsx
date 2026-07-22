'use client'

import { format } from 'date-fns'
import { useActionState, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormMessage } from '@/components/ui/form-message'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type {
  AdminReport,
  AdminReportDecision,
  AdminReportQueueFilter,
} from '@/lib/admin/contracts'
import { formatReportEvidence, reportsForQueue } from '@/lib/admin/moderation'
import { cn } from '@/lib/utils'
import { decideReportAction, type ReportDecisionFormState } from './actions'

const INITIAL_STATE: ReportDecisionFormState = {}

const FILTERS: ReadonlyArray<{ value: AdminReportQueueFilter; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'closed', label: 'Closed' },
]

const REASON_LABELS: Record<AdminReport['reason'], string> = {
  harassment: 'Harassment',
  spam: 'Spam',
  inappropriate: 'Inappropriate content',
  impersonation: 'Impersonation',
  other: 'Other concern',
}

const STATUS_LABELS: Record<AdminReport['status'], string> = {
  open: 'Open',
  reviewing: 'Reviewing',
  actioned: 'Handled',
  dismissed: 'Dismissed',
}

function reportDate(value: string) {
  return format(new Date(value), 'MMM d, yyyy · h:mmaaa')
}

export function ReportQueue({
  reports,
  unavailableMessage,
}: {
  reports: AdminReport[]
  unavailableMessage?: string
}) {
  const [filter, setFilter] = useState<AdminReportQueueFilter>('open')
  const visible = reportsForQueue(reports, filter)

  return (
    <div className="space-y-4">
      <fieldset className="inline-flex rounded-md border bg-surface-card p-1">
        <legend className="sr-only">Report status</legend>
        {FILTERS.map((item) => {
          const count = reportsForQueue(reports, item.value).length
          return (
            <Button
              key={item.value}
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
              className={cn(filter === item.value && 'bg-muted font-semibold')}
            >
              {item.label}
              <span className="tabular-nums text-muted-foreground">{count}</span>
            </Button>
          )
        })}
      </fieldset>

      {unavailableMessage ? <FormMessage tone="error">{unavailableMessage}</FormMessage> : null}

      {!unavailableMessage && visible.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-semibold">No {filter} reports</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === 'open'
                ? 'New member reports will appear here.'
                : filter === 'reviewing'
                  ? 'Reports move here when an admin starts reviewing them.'
                  : 'Handled and dismissed reports will appear here.'}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3" aria-live="polite">
        {visible.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>
    </div>
  )
}

function ReportCard({ report }: { report: AdminReport }) {
  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{REASON_LABELS[report.reason]}</CardTitle>
              <Badge variant={report.status === 'open' ? 'destructive' : 'secondary'}>
                {STATUS_LABELS[report.status]}
              </Badge>
            </div>
            <CardDescription>
              Reported {reportDate(report.createdAt)} · {report.targetType} {report.targetId}
            </CardDescription>
          </div>
          <ReportDecisionControls report={report} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-label text-muted-foreground">
              Reported member
            </dt>
            <dd className="mt-1 font-medium">{report.reportedName ?? 'Member unavailable'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-label text-muted-foreground">
              Reported by
            </dt>
            <dd className="mt-1 font-medium">{report.reporterName ?? 'Member unavailable'}</dd>
          </div>
        </dl>

        {report.note ? (
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-label text-muted-foreground">
              Member’s note
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{report.note}</p>
          </div>
        ) : null}

        <details className="rounded-md border bg-muted/20">
          <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">
            View saved evidence
          </summary>
          <pre className="max-h-80 overflow-auto border-t p-3 text-xs whitespace-pre-wrap break-words">
            {formatReportEvidence(report.evidence)}
          </pre>
        </details>

        {report.latestAction ? (
          <div className="border-t pt-3 text-sm">
            <p className="text-xs text-muted-foreground">
              Latest admin action · {reportDate(report.latestAction.createdAt)}
            </p>
            {report.latestAction.note ? (
              <p className="mt-1 whitespace-pre-wrap">{report.latestAction.note}</p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function ReportDecisionControls({ report }: { report: AdminReport }) {
  const [startState, startAction, startPending] = useActionState(decideReportAction, INITIAL_STATE)

  if (report.status === 'actioned' || report.status === 'dismissed') return null

  return (
    <div className="flex max-w-sm flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {report.status === 'open' ? (
          <form action={startAction}>
            <input type="hidden" name="reportId" value={report.id} />
            <input type="hidden" name="decision" value="start_review" />
            <Button type="submit" size="sm" disabled={startPending} aria-busy={startPending}>
              {startPending ? 'Starting…' : 'Start review'}
            </Button>
          </form>
        ) : null}
        <TerminalDecisionDialog report={report} decision="dismiss" />
        {report.status === 'reviewing' ? (
          <TerminalDecisionDialog report={report} decision="mark_actioned" />
        ) : null}
      </div>
      {startState.error ? (
        <FormMessage tone="error" className="text-xs">
          {startState.error}
        </FormMessage>
      ) : null}
      {startState.ok ? (
        <FormMessage tone="success" className="text-xs">
          Review started.
        </FormMessage>
      ) : null}
    </div>
  )
}

function TerminalDecisionDialog({
  report,
  decision,
}: {
  report: AdminReport
  decision: Extract<AdminReportDecision, 'dismiss' | 'mark_actioned'>
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(decideReportAction, INITIAL_STATE)
  const isDismiss = decision === 'dismiss'
  const dialogOpen = state.ok ? false : open

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant={isDismiss ? 'outline' : 'default'}
        onClick={() => setOpen(true)}
        disabled={pending}
      >
        {isDismiss ? 'Dismiss' : 'Mark handled'}
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setOpen}>
        <DialogContent showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>
              {isDismiss ? 'Dismiss this report?' : 'Mark this report handled?'}
            </DialogTitle>
            <DialogDescription>
              {isDismiss
                ? 'This closes the report without recording further action. Add a private note so another admin can understand the decision.'
                : 'This records that the concern was handled outside this queue. Add a private note describing what was done.'}
            </DialogDescription>
          </DialogHeader>
          <form action={action} className="space-y-4">
            <input type="hidden" name="reportId" value={report.id} />
            <input type="hidden" name="decision" value={decision} />
            <div className="space-y-2">
              <Label htmlFor={`${decision}-note-${report.id}`}>Private admin note</Label>
              <Textarea
                id={`${decision}-note-${report.id}`}
                name="note"
                required
                maxLength={10_000}
                rows={4}
                autoFocus
                placeholder={
                  isDismiss
                    ? 'Why this report does not need further action'
                    : 'What was reviewed or handled'
                }
              />
              <p className="text-xs text-muted-foreground">Only admins can see this note.</p>
            </div>
            {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Keep reviewing
              </Button>
              <Button
                type="submit"
                variant={isDismiss ? 'outline' : 'default'}
                disabled={pending}
                aria-busy={pending}
              >
                {pending ? 'Saving…' : isDismiss ? 'Dismiss report' : 'Mark handled'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {state.ok ? (
        <span className="sr-only" role="status">
          {isDismiss ? 'Report dismissed.' : 'Report marked handled.'}
        </span>
      ) : null}
    </>
  )
}
