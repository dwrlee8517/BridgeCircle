'use client'

import { ArrowRight, CircleHelp } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Soft ceiling on ask length. The matcher gets better with a sentence or two
 * of situation, but real coaching belongs in the composer — and the ask
 * travels as a GET param, so keep it URL-friendly.
 */
export const ASK_MAX_LENGTH = 400
const COUNTER_THRESHOLD = 300
/** ~6 lines at body-lg before the box scrolls instead of growing. */
const MAX_GROW_HEIGHT_PX = 168

/**
 * The ask composer input. Starts as one calm line and grows as the member
 * types — the input's shape teaches situation-sized asks, not keywords.
 * Enter submits on fine-pointer devices (Shift+Enter for a newline); on
 * touch devices Enter inserts a newline and the button submits.
 */
export function AskBar({
  defaultValue = '',
  action = '/ask',
  compact = false,
  submitVariant = 'cta',
  hint,
  autoFocus = false,
}: {
  defaultValue?: string
  action?: string
  compact?: boolean
  /**
   * Amber belongs to the single social-commitment moment per screen. On
   * browse/results surfaces pass 'default' so re-running a search doesn't
   * out-shout the cards (tokens.md § CTA rule).
   */
  submitVariant?: 'cta' | 'default'
  /** Quiet reassurance line under the input ("Nothing is sent yet…"). */
  hint?: React.ReactNode
  autoFocus?: boolean
}) {
  const spacious = !compact
  const [value, setValue] = useState(defaultValue)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    // Empty field: clear the inline height so CSS min-height rules. Also
    // bail while the element has no layout width (hydration, HMR, hidden
    // ancestors) — measuring then makes the placeholder wrap vertically
    // and scrollHeight balloon, pinning a huge height that sticks because
    // this effect only re-runs on value changes.
    if (el.value === '' || el.clientWidth === 0) {
      el.style.height = ''
      el.style.overflowY = 'hidden'
      return
    }
    el.style.height = 'auto'
    const next = Math.min(el.scrollHeight, MAX_GROW_HEIGHT_PX)
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight > MAX_GROW_HEIGHT_PX ? 'auto' : 'hidden'
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: value drives growth
  useEffect(() => {
    resize()
  }, [value, resize])

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    // Touch keyboards keep Enter as newline; the visible button submits.
    if (window.matchMedia('(pointer: coarse)').matches) return
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  const showCounter = value.length >= COUNTER_THRESHOLD
  const showFooter = Boolean(hint) || showCounter

  return (
    <form action={action} className={cn('bc-command-surface', compact ? 'p-2' : 'p-0')}>
      <div
        className={cn(
          'relative flex items-end gap-3 max-detail:gap-2.5',
          spacious && 'px-4 py-3.5 max-detail:px-3 max-detail:py-2.5',
        )}
      >
        <div
          className={cn(
            'flex shrink-0 items-center justify-center self-start rounded-md bg-primary text-primary-foreground',
            spacious ? 'size-11 max-detail:size-[34px]' : 'size-9',
          )}
        >
          <CircleHelp className="size-5 max-detail:size-4" />
        </div>
        {/* suppressHydrationWarning: form-filler / accessibility browser
            extensions inject attributes onto inputs after SSR, triggering a
            benign hydration mismatch. The attribute is user-environment, not
            server state. */}
        <textarea
          ref={textareaRef}
          name="nl"
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={ASK_MAX_LENGTH}
          // biome-ignore lint/a11y/noAutofocus: only the edit-ask flow opts in
          autoFocus={autoFocus}
          aria-label="Describe what you are trying to figure out, to find people who can help"
          placeholder="What are you trying to figure out?"
          className={cn(
            'min-h-11 min-w-0 flex-1 resize-none border-none bg-transparent p-0 py-2.5 font-medium text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-transparent focus:shadow-none max-detail:min-h-8 max-detail:py-1.5 max-detail:text-sm',
            spacious ? 'text-body-lg' : 'text-sm',
          )}
          suppressHydrationWarning
        />
        <Button
          type="submit"
          variant={submitVariant}
          size={compact ? 'default' : 'lg'}
          className="h-11 rounded-md px-5 text-sm font-semibold max-detail:size-8 max-detail:gap-0 max-detail:px-0"
        >
          <span className="max-detail:sr-only">Find people</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
      {showFooter ? (
        <div className="flex items-center gap-3 border-border/70 border-t px-4 py-2 max-detail:px-3">
          {hint ? (
            <p className="min-w-0 text-kicker leading-relaxed text-muted-foreground">{hint}</p>
          ) : null}
          {showCounter ? (
            <p className="ml-auto shrink-0 font-mono text-kicker text-muted-foreground">
              {value.length} / {ASK_MAX_LENGTH}
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  )
}
