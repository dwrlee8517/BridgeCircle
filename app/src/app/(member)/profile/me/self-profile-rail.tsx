'use client'

import { ExternalLink, Link2, Plus } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ProfileContactLinkCommand, SelfProfile } from '@/lib/profile/contracts'
import { cn } from '@/lib/utils'
import { initialProfileActionState, saveLinksAction, saveVisibilityAction } from './actions'
import {
  ActionFooter,
  audienceLabel,
  DraftInput,
  linkLabel,
  patchAt,
  RailCard,
  removeAt,
  selectClass,
} from './self-profile-ui'

type LinkDraft = ProfileContactLinkCommand & { _key: string }
type Audience = LinkDraft['audience']

export function SelfProfileRail({
  links: savedLinks,
  visibility,
  openToHelp,
}: {
  links: SelfProfile['links']
  visibility: SelfProfile['visibility']
  openToHelp: boolean
}) {
  const [editor, setEditor] = useState<'links' | 'privacy' | null>(null)
  const [links, setLinks] = useState<LinkDraft[]>(() => savedLinks.map(linkDraft))
  const [linksState, linksAction, linksPending] = useActionState(
    saveLinksAction,
    initialProfileActionState,
  )
  const [visibilityState, visibilityAction, visibilityPending] = useActionState(
    saveVisibilityAction,
    initialProfileActionState,
  )

  function toggleLinks() {
    if (editor !== 'links') setLinks(savedLinks.map(linkDraft))
    setEditor((value) => (value === 'links' ? null : 'links'))
  }

  return (
    <aside className="space-y-3 border-t border-[var(--divider-row)] pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-7">
      <RailCard
        title="Links & contact"
        actionLabel={savedLinks.length ? 'Edit' : 'Add'}
        onAction={toggleLinks}
      >
        {editor === 'links' ? (
          <form action={linksAction} className="mt-3">
            <input type="hidden" name="links" value={JSON.stringify(links)} />
            <div className="space-y-3">
              {links.map((item, index) => (
                <LinkFields
                  key={item._key}
                  value={item}
                  onChange={(patch) => setLinks((values) => patchAt(values, index, patch))}
                  onRemove={() => setLinks((values) => removeAt(values, index))}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setLinks((values) => [...values, emptyLink()])}
            >
              <Plus aria-hidden /> Add link
            </Button>
            <ActionFooter state={linksState} pending={linksPending} compact />
          </form>
        ) : savedLinks.length ? (
          savedLinks.map((item) => (
            <a
              key={item.id}
              href={item.kind === 'email' ? `mailto:${item.value}` : item.value}
              target={item.kind === 'email' ? undefined : '_blank'}
              rel={item.kind === 'email' ? undefined : 'noreferrer'}
              className="mt-2.5 flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs font-bold text-[var(--blue-600)] hover:bg-[var(--blue-50)]"
            >
              <Link2 aria-hidden className="size-3.5" />
              <span className="min-w-0 truncate">{item.label || linkLabel(item.kind)}</span>
              <span className="ml-auto text-[10px] font-semibold text-[var(--text-faint)]">
                {audienceLabel(item.audience)}
              </span>
              {item.kind !== 'email' ? <ExternalLink aria-hidden className="size-3" /> : null}
            </a>
          ))
        ) : (
          <p className="mt-2 text-xs font-medium text-[var(--text-faint)]">No links added.</p>
        )}
      </RailCard>

      <RailCard
        title="Who can see what"
        actionLabel="Edit"
        onAction={() => setEditor((value) => (value === 'privacy' ? null : 'privacy'))}
      >
        {editor === 'privacy' ? (
          <form action={visibilityAction} className="mt-3 space-y-3">
            {visibilityFields.map(([key, label]) => (
              <AudienceField
                key={key}
                name={key}
                label={label}
                defaultValue={visibility[key] || 'organization'}
              />
            ))}
            <ActionFooter state={visibilityState} pending={visibilityPending} compact />
          </form>
        ) : (
          <div className="mt-2 space-y-2">
            {visibilityFields.map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-semibold text-[var(--text-secondary)]">{label}</span>
                <span className="font-medium text-[var(--text-faint)]">
                  {audienceLabel(visibility[key] || 'organization')}
                </span>
              </div>
            ))}
          </div>
        )}
      </RailCard>

      <RailCard title="Helping">
        <p className="mt-2 text-xs font-semibold text-[var(--text-secondary)]">
          {openToHelp ? 'Open to help' : 'Not open right now'}
        </p>
        <Link
          href="/help/settings"
          className="mt-2 inline-flex text-[11px] font-bold text-[var(--blue-600)]"
        >
          Edit availability
        </Link>
      </RailCard>
      <RailCard title="Email & quiet">
        <p className="mt-2 text-[11px] leading-relaxed font-medium text-[var(--text-faint)]">
          Notification history and controls stay outside your public profile.
        </p>
        <Link
          href="/notifications"
          className="mt-2 inline-flex text-[11px] font-bold text-[var(--blue-600)]"
        >
          Open notifications
        </Link>
      </RailCard>
    </aside>
  )
}

const visibilityFields = [
  ['bio', 'About'],
  ['career_history', 'Career'],
  ['education_history', 'Education'],
  ['skills', 'Skills'],
] as const

function LinkFields({
  value,
  onChange,
  onRemove,
}: {
  value: LinkDraft
  onChange: (patch: Partial<LinkDraft>) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-white p-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-[var(--text-faint)] hover:bg-[var(--row-hover)]"
          aria-label="Remove link"
        >
          Remove
        </button>
      </div>
      <label className="text-sm font-medium">
        Kind
        <select
          value={value.kind}
          onChange={(event) => onChange({ kind: event.target.value as LinkDraft['kind'] })}
          className={cn(selectClass, 'mt-1.5')}
        >
          {(['linkedin', 'portfolio', 'website', 'social', 'email', 'other'] as const).map(
            (kind) => (
              <option key={kind} value={kind}>
                {linkLabel(kind)}
              </option>
            ),
          )}
        </select>
      </label>
      <div className="mt-3">
        <DraftInput
          label={value.kind === 'email' ? 'Email' : 'Link'}
          value={value.value}
          onChange={(next) => onChange({ value: next })}
        />
      </div>
      <div className="mt-3">
        <DraftInput
          label="Label"
          value={value.label ?? ''}
          onChange={(label) => onChange({ label: label || null })}
        />
      </div>
      <div className="mt-3">
        <AudienceField
          name=""
          label="Who can see this"
          value={value.audience}
          onChange={(audience) => onChange({ audience })}
        />
      </div>
    </div>
  )
}

function AudienceField({
  name,
  label,
  defaultValue,
  value,
  onChange,
}: {
  name: string
  label: string
  defaultValue?: Audience
  value?: Audience
  onChange?: (value: Audience) => void
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <select
        name={name || undefined}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value as Audience) : undefined}
        className={cn(selectClass, 'mt-1.5')}
      >
        <option value="organization">Anyone in your circle</option>
        <option value="connections">Connections only</option>
        <option value="self">Only you</option>
      </select>
    </label>
  )
}

function linkDraft({ id, ...value }: SelfProfile['links'][number]): LinkDraft {
  return { _key: id, ...value }
}
function emptyLink(): LinkDraft {
  return {
    _key: crypto.randomUUID(),
    kind: 'website',
    label: null,
    value: 'https://',
    audience: 'self',
  }
}
