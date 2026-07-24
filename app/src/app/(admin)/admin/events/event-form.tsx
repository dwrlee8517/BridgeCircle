'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldError, FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { AdminSchoolEvent, SchoolEventFormat } from '@/lib/school/contracts'
import { createEventAction, type EventCreateFormState } from './actions'

const initialState: EventCreateFormState = {}

const TIME_ZONES = [
  ['America/Los_Angeles', 'Pacific time — Los Angeles'],
  ['Asia/Seoul', 'Korea time — Seoul'],
  ['America/New_York', 'Eastern time — New York'],
  ['America/Chicago', 'Central time — Chicago'],
  ['America/Denver', 'Mountain time — Denver'],
  ['America/Phoenix', 'Mountain time — Phoenix'],
  ['Pacific/Honolulu', 'Hawaii time — Honolulu'],
  ['Europe/London', 'United Kingdom time — London'],
  ['Europe/Paris', 'Central European time — Paris'],
  ['Asia/Tokyo', 'Japan time — Tokyo'],
  ['Asia/Hong_Kong', 'Hong Kong time'],
  ['Australia/Sydney', 'Australian Eastern time — Sydney'],
] as const

type ScheduleDefault = { startsAtLocal: string; label: string }
type FactDefault = { label: string; value: string; linkLabel: string; linkUrl: string }

export type EventFormDefaults = {
  title: string
  summary: string
  description: string
  category: string
  format: SchoolEventFormat
  timeZone: string
  campus: AdminSchoolEvent['campus']
  startsAtLocal: string
  endsAtLocal: string
  locationName: string
  locationAddress: string
  mapsUrl: string
  joinUrl: string
  joinWindowMinutes: string
  hostName: string
  capacity: string
  allowWaitlist: boolean
  changeNote: string
  schedule: ScheduleDefault[]
  facts: FactDefault[]
}

const EMPTY_DEFAULTS: EventFormDefaults = {
  title: '',
  summary: '',
  description: '',
  category: 'Community',
  format: 'in_person',
  timeZone: 'America/Los_Angeles',
  campus: 'palos_verdes',
  startsAtLocal: '',
  endsAtLocal: '',
  locationName: '',
  locationAddress: '',
  mapsUrl: '',
  joinUrl: '',
  joinWindowMinutes: '60',
  hostName: 'Alumni Office',
  capacity: '',
  allowWaitlist: false,
  changeNote: '',
  schedule: [],
  facts: [],
}

type Row<T> = T & { key: number }

type Props = {
  defaults?: EventFormDefaults
  action?: typeof createEventAction
  submitLabel?: string
  preserveOnSuccess?: boolean
  hiddenFields?: Record<string, string>
}

