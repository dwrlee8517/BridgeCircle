'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

const OPTIONS = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const

export function ThemePicker() {
  const { theme, setTheme } = useTheme()
  // next-themes only knows the stored choice after hydration; render the
  // segmented control unselected until then to avoid a mismatch flash.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
  const current = mounted ? (theme ?? 'system') : null

  return (
    <div
      role="group"
      aria-label="Interface theme"
      className="flex w-fit gap-1 rounded-full bg-[var(--surface-subtle)] p-1"
    >
      {OPTIONS.map((option) => {
        const selected = current === option.value
        const Icon = option.icon
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => setTheme(option.value)}
            className={cn(
              'bc-motion-control inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
              selected
                ? 'bg-card text-[var(--text-primary)] shadow-[var(--ring-card),var(--shadow-card)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            <Icon aria-hidden className="size-3.5" />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function emptySubscribe() {
  return () => {}
}
