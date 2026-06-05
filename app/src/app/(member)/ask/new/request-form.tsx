'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { AskType } from '@/lib/asks/schemas'
import { type RequestFormState, submitRequest } from './actions'

const initialState: RequestFormState = {}

export type PlaceholderContext = {
  helperFirstName: string
  helperCurrentTitle: string | null
  helperCurrentEmployer: string | null
  helperUniversity: string | null
  helperMajor: string | null
  helperCity: string | null
  helperMentoringTopics: string[] | null
}

type Props = {
  helperId: string
  helperName: string
  askType: AskType
  placeholderContext: PlaceholderContext
  guidedHref: string
  initialHelpNeeded?: string
}

export function RequestForm({
  helperId,
  helperName,
  askType,
  placeholderContext,
  guidedHref,
  initialHelpNeeded = '',
}: Props) {
  const [state, action, pending] = useActionState(submitRequest, initialState)
  const [helpNeeded, setHelpNeeded] = useState(initialHelpNeeded)
  const firstName = helperName.split(/\s+/)[0] || 'them'
  const placeholders = buildPlaceholders(askType, placeholderContext)
  const fieldError = state.fieldErrors?.helpNeeded

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="helperId" value={helperId} />
      <input type="hidden" name="askType" value={askType} />

      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Label htmlFor="helpNeeded" className="text-sm font-semibold text-foreground">
              Your ask <span className="text-destructive">*</span>
            </Label>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
              Be specific about where you are and what would be most useful. A few sentences is
              plenty.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="w-fit rounded-lg">
            <Link href={guidedHref}>
              Guided composer
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <p className="rounded-md border border-dashed border-border bg-surface-panel/45 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          Use guided mode if you want help shaping this into a more specific request.
        </p>
        <Textarea
          id="helpNeeded"
          name="helpNeeded"
          rows={5}
          required
          value={helpNeeded}
          onChange={(e) => setHelpNeeded(e.target.value)}
          placeholder={placeholders.helpNeeded}
          className="min-h-[150px] rounded-lg bg-card text-sm leading-relaxed"
        />
        {fieldError ? <p className="text-xs text-destructive">{fieldError}</p> : null}
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="cta" size="lg" disabled={pending} className="rounded-lg">
          {pending
            ? 'Sending...'
            : askType === 'advice'
              ? `Send ask to ${firstName}`
              : `Send request to ${firstName}`}
        </Button>
        <Button type="button" variant="ghost" size="lg" asChild className="rounded-lg">
          <Link href={`/profile/${helperId}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  )
}

type Placeholders = {
  helpNeeded: string
}

function buildPlaceholders(type: AskType, ctx: PlaceholderContext): Placeholders {
  const firstName = ctx.helperFirstName || 'there'

  if (type === 'advice') {
    const topic = ctx.helperMentoringTopics?.[0]
    if (topic) {
      return {
        helpNeeded: `Hi ${firstName}, I am trying to think through ${topic}. Could I ask how you approached it and what you wish you had known earlier?`,
      }
    }
    if (ctx.helperCurrentEmployer) {
      return {
        helpNeeded: `Hi ${firstName}, I am curious about your path into ${ctx.helperCurrentEmployer}. Could I ask what helped you decide it was the right move?`,
      }
    }
    return {
      helpNeeded:
        'Hi there, I am trying to make a career decision and would value your perspective on how you thought through a similar path.',
    }
  }

  return {
    helpNeeded:
      'Hi there, I am looking for ongoing guidance over the next few months. I would love help thinking through my path, what to prioritize, and how to make better decisions from where I am now.',
  }
}
