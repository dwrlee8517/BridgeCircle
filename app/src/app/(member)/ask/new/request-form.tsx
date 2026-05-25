'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { AskType, DraftVariant } from '@/lib/asks/schemas'
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
}

/**
 * Composer for both ask types. Field shape changes based on askType:
 *
 *   advice     → one field (the question itself)
 *   mentorship → three fields (the ask, why this person, anything else)
 *
 * Inputs are controlled here (not uncontrolled defaults) so the
 * "Help me start" button can populate them after the AI draft fetch
 * comes back. The form still submits via FormData / server action;
 * controlled values stay in sync with the DOM, so FormData picks up
 * the latest text on submit.
 *
 * Placeholders are personalized server-side using the helper's
 * directory attributes — a helper who works at Anthropic gets a
 * different example than a generic one.
 */
export function RequestForm({ helperId, helperName, askType, placeholderContext }: Props) {
  const [state, action, pending] = useActionState(submitRequest, initialState)
  const fe = state.fieldErrors ?? {}

  const [helpNeeded, setHelpNeeded] = useState('')
  const [reason, setReason] = useState('')
  const [background, setBackground] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)

  async function handleDraft(variant: DraftVariant | null = null) {
    setDrafting(true)
    setDraftError(null)
    try {
      const res = await fetch('/api/asks/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helperId,
          askType,
          userText: [reason, helpNeeded, background].filter(Boolean).join('\n\n'),
          variant,
        }),
      })
      if (!res.ok) {
        setDraftError("Couldn't generate a draft right now — try again, or just write it manually.")
        return
      }
      const data = (await res.json()) as { helpNeeded: string; reason: string | null }
      setHelpNeeded(data.helpNeeded)
      if (askType === 'mentorship' && data.reason) {
        setReason(data.reason)
      }
    } catch {
      setDraftError("Couldn't reach the drafting service. Try again, or just write it manually.")
    } finally {
      setDrafting(false)
    }
  }

  const placeholders = buildPlaceholders(askType, placeholderContext)
  const hasAnyContent = helpNeeded.length > 0 || reason.length > 0 || background.length > 0

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="helperId" value={helperId} />
      <input type="hidden" name="askType" value={askType} />

      {askType === 'advice' ? (
        <div className="space-y-2">
          <Label htmlFor="helpNeeded">
            Your question <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="helpNeeded"
            name="helpNeeded"
            rows={4}
            required
            value={helpNeeded}
            onChange={(e) => setHelpNeeded(e.target.value)}
            placeholder={placeholders.helpNeeded}
          />
          {fe.helpNeeded ? <p className="text-xs text-destructive">{fe.helpNeeded}</p> : null}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="helpNeeded">
              What you&apos;re hoping to explore <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="helpNeeded"
              name="helpNeeded"
              rows={3}
              required
              value={helpNeeded}
              onChange={(e) => setHelpNeeded(e.target.value)}
              placeholder={placeholders.helpNeeded}
            />
            {fe.helpNeeded ? <p className="text-xs text-destructive">{fe.helpNeeded}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">
              Why you&apos;d like {helperName} specifically{' '}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="reason"
              name="reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={placeholders.reason}
            />
            <p className="text-xs text-muted-foreground">
              Helps {helperName} feel chosen, not just messaged.
            </p>
            {fe.reason ? <p className="text-xs text-destructive">{fe.reason}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="background">
              Anything else they should know{' '}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="background"
              name="background"
              rows={2}
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder={placeholders.background}
            />
            {fe.background ? <p className="text-xs text-destructive">{fe.background}</p> : null}
          </div>
        </>
      )}

      {/* "Help me start" — quiet writing assistant per brand voice. The
          button label adapts: a fresh form gets "Help me start" (suggests
          a draft from scratch); once the user has typed anything, it
          becomes "Refine with a draft" (suggests the model will build on
          their seed). Once content exists, three lens-based variants
          appear: shorter / more direct / warmer (Apple Writing Tools
          posture — variants beat blind regenerate). */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={drafting}
          onClick={() => handleDraft()}
        >
          {drafting ? 'Drafting…' : hasAnyContent ? 'Refine with a draft' : 'Help me start'}
        </Button>
        <span>You can edit anything before sending.</span>
      </div>
      {helpNeeded.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>Refine:</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={drafting}
            onClick={() => handleDraft('shorter')}
          >
            Shorter
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={drafting}
            onClick={() => handleDraft('more-direct')}
          >
            More direct
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={drafting}
            onClick={() => handleDraft('warmer')}
          >
            Warmer
          </Button>
        </div>
      ) : null}
      {draftError ? <p className="text-xs text-destructive">{draftError}</p> : null}

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="flex gap-2">
        <Button type="submit" variant="cta" disabled={pending}>
          {pending ? 'Sending…' : askType === 'advice' ? 'Send' : 'Send request'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/profile/${helperId}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  )
}

type Placeholders = {
  helpNeeded: string
  reason: string
  background: string
}

/**
 * Personalized placeholder text for the textareas, based on the helper's
 * directory attributes. The point isn't to write the ask FOR the user —
 * it's to model what a good ask looks like for THIS helper, so a Wharton
 * consultant gets a different example than a Tokyo product manager.
 *
 * Falls back gracefully when the helper hasn't filled in topics / role /
 * etc. — generic-but-still-useful examples.
 */
function buildPlaceholders(type: AskType, ctx: PlaceholderContext): Placeholders {
  if (type === 'advice') {
    const topic = ctx.helperMentoringTopics?.[0]
    if (topic) {
      return {
        helpNeeded: `Be specific. e.g. "How did you get into ${topic}?" beats "Looking for advice."`,
        reason: '',
        background: '',
      }
    }
    if (ctx.helperCurrentEmployer) {
      return {
        helpNeeded: `Be specific. e.g. "What's the biggest thing you wish you'd known before joining ${ctx.helperCurrentEmployer}?" beats "Looking for advice."`,
        reason: '',
        background: '',
      }
    }
    return {
      helpNeeded:
        'Be specific. "How did you decide between consulting and PE after graduation?" beats "Looking for career advice."',
      reason: '',
      background: '',
    }
  }

  // Mentorship
  const sharedAttribute =
    ctx.helperMajor || ctx.helperUniversity || ctx.helperCurrentEmployer || ctx.helperCity
  return {
    helpNeeded:
      "A sentence or two on what you're working on, and what you'd like a mentor to help you think through over the next few months.",
    reason: sharedAttribute
      ? `e.g. "I noticed we both have a background in ${sharedAttribute}" or "I'm trying to follow a path similar to yours."`
      : 'Things like "same major as you" or "I noticed you went from X to Y" land well.',
    background:
      "Anything that would help them help you — current situation, what you've already tried.",
  }
}
