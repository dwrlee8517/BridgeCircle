import { LoaderCircle, type LucideIcon, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { ProfileActionState } from './actions'

export const fieldClass =
  'h-10 rounded-[10px] border-[var(--border-subtle)] bg-white text-sm shadow-none focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-muted'
export const selectClass =
  'h-10 w-full rounded-[10px] border border-[var(--border-subtle)] bg-white px-3 text-sm outline-none focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-muted'

export function Field({
  label,
  name,
  defaultValue,
  ...props
}: { label: string; name: string; defaultValue?: string | number | null } & Omit<
  React.ComponentProps<typeof Input>,
  'name' | 'defaultValue'
>) {
  return (
    <div>
      <Label htmlFor={`profile-${name}`}>{label}</Label>
      <Input
        id={`profile-${name}`}
        name={name}
        defaultValue={defaultValue ?? ''}
        className={cn(fieldClass, 'mt-2')}
        {...props}
      />
    </div>
  )
}

export function DraftInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        value={value}
        maxLength={300}
        onChange={(event) => onChange(event.target.value)}
        className={cn(fieldClass, 'mt-2')}
      />
    </div>
  )
}

export function DraftNumber({
  label,
  value,
  min = 1900,
  max = 2100,
  onChange,
}: {
  label: string
  value: number | null
  min?: number
  max?: number
  onChange: (value: number | null) => void
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
        className={cn(fieldClass, 'mt-2')}
      />
    </div>
  )
}

export function DraftCard({
  title,
  onRemove,
  children,
}: {
  title: string
  onRemove: () => void
  children: React.ReactNode
}) {
  return (
    <fieldset className="rounded-xl border border-[var(--border-subtle)] bg-white p-4">
      <legend className="sr-only">{title}</legend>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-[var(--text-secondary)]">{title}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label={`Remove ${title}`}
        >
          <Trash2 aria-hidden />
        </Button>
      </div>
      {children}
    </fieldset>
  )
}

export function EditorPanel({
  title,
  onClose,
  compact = false,
  children,
}: {
  title: string
  onClose: () => void
  compact?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        'rounded-[16px] border border-[var(--blue-100)] bg-[var(--surface-inset)] p-4 sm:p-5',
        !compact && 'mt-5',
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold">{title}</h2>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
      {children}
    </section>
  )
}

export function ActionFooter({
  state,
  pending,
  compact = false,
}: {
  state: ProfileActionState
  pending: boolean
  compact?: boolean
}) {
  return (
    <div className={cn('mt-5 flex flex-wrap items-center gap-3', !compact && 'sm:col-span-2')}>
      <Button type="submit" variant="cta" size="sm" disabled={pending} aria-busy={pending}>
        {pending ? (
          <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />
        ) : null}
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
      {state.message ? (
        <p
          role={state.status === 'error' ? 'alert' : 'status'}
          className={cn(
            'text-xs font-semibold',
            state.status === 'error'
              ? 'text-[var(--state-danger)]'
              : 'text-[var(--action-give-text)]',
          )}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  )
}

export function SelfSection({
  title,
  divided = false,
  onEdit,
  children,
}: {
  title: string
  divided?: boolean
  onEdit?: () => void
  children: React.ReactNode
}) {
  return (
    <section className={cn(divided && 'border-t border-[var(--divider-row)] pt-7')}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-extrabold tracking-[-0.01em]">{title}</h2>
        {onEdit ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label={`Edit ${title.toLowerCase()}`}
          >
            <Pencil aria-hidden />
          </Button>
        ) : null}
      </div>
      <div className="mt-3.5">{children}</div>
    </section>
  )
}

export function ProfileTimeline({
  items,
}: {
  items: Array<{ id: string; period: string; title: string; description: string | null }>
}) {
  return (
    <ol>
      {items.map((item, index) => (
        <li
          key={item.id}
          className="grid grid-cols-[14px_minmax(0,1fr)] gap-x-3 sm:grid-cols-[14px_96px_minmax(0,1fr)] sm:gap-x-4"
        >
          <span className="flex flex-col items-center">
            <span
              className={cn(
                'mt-1 size-2.5 shrink-0 rounded-full',
                index === 0
                  ? 'bg-[var(--action-primary)] shadow-[0_0_0_4px_var(--blue-50)]'
                  : 'bg-white shadow-[inset_0_0_0_2px_var(--grey-400)]',
              )}
            />
            {index < items.length - 1 ? (
              <span className="mt-1.5 w-0.5 flex-1 bg-[var(--blue-50)]" />
            ) : null}
          </span>
          <time className="hidden text-xs font-semibold text-[var(--text-faint)] sm:block">
            {item.period}
          </time>
          <div className={cn(index < items.length - 1 && 'pb-6')}>
            <p className="text-sm font-bold">{item.title}</p>
            <time className="mt-1 block text-xs font-semibold text-[var(--text-faint)] sm:hidden">
              {item.period}
            </time>
            {item.description ? (
              <p className="mt-2 text-[13px] leading-relaxed font-medium text-[var(--text-secondary)]">
                {item.description}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}

export function RailCard({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string
  actionLabel?: string
  onAction?: () => void
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[13px] bg-[var(--surface-inset)] p-3.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-bold text-[var(--text-faint)]">{title}</h2>
        {onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="text-[11px] font-bold text-[var(--blue-600)] hover:underline"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export function QuietEmpty({
  icon: Icon,
  children,
}: {
  icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <p className="flex items-center gap-2 text-xs font-medium text-[var(--text-faint)]">
      <Icon aria-hidden className="size-4" />
      {children}
    </p>
  )
}
export function ProfileTag({
  tone = 'blue',
  children,
}: {
  tone?: 'blue' | 'green'
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold',
        tone === 'blue'
          ? 'bg-[var(--blue-50)] text-[var(--blue-600)]'
          : 'bg-[var(--give-tint-weak)] text-[var(--action-give-text)]',
      )}
    >
      {tone === 'green' ? <i className="size-1.5 rounded-full bg-[var(--green-500)]" /> : null}
      {children}
    </span>
  )
}
export function patchAt<T>(items: T[], index: number, patch: Partial<T>): T[] {
  return items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
}
export function removeAt<T>(items: T[], index: number): T[] {
  return items.filter((_, itemIndex) => itemIndex !== index)
}
export function period(item: { startYear: number | null; endYear: number | null }): string {
  if (!item.startYear && !item.endYear) return 'Dates not listed'
  return `${item.startYear ?? 'Earlier'} — ${item.endYear ?? 'now'}`
}
export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  )
}
export function linkLabel(kind: ProfileContactLinkCommand['kind']): string {
  return kind === 'linkedin'
    ? 'LinkedIn'
    : kind === 'portfolio'
      ? 'Portfolio'
      : kind === 'email'
        ? 'Email'
        : kind === 'social'
          ? 'Social'
          : kind === 'website'
            ? 'Website'
            : 'Other'
}
export function audienceLabel(audience: ProfileContactLinkCommand['audience']): string {
  return audience === 'organization'
    ? 'Circle'
    : audience === 'connections'
      ? 'Connections'
      : 'Only you'
}

import type { ProfileContactLinkCommand } from '@/lib/profile/contracts'
