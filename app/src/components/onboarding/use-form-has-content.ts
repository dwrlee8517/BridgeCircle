'use client'

import { type FormEvent, useCallback, useEffect, useState } from 'react'

/**
 * Track whether a step's form has *anything* the user would want saved.
 * Drives the "Save and continue" button's enabled state — disabled when
 * the form is functionally empty, so the button only appears meaningful
 * when there's content to actually save.
 *
 * Skipped keys:
 *   - $-prefixed (Next.js server-action machinery)
 *   - "skip" (the skip-button hidden marker)
 *
 * Empty arrays (the JSON shape the dynamic editors ship — careerHistory,
 * educationHistory, skills) read as "no content."
 *
 * Note on checkboxes: HTML omits unchecked checkboxes from FormData
 * entirely, so "openToMentor=on" only appears when the user explicitly
 * opted in. That naturally counts as content here.
 *
 * Note on avatar: AvatarUploader saves to base_profiles.avatar_url
 * out-of-band, but its corresponding hidden input is included in form
 * data. If the user uploaded a photo on this step, the avatar URL
 * counts as content — uploading is itself an engagement signal.
 */
export function useFormHasContent(initial: boolean) {
  const [hasContent, setHasContent] = useState(initial)

  const recompute = useCallback((e: FormEvent<HTMLFormElement>) => {
    const fd = new FormData(e.currentTarget)
    for (const [key, value] of fd) {
      if (key.startsWith('$') || key === 'skip') continue
      const s = typeof value === 'string' ? value.trim() : ''
      if (s.length === 0) continue
      if (s === '[]') continue
      setHasContent(true)
      return
    }
    setHasContent(false)
  }, [])

  return { hasContent, onFormChange: recompute }
}

/**
 * Quick check: does any of these strings have non-empty content?
 * Useful for computing initial `hasContent` from defaults so the button
 * starts enabled when the user has already saved this step before.
 */
export function anyHasContent(...values: Array<string | null | undefined>): boolean {
  return values.some((v) => typeof v === 'string' && v.trim().length > 0)
}

/**
 * Track which button initiated a form submit so only the *clicked* button
 * shows the "Saving…" loading label — not all submit buttons in the form.
 *
 * useActionState's `pending` flag is form-wide; without this, clicking
 * Skip flips Save-and-continue's label to "Saving…" too, which is
 * confusing and visually wrong (only one button is doing anything).
 *
 * Reset to null when `pending` returns to false so subsequent clicks
 * start clean.
 */
export type SubmitterKind = 'save' | 'skip'

export function useSubmitterTracker(pending: boolean) {
  const [kind, setKind] = useState<SubmitterKind | null>(null)

  useEffect(() => {
    if (!pending) setKind(null)
  }, [pending])

  return {
    submittingKind: kind,
    onSaveClick: useCallback(() => setKind('save'), []),
    onSkipClick: useCallback(() => setKind('skip'), []),
  }
}