export function EventForm({
  defaults = EMPTY_DEFAULTS,
  action = createEventAction,
  submitLabel,
  preserveOnSuccess = false,
  hiddenFields,
}: Props) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const fe = state.fieldErrors ?? {}
  const formRef = useRef<HTMLFormElement>(null)
  const nextRowKey = useRef(defaults.schedule.length + defaults.facts.length)
  const [format, setFormat] = useState(defaults.format)
  const [capacity, setCapacity] = useState(defaults.capacity)
  const [allowWaitlist, setAllowWaitlist] = useState(defaults.allowWaitlist)
  const [schedule, setSchedule] = useState<Array<Row<ScheduleDefault>>>(() =>
    defaults.schedule.map((item, index) => ({ ...item, key: index })),
  )
  const [facts, setFacts] = useState<Array<Row<FactDefault>>>(() =>
    defaults.facts.map((item, index) => ({ ...item, key: defaults.schedule.length + index })),
  )

  useEffect(() => {
    if (state.error || state.fieldErrors) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    }
  }, [state.error, state.fieldErrors])

  function addScheduleItem() {
    nextRowKey.current += 1
    setSchedule((items) => [...items, { key: nextRowKey.current, startsAtLocal: '', label: '' }])
  }

  function addFact() {
    nextRowKey.current += 1
    setFacts((items) => [
      ...items,
      { key: nextRowKey.current, label: '', value: '', linkLabel: '', linkUrl: '' },
    ])
  }

  const needsLocation = format === 'in_person' || format === 'hybrid'
  const needsJoinLink = format === 'online' || format === 'hybrid'

  return (
    <form ref={formRef} action={formAction} className="space-y-7">
      {hiddenFields
        ? Object.entries(hiddenFields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))
        : null}

      <FormSection
        id="event-overview"
        title="Overview"
        description="The details members use to decide whether this event is for them."
      >
        <Field id="title" label="Title" error={fe.title} required>
          <Input
            id="title"
            name="title"
            required
            maxLength={300}
            placeholder="Spring alumni mixer"
            defaultValue={defaults.title}
            aria-invalid={fe.title ? true : undefined}
            aria-describedby={fe.title ? 'title-error' : undefined}
          />
        </Field>

        <Field
          id="summary"
          label="Summary"
          hint="A clear sentence shown on event cards."
          error={fe.summary}
          required
        >
          <Textarea
            id="summary"
            name="summary"
            required
            rows={2}
            maxLength={500}
            placeholder="Meet alumni across class years for an easy evening of conversation."
            defaultValue={defaults.summary}
            aria-invalid={fe.summary ? true : undefined}
            aria-describedby={fe.summary ? 'summary-error' : undefined}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="category" label="Category" error={fe.category} required>
            <Input
              id="category"
              name="category"
              required
              maxLength={80}
              placeholder="Community"
              defaultValue={defaults.category}
              aria-invalid={fe.category ? true : undefined}
              aria-describedby={fe.category ? 'category-error' : undefined}
            />
          </Field>
          <Field id="hostName" label="Host" error={fe.hostName} required>
            <Input
              id="hostName"
              name="hostName"
              required
              maxLength={200}
              placeholder="Alumni Office"
              defaultValue={defaults.hostName}
              aria-invalid={fe.hostName ? true : undefined}
              aria-describedby={fe.hostName ? 'hostName-error' : undefined}
            />
          </Field>
        </div>

        <Field id="description" label="Full description" error={fe.description}>
          <Textarea
            id="description"
            name="description"
            rows={5}
            maxLength={20_000}
            placeholder="Share what members can expect and anything they should know before coming."
            defaultValue={defaults.description}
            aria-invalid={fe.description ? true : undefined}
            aria-describedby={fe.description ? 'description-error' : undefined}
          />
        </Field>
      </FormSection>

      <FormSection
        id="event-time-place"
        title="Time and place"
        description="Times are interpreted in the event time zone, wherever you are editing from."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="format" label="Format" error={fe.format} required>
            <select
              id="format"
              name="format"
              value={format}
              onChange={(event) => setFormat(event.target.value as SchoolEventFormat)}
              className="h-10 w-full rounded-[var(--radius-standard)] border border-input bg-surface-card px-3 text-sm outline-none focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-soft"
              aria-invalid={fe.format ? true : undefined}
              aria-describedby={fe.format ? 'format-error' : undefined}
            >
              <option value="in_person">In person</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </Field>
          <Field id="campus" label="Campus" error={fe.campus} required>
            <select
              id="campus"
              name="campus"
              defaultValue={defaults.campus}
              className="h-10 w-full rounded-[var(--radius-standard)] border border-input bg-surface-card px-3 text-sm outline-none focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-soft"
              aria-invalid={fe.campus ? true : undefined}
              aria-describedby={fe.campus ? 'campus-error' : undefined}
            >
              <option value="palos_verdes">Palos Verdes</option>
              <option value="songdo">Songdo</option>
              <option value="online">Online</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field id="timeZone" label="Time zone" error={fe.timeZone} required>
            <select
              id="timeZone"
              name="timeZone"
              defaultValue={defaults.timeZone}
              className="h-10 w-full rounded-[var(--radius-standard)] border border-input bg-surface-card px-3 text-sm outline-none focus-visible:border-focus-ring focus-visible:ring-4 focus-visible:ring-focus-ring-soft"
              aria-invalid={fe.timeZone ? true : undefined}
              aria-describedby={fe.timeZone ? 'timeZone-error' : undefined}
            >
              {TIME_ZONES.some(([value]) => value === defaults.timeZone) ? null : (
                <option value={defaults.timeZone}>{defaults.timeZone}</option>
              )}
              {TIME_ZONES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="startsAt" label="Start" error={fe.startsAt} required>
            <Input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={defaults.startsAtLocal}
              aria-invalid={fe.startsAt ? true : undefined}
              aria-describedby={fe.startsAt ? 'startsAt-error' : undefined}
            />
          </Field>
          <Field id="endsAt" label="End" error={fe.endsAt} required>
            <Input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              required
              defaultValue={defaults.endsAtLocal}
              aria-invalid={fe.endsAt ? true : undefined}
              aria-describedby={fe.endsAt ? 'endsAt-error' : undefined}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="locationName"
            label="Location"
            hint={needsLocation ? 'Required for this format.' : 'Optional for online events.'}
            error={fe.locationName}
            required={needsLocation}
          >
            <Input
              id="locationName"
              name="locationName"
              required={needsLocation}
              maxLength={300}
              placeholder="Chadwick School"
              defaultValue={defaults.locationName}
              aria-invalid={fe.locationName ? true : undefined}
              aria-describedby={fe.locationName ? 'locationName-error' : undefined}
            />
          </Field>
          <Field id="locationAddress" label="Address" error={fe.locationAddress}>
            <Input
              id="locationAddress"
              name="locationAddress"
              maxLength={1_000}
              placeholder="26800 Academy Drive"
              defaultValue={defaults.locationAddress}
              aria-invalid={fe.locationAddress ? true : undefined}
              aria-describedby={fe.locationAddress ? 'locationAddress-error' : undefined}
            />
          </Field>
        </div>

        <Field id="mapsUrl" label="Maps link" error={fe.mapsUrl}>
          <Input
            id="mapsUrl"
            name="mapsUrl"
            type="url"
            inputMode="url"
            maxLength={2_000}
            placeholder="https://maps.google.com/…"
            defaultValue={defaults.mapsUrl}
            aria-invalid={fe.mapsUrl ? true : undefined}
            aria-describedby={fe.mapsUrl ? 'mapsUrl-error' : undefined}
          />
        </Field>
      </FormSection>

      <FormSection
        id="event-access"
        title="Access and capacity"
        description="Join links remain private to members and appear near the event time."
      >
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <Field
            id="joinUrl"
            label="Join link"
            hint={needsJoinLink ? 'Required for this format.' : 'Optional for in-person events.'}
            error={fe.joinUrl}
            required={needsJoinLink}
          >
            <Input
              id="joinUrl"
              name="joinUrl"
              type="url"
              inputMode="url"
              required={needsJoinLink}
              maxLength={2_000}
              placeholder="https://meet.example.com/…"
              defaultValue={defaults.joinUrl}
              aria-invalid={fe.joinUrl ? true : undefined}
              aria-describedby={fe.joinUrl ? 'joinUrl-error' : undefined}
            />
          </Field>
          <Field
            id="joinWindowMinutes"
            label="Show link before"
            hint="Minutes"
            error={fe.joinWindowMinutes}
            required
          >
            <Input
              id="joinWindowMinutes"
              name="joinWindowMinutes"
              type="number"
              min={15}
              max={1_440}
              step={1}
              inputMode="numeric"
              required
              defaultValue={defaults.joinWindowMinutes}
              aria-invalid={fe.joinWindowMinutes ? true : undefined}
              aria-describedby={fe.joinWindowMinutes ? 'joinWindowMinutes-error' : undefined}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="capacity"
            label="Capacity"
            hint="Leave blank when space is unlimited."
            error={fe.capacity}
          >
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder="80"
              value={capacity}
              onChange={(event) => {
                const value = event.target.value
                setCapacity(value)
                if (!value) setAllowWaitlist(false)
              }}
              aria-invalid={fe.capacity ? true : undefined}
              aria-describedby={fe.capacity ? 'capacity-error' : undefined}
            />
          </Field>
          <div className="flex items-start gap-3 rounded-[var(--radius-box)] bg-surface-panel p-4 sm:mt-6">
            <Checkbox
              id="allowWaitlist"
              name="allowWaitlist"
              checked={allowWaitlist}
              disabled={!capacity}
              onCheckedChange={(checked) => setAllowWaitlist(checked === true)}
              aria-invalid={fe.allowWaitlist ? true : undefined}
              aria-describedby={fe.allowWaitlist ? 'allowWaitlist-error' : undefined}
            />
            <div className="space-y-1">
              <Label htmlFor="allowWaitlist">Allow a waitlist</Label>
              <p className="text-xs text-text-muted">
                Members can join the waitlist after the event reaches capacity.
              </p>
              <FieldError id="allowWaitlist-error" error={fe.allowWaitlist} />
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection
        id="event-schedule"
        title="Schedule"
        description="Optional agenda items appear in this order on the event page."
        action={
          <Button type="button" variant="outline" size="sm" onClick={addScheduleItem}>
            <Plus data-icon="inline-start" />
            Add schedule item
          </Button>
        }
      >
        {schedule.length === 0 ? (
          <p className="rounded-[var(--radius-box)] bg-surface-panel px-4 py-3 text-sm text-text-muted">
            No schedule items added.
          </p>
        ) : (
          <div className="space-y-3">
            {schedule.map((item, index) => (
              <div
                key={item.key}
                className="grid gap-3 rounded-[var(--radius-box)] border border-border-subtle bg-surface-panel p-4 sm:grid-cols-[11rem_minmax(0,1fr)_auto]"
              >
                <Field
                  id={`schedule-${item.key}-startsAt`}
                  label="Time"
                  hint="Optional"
                  error={fe[`schedule.${index}.startsAt`]}
                >
                  <Input
                    id={`schedule-${item.key}-startsAt`}
                    name={`schedule.${index}.startsAt`}
                    type="datetime-local"
                    value={item.startsAtLocal}
                    onChange={(event) =>
                      setSchedule((items) =>
                        items.map((candidate) =>
                          candidate.key === item.key
                            ? { ...candidate, startsAtLocal: event.target.value }
                            : candidate,
                        ),
                      )
                    }
                    aria-invalid={fe[`schedule.${index}.startsAt`] ? true : undefined}
                    aria-describedby={
                      fe[`schedule.${index}.startsAt`]
                        ? `schedule-${item.key}-startsAt-error`
                        : undefined
                    }
                  />
                </Field>
                <Field
                  id={`schedule-${item.key}-label`}
                  label="Schedule item"
                  error={fe[`schedule.${index}.label`]}
                  required
                >
                  <Input
                    id={`schedule-${item.key}-label`}
                    name={`schedule.${index}.label`}
                    required
                    maxLength={500}
                    placeholder="Welcome and introductions"
                    value={item.label}
                    onChange={(event) =>
                      setSchedule((items) =>
                        items.map((candidate) =>
                          candidate.key === item.key
                            ? { ...candidate, label: event.target.value }
                            : candidate,
                        ),
                      )
                    }
                    aria-invalid={fe[`schedule.${index}.label`] ? true : undefined}
                    aria-describedby={
                      fe[`schedule.${index}.label`] ? `schedule-${item.key}-label-error` : undefined
                    }
                  />
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="self-end"
                  onClick={() =>
                    setSchedule((items) => items.filter((row) => row.key !== item.key))
                  }
                  aria-label={`Remove schedule item ${index + 1}`}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
        )}
      </FormSection>

      <FormSection
        id="event-facts"
        title="Useful details"
        description="Optional facts help members prepare without searching through the description."
        action={
          <Button type="button" variant="outline" size="sm" onClick={addFact}>
            <Plus data-icon="inline-start" />
            Add detail
          </Button>
        }
      >
        {facts.length === 0 ? (
          <p className="rounded-[var(--radius-box)] bg-surface-panel px-4 py-3 text-sm text-text-muted">
            No additional details added.
          </p>
        ) : (
          <div className="space-y-3">
            {facts.map((item, index) => (
              <div
                key={item.key}
                className="space-y-3 rounded-[var(--radius-box)] border border-border-subtle bg-surface-panel p-4"
              >
                <div className="grid gap-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_auto]">
                  <Field
                    id={`fact-${item.key}-label`}
                    label="Label"
                    error={fe[`facts.${index}.label`]}
                    required
                  >
                    <Input
                      id={`fact-${item.key}-label`}
                      name={`facts.${index}.label`}
                      required
                      maxLength={100}
                      placeholder="Parking"
                      value={item.label}
                      onChange={(event) =>
                        setFacts((items) =>
                          items.map((candidate) =>
                            candidate.key === item.key
                              ? { ...candidate, label: event.target.value }
                              : candidate,
                          ),
                        )
                      }
                      aria-invalid={fe[`facts.${index}.label`] ? true : undefined}
                      aria-describedby={
                        fe[`facts.${index}.label`] ? `fact-${item.key}-label-error` : undefined
                      }
                    />
                  </Field>
                  <Field
                    id={`fact-${item.key}-value`}
                    label="Detail"
                    error={fe[`facts.${index}.value`]}
                    required
                  >
                    <Input
                      id={`fact-${item.key}-value`}
                      name={`facts.${index}.value`}
                      required
                      maxLength={1_000}
                      placeholder="Use the main lot by the gym"
                      value={item.value}
                      onChange={(event) =>
                        setFacts((items) =>
                          items.map((candidate) =>
                            candidate.key === item.key
                              ? { ...candidate, value: event.target.value }
                              : candidate,
                          ),
                        )
                      }
                      aria-invalid={fe[`facts.${index}.value`] ? true : undefined}
                      aria-describedby={
                        fe[`facts.${index}.value`] ? `fact-${item.key}-value-error` : undefined
                      }
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="self-end"
                    onClick={() => setFacts((items) => items.filter((row) => row.key !== item.key))}
                    aria-label={`Remove detail ${index + 1}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    id={`fact-${item.key}-linkLabel`}
                    label="Link text"
                    hint="Optional — add both link fields."
                    error={fe[`facts.${index}.linkLabel`]}
                  >
                    <Input
                      id={`fact-${item.key}-linkLabel`}
                      name={`facts.${index}.linkLabel`}
                      maxLength={100}
                      placeholder="View parking map"
                      value={item.linkLabel}
                      onChange={(event) =>
                        setFacts((items) =>
                          items.map((candidate) =>
                            candidate.key === item.key
                              ? { ...candidate, linkLabel: event.target.value }
                              : candidate,
                          ),
                        )
                      }
                      aria-invalid={fe[`facts.${index}.linkLabel`] ? true : undefined}
                      aria-describedby={
                        fe[`facts.${index}.linkLabel`]
                          ? `fact-${item.key}-linkLabel-error`
                          : undefined
                      }
                    />
                  </Field>
                  <Field
                    id={`fact-${item.key}-linkUrl`}
                    label="Link"
                    error={fe[`facts.${index}.linkUrl`]}
                  >
                    <Input
                      id={`fact-${item.key}-linkUrl`}
                      name={`facts.${index}.linkUrl`}
                      type="url"
                      inputMode="url"
                      maxLength={2_000}
                      placeholder="https://…"
                      value={item.linkUrl}
                      onChange={(event) =>
                        setFacts((items) =>
                          items.map((candidate) =>
                            candidate.key === item.key
                              ? { ...candidate, linkUrl: event.target.value }
                              : candidate,
                          ),
                        )
                      }
                      aria-invalid={fe[`facts.${index}.linkUrl`] ? true : undefined}
                      aria-describedby={
                        fe[`facts.${index}.linkUrl`] ? `fact-${item.key}-linkUrl-error` : undefined
                      }
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </FormSection>

      {preserveOnSuccess ? (
        <FormSection
          id="event-change-note"
          title="Member update"
          description="If details changed, this note appears with the update for members who responded."
        >
          <Field id="changeNote" label="Change note" error={fe.changeNote}>
            <Textarea
              id="changeNote"
              name="changeNote"
              rows={3}
              maxLength={1_000}
              placeholder="The start time moved to 7:00pm. Everything else stays the same."
              defaultValue={defaults.changeNote}
              aria-invalid={fe.changeNote ? true : undefined}
              aria-describedby={fe.changeNote ? 'changeNote-error' : undefined}
            />
          </Field>
        </FormSection>
      ) : (
        <input type="hidden" name="changeNote" value="" />
      )}

      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
      {state.ok ? (
        <FormMessage tone="success">
          {preserveOnSuccess ? 'Event updated.' : 'Event published.'}
        </FormMessage>
      ) : null}

      <Button type="submit" variant="cta" disabled={pending} aria-busy={pending}>
        {pending
          ? preserveOnSuccess
            ? 'Saving…'
            : 'Publishing…'
          : (submitLabel ?? 'Publish event')}
      </Button>
    </form>
  )
}

function FormSection({
  id,
  title,
  description,
  action,
  children,
}: {
  id: string
  title: string
  description: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section
      aria-labelledby={id}
      className="space-y-4 border-t border-divider-row pt-6 first:border-0 first:pt-0"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 id={id} className="text-base font-semibold text-text-primary">
            {title}
          </h2>
          <p className="text-sm text-text-muted">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label htmlFor={id}>
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </Label>
        {hint ? <span className="text-xs text-text-muted">{hint}</span> : null}
      </div>
      {children}
      <FieldError id={`${id}-error`} error={error} />
    </div>
  )
}
