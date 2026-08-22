'use client'

import { ChevronDown, MapPin, Plus, Trash2 } from 'lucide-react'
import { useActionState, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { FieldError, FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { localDateTimeToIso } from '@/lib/school/admin-event-time'
import type { SchoolEventFormat } from '@/lib/school/contracts'
import { formatEventDate, formatEventTime } from '@/lib/school/time'
import { cn } from '@/lib/utils'
import { createEventAction, type EventCreateFormState } from './actions'

const initialState: EventCreateFormState = {}

// Same shape the database check enforces: region/city, no bare "UTC".
const REGIONAL_TIME_ZONE = /^[A-Za-z_]+(?:\/[A-Za-z0-9_+.-]+)+$/

function timeZoneOffsetLabel(zone: string) {
  try {
    const part = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      timeZoneName: 'longOffset',
    })
      .formatToParts(new Date())
      .find((candidate) => candidate.type === 'timeZoneName')
    return part?.value ?? ''
  } catch {
    return ''
  }
}

function buildTimeZoneOptions(): ComboboxOption[] {
  const zones =
    typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : ['America/Los_Angeles', 'Asia/Seoul', 'America/New_York', 'Europe/London']
  return zones
    .filter((zone) => REGIONAL_TIME_ZONE.test(zone))
    .map((zone) => ({
      value: zone,
      label: zone.replaceAll('_', ' '),
      hint: timeZoneOffsetLabel(zone),
    }))
}

function subscribeToNothing() {
  return () => undefined
}

function readViewerTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

type ScheduleDefault = { startsAtLocal: string; label: string }
type FactDefault = { label: string; value: string; linkLabel: string; linkUrl: string }

export type EventFormDefaults = {
  title: string
  summary: string
  description: string
  category: string
  format: SchoolEventFormat
  timeZone: string
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
  /** Categories already used by this org — combobox suggestions, free text allowed. */
  categoryOptions?: string[]
  /** Hosts already used by this org — combobox suggestions, free text allowed. */
  hostOptions?: string[]
}

