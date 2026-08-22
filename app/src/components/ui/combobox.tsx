'use client'

import { ChevronDownIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

export type ComboboxOption = {
  value: string
  /** Shown in the list; falls back to `value`. */
  label?: string
  /** Muted right-aligned annotation, e.g. a UTC offset. */
  hint?: string
}

type Props = {
  id: string
  name: string
  options: ComboboxOption[]
  defaultValue?: string
  placeholder?: string
  required?: boolean
  maxLength?: number
  /**
   * When false, the field is pick-only in spirit: typing still filters, but
   * the empty state nudges toward the list. Server validation remains the
   * gate either way — free text is never blocked client-side.
   */
  emptyHint?: string
  onValueChange?: (value: string) => void
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

/**
 * Add-or-type combobox: a plain text input that submits with the form (the
 * input itself carries `name`), plus a filtered suggestion list. Picking a
 * suggestion fills the input; anything typed stays as typed. No portal —
 * the listbox renders in place so form focus management stays boring.
 */
export function Combobox({
  id,
  name,
  options,
  defaultValue = '',
  placeholder,
  required,
  maxLength,
  emptyHint,
  onValueChange,
  ...aria
}: Props) {
  const [value, setValue] = React.useState(defaultValue)
  const [open, setOpen] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(-1)
  // Filter only once the user has typed in this opening — a prefilled value
  // should not hide the other choices when the field is merely focused.
  const [edited, setEdited] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  const query = edited ? value.trim().toLowerCase() : ''
  const filtered = React.useMemo(() => {
    if (!query) return options
    const matches = options.filter((option) =>
      `${option.value} ${option.label ?? ''}`.toLowerCase().includes(query),
    )
    return matches
  }, [options, query])
  const visible = filtered.slice(0, 50)

  function commit(next: string) {
    setValue(next)
    onValueChange?.(next)
    setOpen(false)
    setActiveIndex(-1)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        setActiveIndex(0)
        return
      }
      const delta = event.key === 'ArrowDown' ? 1 : -1
      const next = Math.min(Math.max(activeIndex + delta, 0), visible.length - 1)
      setActiveIndex(next)
      listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' })
      return
    }
    if (event.key === 'Enter' && open && activeIndex >= 0 && visible[activeIndex]) {
      event.preventDefault()
      commit(visible[activeIndex].value)
      return
    }
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: blur delegation for the ARIA 1.2 combobox pattern; interaction lives on the input
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node)) {
          setOpen(false)
          setActiveIndex(-1)
        }
      }}
    >
      <input
        id={id}
        name={name}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-activedescendant={
          open && activeIndex >= 0 && visible[activeIndex]
            ? `${id}-option-${activeIndex}`
            : undefined
        }
        aria-autocomplete="list"
        autoComplete="off"
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          onValueChange?.(event.target.value)
          setEdited(true)
          setOpen(true)
          setActiveIndex(-1)
        }}
        onFocus={() => {
          setEdited(false)
          setOpen(true)
        }}
        onKeyDown={onKeyDown}
        className="bc-motion-control flex h-10 w-full min-w-0 rounded-md border border-input bg-surface-card px-3 py-1 pr-9 text-base outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-muted disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-state-danger aria-invalid:ring-4 aria-invalid:ring-danger-tint md:text-sm dark:bg-input/30"
        {...aria}
      />
      <ChevronDownIcon
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground transition-transform',
          open && 'rotate-180',
        )}
      />
      {open && (visible.length > 0 || emptyHint) ? (
        <div
          ref={listRef}
          id={`${id}-listbox`}
          role="listbox"
          aria-label={placeholder}
          className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-[var(--radius-box)] bg-popover p-1 text-sm shadow-[var(--ring-card-elevated),var(--shadow-raised)]"
        >
          {visible.length === 0 ? (
            <p className="px-2.5 py-2 text-text-muted">{emptyHint}</p>
          ) : (
            visible.map((option, index) => (
              // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handling lives on the combobox input per the ARIA 1.2 pattern
              // biome-ignore lint/a11y/useFocusableInteractive: options are reached via aria-activedescendant, not tab focus, per the ARIA 1.2 pattern
              <div
                key={option.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={option.value === value}
                className={cn(
                  'flex cursor-pointer items-baseline justify-between gap-3 rounded-[var(--radius-standard)] px-2.5 py-2',
                  index === activeIndex
                    ? 'bg-[var(--hover-tint)] text-foreground'
                    : 'text-foreground hover:bg-[var(--hover-tint)]',
                )}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(option.value)}
              >
                <span className="min-w-0 truncate">{option.label ?? option.value}</span>
                {option.hint ? (
                  <span className="shrink-0 text-xs text-text-muted">{option.hint}</span>
                ) : null}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
