'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'
import {
  type HelpPreferencesFormState,
  saveHelpPreferencesAction,
} from '../help-preferences-actions'

const initialState: HelpPreferencesFormState = {}

type Props = {
  defaults: {
    openToHelp: boolean
    topics: string
  }
}

/**
 * One availability state (ADR 0011 Phase 2): open to helping, or not, plus
 * the topics that route asks. The commitment tiers, screening prompt, and
 * capacity caps left the form — the pending-ask valve still runs invisibly
 * inside createAsk.
 */
export function SettingsForm({ defaults }: Props) {
  const router = useRouter()
  const [state, action, pending] = useActionState(saveHelpPreferencesAction, initialState)
  const fe = state.fieldErrors ?? {}

  const [open, setOpen] = useState(defaults.openToHelp)

  useEffect(() => {
    if (state.ok) router.refresh()
  }, [state.ok, router])

  return (
    <form action={action} className="space-y-5">
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        <SettingRow
          title="Open to helping"
          description="Members can ask you for help. Say yes ask by ask — passing quietly is always an option."
          control={
            <div className="flex items-center gap-3">
              <StatusBadge tone={open ? 'open' : 'muted'} dot>
                {open ? 'Visible' : 'Off'}
              </StatusBadge>
              <Checkbox
                id="openToHelp"
                name="openToHelp"
                checked={open}
                onCheckedChange={(value) => setOpen(value === true)}
                aria-label="Open to helping"
              />
            </div>
          }
        />

        <SettingRow
          title="Help topics"
          description="Comma-separated topics help members find you in search."
          disabled={!open}
          control={
            <div className="w-full min-w-0 sm:max-w-md">
              <Input
                id="topics"
                name="topics"
                placeholder="consulting, business school, returning to Korea"
                defaultValue={defaults.topics}
                disabled={!open}
                aria-invalid={!!fe.topics}
              />
              <FieldError error={fe.topics} />
            </div>
          }
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state.ok ? <p className="text-sm text-accent-sage">Saved.</p> : null}
        <Button type="submit" variant="cta" disabled={pending}>
          {pending ? 'Saving...' : 'Save settings'}
        </Button>
      </div>
    </form>
  )
}

function SettingRow({
  title,
  description,
  control,
  disabled = false,
}: {
  title: string
  description: string
  control: React.ReactNode
  disabled?: boolean
}) {
  return (
    <div
      className={cn(
        'grid gap-4 border-b border-border px-5 py-5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(220px,auto)] sm:items-center',
        disabled && 'bg-surface-panel/45 text-muted-foreground',
      )}
    >
      <div>
        <Label className="text-base font-semibold text-foreground">{title}</Label>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="flex justify-start sm:justify-end">{control}</div>
    </div>
  )
}

function FieldError({ error }: { error?: string }) {
  return error ? <p className="mt-1.5 text-xs text-destructive">{error}</p> : null
}