export function EventForm({
  defaults = EMPTY_DEFAULTS,
  action = createEventAction,
  submitLabel,
  preserveOnSuccess = false,
  hiddenFields,
  categoryOptions = [],
  hostOptions = [],
}: Props) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const fe = state.fieldErrors ?? {}
  const formRef = useRef<HTMLFormElement>(null)
  const nextRowKey = useRef(defaults.schedule.length + defaults.facts.length)
  const [format, setFormat] = useState(defaults.format)
  const [timeZone, setTimeZone] = useState(defaults.timeZone)
  const [timeZoneFieldKey, setTimeZoneFieldKey] = useState(0)
  const [startsAtLocal, setStartsAtLocal] = useState(defaults.startsAtLocal)
  const [endsAtLocal, setEndsAtLocal] = useState(defaults.endsAtLocal)
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

  const timeZoneOptions = useMemo(() => buildTimeZoneOptions(), [])
  const viewerZone = useSyncExternalStore(subscribeToNothing, readViewerTimeZone, () => timeZone)
  const startInstant =
    startsAtLocal && REGIONAL_TIME_ZONE.test(timeZone)
      ? localDateTimeToIso(startsAtLocal, timeZone)
      : null
  const timeEcho = startInstant
    ? `${formatEventDate(startInstant, timeZone)} · ${formatEventTime(startInstant, timeZone)}${
        viewerZone !== timeZone
          ? ` — your time: ${formatEventDate(startInstant, viewerZone)} · ${formatEventTime(startInstant, viewerZone)}`
          : ''
      }`
    : null

  const categorySuggestions = useMemo(() => {
    const merged = [...new Set(['Community', 'Social', 'Career', 'Reunion', ...categoryOptions])]
    return merged.sort().map((value) => ({ value }))
  }, [categoryOptions])
  const hostSuggestions = useMemo(
    () => [...new Set(['Alumni Office', ...hostOptions])].sort().map((value) => ({ value })),
    [hostOptions],
  )

  const scheduleErrors = Object.keys(fe).some((key) => key.startsWith('schedule.'))
  const factErrors = Object.keys(fe).some((key) => key.startsWith('facts.'))

  const navItems = [
    ['event-basics', 'Basics'],
    ['event-time-place', 'Time & place'],
    ['event-capacity', 'Capacity'],
    ['event-description', 'Description'],
    ['event-schedule', 'Schedule'],
    ['event-facts', 'Useful details'],
    ...(preserveOnSuccess ? [['event-change-note', 'Member update'] as const] : []),
  ] as Array<readonly [string, string]>

  return (
    <form
      ref={formRef}
      action={formAction}
      className="xl:grid xl:grid-cols-[9.5rem_minmax(0,1fr)] xl:items-start xl:gap-8"
    >
      {hiddenFields
        ? Object.entries(hiddenFields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))
        : null}

      <nav aria-label="Form sections" className="sticky top-6 hidden xl:block">
        <ul className="space-y-0.5">
          {navItems.map(([target, label]) => (
            <li key={target}>
              <a
                href={`#${target}`}
                className="block rounded-[var(--radius-standard)] px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-[var(--hover-tint)] hover:text-foreground"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 space-y-7">
        <FormSection
          id="event-basics"
          title="Basics"
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
            <Field
              id="category"
              label="Category"
              hint="Pick one in use or type a new one."
              error={fe.category}
              required
            >
              <Combobox
                id="category"
                name="category"
                required
                maxLength={80}
                placeholder="Community"
                defaultValue={defaults.category}
                options={categorySuggestions}
                aria-invalid={fe.category ? true : undefined}
                aria-describedby={fe.category ? 'category-error' : undefined}
              />
            </Field>
            <Field
              id="hostName"
              label="Host"
              hint="A past host, or type a new name."
              error={fe.hostName}
              required
            >
              <Combobox
                id="hostName"
                name="hostName"
                required
                maxLength={200}
                placeholder="Alumni Office"
                defaultValue={defaults.hostName}
                options={hostSuggestions}
                aria-invalid={fe.hostName ? true : undefined}
                aria-describedby={fe.hostName ? 'hostName-error' : undefined}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection
          id="event-time-place"
          title="Time and place"
          description="Times are interpreted in the event time zone, wherever you are editing from."
        >
          <div className="grid gap-4 sm:grid-cols-2">
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
            <Field id="timeZone" label="Time zone" error={fe.timeZone} required>
              <Combobox
                key={timeZoneFieldKey}
                id="timeZone"
                name="timeZone"
                required
                placeholder="Search time zones…"
                defaultValue={timeZone}
                options={timeZoneOptions}
                emptyHint="No matching time zone."
                onValueChange={setTimeZone}
                aria-invalid={fe.timeZone ? true : undefined}
                aria-describedby={fe.timeZone ? 'timeZone-error' : undefined}
              />
              {viewerZone !== timeZone && REGIONAL_TIME_ZONE.test(viewerZone) ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-[var(--action-weak-text)] hover:underline"
                  onClick={() => {
                    setTimeZone(viewerZone)
                    setTimeZoneFieldKey((key) => key + 1)
                  }}
                >
                  Use my time zone ({viewerZone.replaceAll('_', ' ')})
                </button>
              ) : null}
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="startsAt" label="Start" error={fe.startsAt} required>
              <Input
                id="startsAt"
                name="startsAt"
                type="datetime-local"
                required
                value={startsAtLocal}
                onChange={(event) => setStartsAtLocal(event.target.value)}
                aria-invalid={fe.startsAt ? true : undefined}
                aria-describedby={fe.startsAt ? 'startsAt-error' : undefined}
              />
            </Field>
            <Field id="endsAt" label="End" error={fe.endsAt} hint="Optional">
              <Input
                id="endsAt"
                name="endsAt"
                type="datetime-local"
                value={endsAtLocal}
                onChange={(event) => setEndsAtLocal(event.target.value)}
                aria-invalid={fe.endsAt ? true : undefined}
                aria-describedby={fe.endsAt ? 'endsAt-error' : undefined}
              />
            </Field>
          </div>
          {timeEcho ? (
            <p className="rounded-[var(--radius-standard)] bg-surface-panel px-3 py-2 text-xs font-medium text-text-muted">
              {timeEcho}
            </p>
          ) : null}

          <div hidden={!needsLocation} className="space-y-4">
            <p className="flex items-center gap-1.5 text-xs font-bold tracking-label text-[var(--text-faint)] uppercase">
              <MapPin aria-hidden className="size-3.5" />
              In person
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="locationName" label="Location" error={fe.locationName} required>
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
          </div>

          <div hidden={!needsJoinLink} className="space-y-4">
            <p className="text-xs font-bold tracking-label text-[var(--text-faint)] uppercase">
              Online
            </p>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
              <Field
                id="joinUrl"
                label="Join link"
                hint="Stays private to members; appears near the event time."
                error={fe.joinUrl}
                required
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
                  required={needsJoinLink}
                  defaultValue={defaults.joinWindowMinutes}
                  aria-invalid={fe.joinWindowMinutes ? true : undefined}
                  aria-describedby={fe.joinWindowMinutes ? 'joinWindowMinutes-error' : undefined}
                />
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection
          id="event-capacity"
          title="Capacity"
          description="Leave capacity blank when space is unlimited."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="capacity" label="Capacity" error={fe.capacity}>
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
          id="event-description"
          title="Full description"
          description="What members can expect, and anything to know before coming."
          collapsible
          defaultOpen={Boolean(defaults.description)}
          forceOpen={Boolean(fe.description)}
        >
          <Field id="description" label="Full description" error={fe.description} hideLabel>
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
          id="event-schedule"
          title="Schedule"
          description="Optional agenda items appear in this order on the event page."
          collapsible
          defaultOpen={schedule.length > 0}
          forceOpen={scheduleErrors}
          count={schedule.length}
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
                        fe[`schedule.${index}.label`]
                          ? `schedule-${item.key}-label-error`
                          : undefined
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
          collapsible
          defaultOpen={facts.length > 0}
          forceOpen={factErrors}
          count={facts.length}
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
                      onClick={() =>
                        setFacts((items) => items.filter((row) => row.key !== item.key))
                      }
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
                          fe[`facts.${index}.linkUrl`]
                            ? `fact-${item.key}-linkUrl-error`
                            : undefined
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
            collapsible
            defaultOpen={false}
            forceOpen={Boolean(fe.changeNote)}
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

        <div className="sticky bottom-0 z-20 -mx-6 flex flex-wrap items-center gap-3 border-t border-border-subtle bg-card px-6 py-3">
          <Button type="submit" variant="cta" disabled={pending} aria-busy={pending}>
            {pending
              ? preserveOnSuccess
                ? 'Saving…'
                : 'Publishing…'
              : (submitLabel ?? 'Publish event')}
          </Button>
          {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
          {state.ok ? (
            <FormMessage tone="success">
              {preserveOnSuccess ? 'Event updated.' : 'Event published.'}
            </FormMessage>
          ) : null}
        </div>
      </div>
    </form>
  )
}

function FormSection({
  id,
  title,
  description,
  action,
  collapsible = false,
  defaultOpen = true,
  forceOpen = false,
  count,
  children,
}: {
  id: string
  title: string
  description: string
  action?: React.ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
  forceOpen?: boolean
  count?: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(collapsible ? defaultOpen : true)
  // Adjust-during-render (not an effect): the section must reveal its field
  // errors the moment a failed submit arrives with forceOpen set.
  const [prevForceOpen, setPrevForceOpen] = useState(forceOpen)
  if (forceOpen !== prevForceOpen) {
    setPrevForceOpen(forceOpen)
    if (forceOpen) setOpen(true)
  }

  const heading = (
    <div className="space-y-1">
      <h2 id={id} className="scroll-mt-24 text-base font-semibold text-text-primary">
        {title}
        {collapsible && count ? (
          <span className="ml-2 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-surface-panel px-1.5 align-middle text-fine font-bold text-text-muted tabular-nums">
            {count}
          </span>
        ) : null}
      </h2>
      <p className="text-sm text-text-muted">{description}</p>
    </div>
  )

  if (!collapsible) {
    return (
      <section
        aria-labelledby={id}
        className="space-y-4 border-t border-divider-row pt-6 first:border-0 first:pt-0"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          {heading}
          {action}
        </div>
        {children}
      </section>
    )
  }

  return (
    <section
      aria-labelledby={id}
      className="border-t border-divider-row pt-6 first:border-0 first:pt-0"
      // A required field left invalid inside a closed section would block
      // submit invisibly — open the section the moment the browser objects.
      onInvalidCapture={() => setOpen(true)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-body`}
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-start justify-between gap-3 rounded-[var(--radius-standard)] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {heading}
          <ChevronDown
            aria-hidden
            className={cn(
              'mt-1 size-4 shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>
        {open ? action : null}
      </div>
      <div id={`${id}-body`} className={cn('mt-4 space-y-4', !open && 'hidden')}>
        {children}
      </div>
    </section>
  )
}

function Field({
  id,
  label,
  hint,
  error,
  required,
  hideLabel,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  /** For fields whose section heading already names them. */
  hideLabel?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          'flex flex-wrap items-baseline justify-between gap-2',
          hideLabel && 'sr-only',
        )}
      >
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
