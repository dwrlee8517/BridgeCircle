'use client'

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MessageCircle,
  Search,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type {
  MemberProfile,
  PeopleDirectoryItem,
  PeopleDirectoryResult,
  PeopleRelationship,
  PeopleScope,
} from '@/lib/people/contracts'
import { matchEvidenceCopy } from '@/lib/people/operations'
import {
  activePeopleFilterCount,
  type PeopleSearchParams,
  peopleSearchHref,
} from '@/lib/people/query'
import { cn, directHelpHref } from '@/lib/utils'
import { ConnectionComposer, type ConnectionComposerStatus } from './connection-composer'

const DESKTOP_PAGE_SIZE = 20
const MOBILE_REVEAL_SIZE = 20

type PreviewState =
  | { status: 'idle' }
  | { status: 'loading'; userId: string }
  | { status: 'ready'; userId: string; profile: MemberProfile; avatarUrl: string | null }
  | { status: 'unavailable'; userId: string }
  | { status: 'error'; userId: string }

type ConnectionState = {
  person: PeopleDirectoryItem
  clientRequestId: string
  sharedContext: string[]
  status: ConnectionComposerStatus
}

export function PeopleDirectory({
  organizationId,
  organizationName,
  viewerGraduationYear,
  initialSearch,
  initialResult,
  initialAvatarUrls,
  invalidSearch,
}: {
  organizationId: string
  organizationName: string
  viewerGraduationYear: number | null
  initialSearch: PeopleSearchParams
  initialResult: PeopleDirectoryResult
  initialAvatarUrls: Record<string, string>
  invalidSearch: boolean
}) {
  const router = useRouter()
  const [isNavigating, startTransition] = useTransition()
  const [page, setPage] = useState(1)
  const [mobileVisible, setMobileVisible] = useState(MOBILE_REVEAL_SIZE)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewState>({ status: 'idle' })
  const [widePreview, setWidePreview] = useState(false)
  const [connection, setConnection] = useState<ConnectionState | null>(null)
  const [relationships, setRelationships] = useState<Record<string, PeopleRelationship>>({})
  const requestSequence = useRef(0)
  const previewCache = useRef(new Map<string, Extract<PreviewState, { status: 'ready' }>>())

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const update = () => setWidePreview(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const pageCount = Math.max(1, Math.ceil(initialResult.items.length / DESKTOP_PAGE_SIZE))
  const desktopItems = initialResult.items.slice(
    (page - 1) * DESKTOP_PAGE_SIZE,
    page * DESKTOP_PAGE_SIZE,
  )
  const mobileItems = initialResult.items.slice(0, mobileVisible)
  const selectedPerson = initialResult.items.find((item) => item.userId === selectedId) ?? null

  async function selectPerson(person: PeopleDirectoryItem) {
    if (selectedId === person.userId) {
      closePreview()
      return
    }
    setSelectedId(person.userId)
    const cached = previewCache.current.get(person.userId)
    if (cached) {
      setPreview(cached)
      return
    }
    setPreview({ status: 'loading', userId: person.userId })
    const sequence = ++requestSequence.current
    try {
      const response = await fetch(`/api/people/profile/${person.userId}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
      if (sequence !== requestSequence.current) return
      if (response.status === 404) {
        setPreview({ status: 'unavailable', userId: person.userId })
        return
      }
      if (!response.ok) throw new Error('profile preview unavailable')
      const body = (await response.json()) as { profile: MemberProfile; avatarUrl: string | null }
      const ready = { status: 'ready' as const, userId: person.userId, ...body }
      previewCache.current.set(person.userId, ready)
      setPreview(ready)
    } catch {
      if (sequence === requestSequence.current) {
        setPreview({ status: 'error', userId: person.userId })
      }
    }
  }

  function closePreview() {
    const returnTo = selectedId
    const focusTarget = returnTo
      ? Array.from(
          document.querySelectorAll<HTMLElement>(`[data-preview-person="${returnTo}"]`),
        ).find((target) => target.getClientRects().length > 0)
      : null
    requestSequence.current += 1
    setSelectedId(null)
    setPreview({ status: 'idle' })
    if (focusTarget) {
      window.requestAnimationFrame(() => {
        if (focusTarget.isConnected) focusTarget.focus()
      })
    }
  }

  function changePage(nextPage: number) {
    setPage(Math.min(Math.max(1, nextPage), pageCount))
    document
      .getElementById('people-results')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function navigate(search: PeopleSearchParams) {
    startTransition(() => router.push(peopleSearchHref(search)))
  }

  function openConnection(person: PeopleDirectoryItem) {
    const loadedProfile =
      preview.status === 'ready' && preview.userId === person.userId ? preview.profile : null
    const sharedContext = loadedProfile?.sharedContext.map((context) => context.value) ?? []
    if (
      viewerGraduationYear &&
      person.graduationYear &&
      viewerGraduationYear === person.graduationYear
    ) {
      sharedContext.unshift(`Class of ’${String(person.graduationYear).slice(-2)}`)
    }
    setConnection({
      person,
      clientRequestId: crypto.randomUUID(),
      sharedContext,
      status: 'editing',
    })
  }

  async function sendConnection(note: string) {
    if (!connection || connection.status === 'sending') return
    setConnection({ ...connection, status: 'sending' })
    try {
      const response = await fetch('/api/connections/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientUserId: connection.person.userId,
          originOrganizationId: organizationId,
          introMessage: note,
          clientRequestId: connection.clientRequestId,
        }),
      })
      const body = (await response.json()) as { status?: string; requestId?: string }
      if (
        response.ok &&
        body.requestId &&
        (body.status === 'created' ||
          body.status === 'existing' ||
          body.status === 'incoming_pending')
      ) {
        setRelationships((current) => ({
          ...current,
          [connection.person.userId]: {
            state: body.status === 'incoming_pending' ? 'pending_incoming' : 'pending_outgoing',
            requestId: body.requestId as string,
            conversationId: null,
          },
        }))
        setConnection(null)
        return
      }
      if (body.status === 'already_connected') {
        router.refresh()
        setConnection(null)
        return
      }
      throw new Error('connection request unavailable')
    } catch {
      setConnection((current) => (current ? { ...current, status: 'error' } : null))
    }
  }

  return (
    <div className="min-h-full bg-[var(--surface-canvas)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1180px]">
        <header>
          <p className="text-[13px] font-semibold text-[var(--text-secondary)]">
            Directory ·{' '}
            {initialResult.capped ? `${initialResult.items.length}+` : initialResult.totalCount}{' '}
            {initialResult.totalCount === 1 ? 'member' : 'members'}
          </p>
          <h1 className="mt-1.5 text-[28px] leading-tight font-extrabold tracking-[-0.03em] text-[var(--text-primary)]">
            Find people to connect with.
          </h1>
        </header>

        <PeopleSearchForm
          initialSearch={initialSearch}
          navigating={isNavigating}
          onNavigate={navigate}
        />

        {invalidSearch ? (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-[var(--warning-tint)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)]"
          >
            Those filters could not be used, so we restored the full directory.
          </p>
        ) : null}

        {initialSearch.query ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--blue-50)] px-3.5 py-2 text-xs font-bold text-[var(--blue-600)]">
              ◉ Ranked for “{initialSearch.query}”
            </span>
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              {initialResult.items.length} {initialResult.items.length === 1 ? 'person' : 'people'}{' '}
              · sorted by relevance
            </span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="rounded-full"
              onClick={() => navigate({ ...initialSearch, query: null })}
            >
              Clear search <X aria-hidden className="size-3" />
            </Button>
          </div>
        ) : null}

        <PeopleToolbar
          search={initialSearch}
          resultCount={initialResult.items.length}
          onNavigate={navigate}
        />

        <div className="mt-3.5 flex items-start gap-3.5">
          <section
            id="people-results"
            aria-label="People results"
            className="min-w-0 flex-1 scroll-mt-24"
          >
            {initialResult.items.length === 0 ? (
              <PeopleEmpty
                hasSearch={Boolean(initialSearch.query || activePeopleFilterCount(initialSearch))}
              />
            ) : (
              <>
                <div className="hidden overflow-hidden rounded-[var(--radius-card-xl)] bg-[var(--divider-row)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)] md:grid md:gap-px">
                  {desktopItems.map((person) => (
                    <PeopleRow
                      key={person.userId}
                      person={person}
                      relationship={relationships[person.userId] ?? person.relationship}
                      avatarUrl={
                        person.avatarPath ? initialAvatarUrls[person.avatarPath] : undefined
                      }
                      selected={person.userId === selectedId}
                      searched={Boolean(initialSearch.query)}
                      onSelect={() => selectPerson(person)}
                      onConnect={() => openConnection(person)}
                    />
                  ))}
                  <DesktopPagination
                    page={page}
                    pageCount={pageCount}
                    total={initialResult.items.length}
                    onPage={changePage}
                  />
                </div>

                <div className="grid gap-2 md:hidden">
                  {mobileItems.map((person) => (
                    <PeopleRow
                      key={person.userId}
                      person={person}
                      relationship={relationships[person.userId] ?? person.relationship}
                      avatarUrl={
                        person.avatarPath ? initialAvatarUrls[person.avatarPath] : undefined
                      }
                      selected={person.userId === selectedId}
                      searched={Boolean(initialSearch.query)}
                      onSelect={() => selectPerson(person)}
                      onConnect={() => openConnection(person)}
                      mobile
                    />
                  ))}
                  {mobileVisible < initialResult.items.length ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-1 w-full rounded-xl"
                      onClick={() =>
                        setMobileVisible((count) =>
                          Math.min(count + MOBILE_REVEAL_SIZE, initialResult.items.length),
                        )
                      }
                    >
                      Show more people
                    </Button>
                  ) : null}
                </div>
              </>
            )}
          </section>

          {selectedPerson && widePreview ? (
            <PeoplePreview
              person={selectedPerson}
              relationship={relationships[selectedPerson.userId] ?? selectedPerson.relationship}
              state={preview}
              onClose={closePreview}
              onRetry={() => selectPerson(selectedPerson)}
              onConnect={() => openConnection(selectedPerson)}
            />
          ) : null}
        </div>
      </div>

      <Dialog
        open={Boolean(selectedPerson && !widePreview)}
        onOpenChange={(open) => {
          if (!open) closePreview()
        }}
      >
        {selectedPerson ? (
          <DialogContent
            showCloseButton={false}
            className="top-auto bottom-0 max-h-[92dvh] max-w-none translate-y-0 overflow-y-auto rounded-b-none p-0 sm:top-1/2 sm:bottom-auto sm:max-w-xl sm:-translate-y-1/2 sm:rounded-[var(--radius-card-xl)]"
            onCloseAutoFocus={(event) => {
              event.preventDefault()
            }}
          >
            <DialogTitle className="sr-only">
              Profile preview for {selectedPerson.preferredName || selectedPerson.displayName}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Review this member without leaving the People directory.
            </DialogDescription>
            <PeoplePreview
              person={selectedPerson}
              relationship={relationships[selectedPerson.userId] ?? selectedPerson.relationship}
              state={preview}
              onClose={closePreview}
              onRetry={() => selectPerson(selectedPerson)}
              onConnect={() => openConnection(selectedPerson)}
              sheet
            />
          </DialogContent>
        ) : null}
      </Dialog>

      <ConnectionComposer
        key={connection?.clientRequestId ?? 'closed-connection-composer'}
        open={Boolean(connection)}
        recipient={
          connection
            ? {
                userId: connection.person.userId,
                name: connection.person.preferredName || connection.person.displayName,
              }
            : null
        }
        organizationName={organizationName}
        sharedContext={connection?.sharedContext ?? []}
        status={connection?.status ?? 'editing'}
        onOpenChange={(open) => {
          if (!open) setConnection(null)
        }}
        onSend={sendConnection}
      />
    </div>
  )
}

function PeopleSearchForm({
  initialSearch,
  navigating,
  onNavigate,
}: {
  initialSearch: PeopleSearchParams
  navigating: boolean
  onNavigate: (search: PeopleSearchParams) => void
}) {
  const [query, setQuery] = useState(initialSearch.query ?? '')
  return (
    <form
      className="mt-5 flex items-center gap-3 rounded-[var(--radius-large)] bg-[var(--surface-card)] py-2 pr-2 pl-4.5 shadow-[inset_0_0_0_1px_rgb(49_130_246_/_0.16),0_2px_8px_rgb(25_31_40_/_0.06)]"
      onSubmit={(event) => {
        event.preventDefault()
        onNavigate({ ...initialSearch, query: query.trim() || null })
      }}
    >
      <Search
        aria-hidden
        className="size-[18px] shrink-0 text-[var(--action-primary)]"
        strokeWidth={2.2}
      />
      <input
        aria-label="Search people"
        className="min-w-0 flex-1 border-0 bg-transparent py-2 text-[15px] font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-faint)]"
        maxLength={300}
        placeholder="Try: designers who moved in-house in the Bay Area"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <Button
        type="submit"
        variant="cta"
        disabled={navigating}
        className="h-11 rounded-[11px] px-5"
      >
        {navigating ? (
          <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />
        ) : null}
        Search
      </Button>
    </form>
  )
}

function PeopleToolbar({
  search,
  resultCount,
  onNavigate,
}: {
  search: PeopleSearchParams
  resultCount: number
  onNavigate: (search: PeopleSearchParams) => void
}) {
  const scopes: Array<{ key: PeopleScope; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'open_to_help', label: 'Open to help' },
    { key: 'in_circle', label: 'In your circle' },
  ]
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)
  const moreFilterCount = [
    search.filters.employer,
    search.filters.education,
    search.filters.topic,
  ].filter(Boolean).length
  return (
    <div className="mt-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <fieldset className="flex rounded-xl bg-[#e8eaee] p-[3px]">
          <legend className="sr-only">People scopes</legend>
          {scopes.map((scope) => (
            <button
              key={scope.key}
              type="button"
              aria-pressed={search.scope === scope.key}
              className={cn(
                'min-h-8 rounded-[9px] px-3.5 text-xs font-semibold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                search.scope === scope.key
                  ? 'bg-white font-bold text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--grey-700)] hover:text-[var(--text-primary)]',
              )}
              onClick={() => onNavigate({ ...search, scope: scope.key })}
            >
              {scope.label}
            </button>
          ))}
        </fieldset>
        <TextFilterPopover
          label="Industry"
          value={search.filters.industry}
          onApply={(industry) =>
            onNavigate({ ...search, filters: { ...search.filters, industry } })
          }
        />
        <ClassYearFilterPopover
          start={search.filters.classYearStart}
          end={search.filters.classYearEnd}
          onApply={(classYearStart, classYearEnd) =>
            onNavigate({
              ...search,
              filters: { ...search.filters, classYearStart, classYearEnd },
            })
          }
        />
        <TextFilterPopover
          label="Location"
          value={search.filters.location}
          onApply={(location) =>
            onNavigate({ ...search, filters: { ...search.filters, location } })
          }
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full text-[var(--text-secondary)]"
          aria-expanded={moreFiltersOpen}
          onClick={() => setMoreFiltersOpen((open) => !open)}
        >
          More filters {moreFilterCount > 0 ? `(${moreFilterCount})` : ''}
          <ChevronDown
            aria-hidden
            className={cn('transition-transform', moreFiltersOpen && 'rotate-180')}
          />
        </Button>
        <span className="ml-auto text-xs font-semibold text-[var(--text-secondary)]">
          {resultCount} shown · {search.query ? 'relevance' : 'recently updated'}
        </span>
      </div>
      {moreFiltersOpen ? <MorePeopleFilters search={search} onNavigate={onNavigate} /> : null}
    </div>
  )
}

function TextFilterPopover({
  label,
  value,
  onApply,
}: {
  label: 'Industry' | 'Location'
  value: string | null
  onApply: (value: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const id = `people-quick-${label.toLowerCase()}`
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('rounded-full', value && 'border-[var(--blue-200)] bg-[var(--blue-50)]')}
        >
          {value ? `${label} · ${value}` : label}
          <ChevronDown aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onApply(draft.trim() || null)
            setOpen(false)
          }}
        >
          <label htmlFor={id} className="text-xs font-bold text-[var(--text-secondary)]">
            {label}
          </label>
          <Input
            id={id}
            value={draft}
            maxLength={120}
            className="mt-2"
            autoFocus
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="mt-3 flex justify-end gap-2">
            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraft('')
                  onApply(null)
                  setOpen(false)
                }}
              >
                Clear
              </Button>
            ) : null}
            <Button type="submit" variant="secondary" size="sm">
              Apply
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}

function ClassYearFilterPopover({
  start,
  end,
  onApply,
}: {
  start: number | null
  end: number | null
  onApply: (start: number | null, end: number | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState(start ? String(start) : '')
  const [to, setTo] = useState(end ? String(end) : '')
  const [error, setError] = useState(false)
  const activeLabel = start || end ? `${start ?? 'Any'}–${end ?? 'Any'}` : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'rounded-full',
            activeLabel && 'border-[var(--blue-200)] bg-[var(--blue-50)]',
          )}
        >
          {activeLabel ? `Class year · ${activeLabel}` : 'Class year'}
          <ChevronDown aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const parsedFrom = parseClassYear(from)
            const parsedTo = parseClassYear(to)
            if (
              parsedFrom === undefined ||
              parsedTo === undefined ||
              (parsedFrom !== null && parsedTo !== null && parsedFrom > parsedTo)
            ) {
              setError(true)
              return
            }
            onApply(parsedFrom, parsedTo)
            setError(false)
            setOpen(false)
          }}
        >
          <p className="text-xs font-bold text-[var(--text-secondary)]">Class year</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label
              htmlFor="people-class-year-from"
              className="grid gap-1 text-[11px] font-semibold text-[var(--text-faint)]"
            >
              From
              <Input
                id="people-class-year-from"
                value={from}
                inputMode="numeric"
                maxLength={4}
                placeholder="1990"
                autoFocus
                onChange={(event) => {
                  setFrom(event.target.value)
                  setError(false)
                }}
              />
            </label>
            <label
              htmlFor="people-class-year-to"
              className="grid gap-1 text-[11px] font-semibold text-[var(--text-faint)]"
            >
              To
              <Input
                id="people-class-year-to"
                value={to}
                inputMode="numeric"
                maxLength={4}
                placeholder="2026"
                onChange={(event) => {
                  setTo(event.target.value)
                  setError(false)
                }}
              />
            </label>
          </div>
          {error ? (
            <p role="alert" className="mt-2 text-xs font-semibold text-[var(--state-danger)]">
              Enter valid years in chronological order.
            </p>
          ) : null}
          <div className="mt-3 flex justify-end gap-2">
            {activeLabel ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFrom('')
                  setTo('')
                  onApply(null, null)
                  setOpen(false)
                }}
              >
                Clear
              </Button>
            ) : null}
            <Button type="submit" variant="secondary" size="sm">
              Apply
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}

function MorePeopleFilters({
  search,
  onNavigate,
}: {
  search: PeopleSearchParams
  onNavigate: (search: PeopleSearchParams) => void
}) {
  const [filters, setFilters] = useState({
    employer: search.filters.employer,
    education: search.filters.education,
    topic: search.filters.topic,
  })
  return (
    <form
      className="mt-2.5 grid gap-3 rounded-2xl bg-[var(--surface-card)] p-4 shadow-[var(--ring-card),var(--shadow-card)] sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault()
        onNavigate({ ...search, filters: { ...search.filters, ...filters } })
      }}
    >
      <FilterInput
        label="Employer"
        value={filters.employer}
        onChange={(employer) => setFilters({ ...filters, employer })}
      />
      <FilterInput
        label="Education"
        value={filters.education}
        onChange={(education) => setFilters({ ...filters, education })}
      />
      <FilterInput
        label="Can help with"
        value={filters.topic}
        onChange={(topic) => setFilters({ ...filters, topic })}
      />
      <div className="flex items-end gap-2">
        <Button type="submit" variant="secondary" className="flex-1">
          Apply
        </Button>
        {filters.employer || filters.education || filters.topic ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              onNavigate({
                ...search,
                filters: {
                  ...search.filters,
                  employer: null,
                  education: null,
                  topic: null,
                },
              })
            }
          >
            Clear
          </Button>
        ) : null}
      </div>
    </form>
  )
}

function parseClassYear(value: string): number | null | undefined {
  const normalized = value.trim()
  if (!normalized) return null
  if (!/^\d{4}$/.test(normalized)) return undefined
  const year = Number(normalized)
  return year >= 1900 && year <= 2100 ? year : undefined
}

function FilterInput({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string
  value: string | null
  onChange: (value: string | null) => void
  inputMode?: 'numeric'
}) {
  const id = `people-filter-${label.toLowerCase().replaceAll(' ', '-')}`
  return (
    <div className="grid gap-1.5 text-xs font-bold text-[var(--text-secondary)]">
      <label htmlFor={id}>{label}</label>
      <Input
        id={id}
        value={value ?? ''}
        maxLength={120}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value.trimStart() || null)}
      />
    </div>
  )
}

function PeopleRow({
  person,
  relationship,
  avatarUrl,
  selected,
  searched,
  onSelect,
  onConnect,
  mobile = false,
}: {
  person: PeopleDirectoryItem
  relationship: PeopleRelationship
  avatarUrl?: string
  selected: boolean
  searched: boolean
  onSelect: () => void
  onConnect: () => void
  mobile?: boolean
}) {
  const name = person.preferredName || person.displayName
  const profileLinkId = `people-profile-link-${person.userId}-${mobile ? 'mobile' : 'desktop'}`
  const meta = [
    [person.currentTitle, person.currentEmployer].filter(Boolean).join(' · '),
    person.city,
    person.graduationYear ? `’${String(person.graduationYear).slice(-2)}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <article
      className={cn(
        'relative bg-[image:var(--surface-card-elevated)] transition-colors hover:bg-[var(--row-hover)]',
        mobile && 'rounded-2xl shadow-[var(--ring-card),var(--shadow-card)]',
      )}
    >
      {selected ? (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px] bg-[var(--action-primary)]"
        />
      ) : null}
      <div className="flex items-center gap-3.5 px-4 py-3.5 sm:px-5.5">
        <button
          type="button"
          aria-label={`${selected ? 'Close' : 'Open'} preview for ${name}`}
          aria-expanded={selected}
          data-preview-person={person.userId}
          className="absolute inset-0 z-[1] cursor-pointer rounded-[inherit] outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
          onClick={onSelect}
        />
        <Avatar className="size-[46px]">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="relative min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              id={profileLinkId}
              href={`/profile/${person.userId}`}
              className="relative z-10 rounded text-[15px] font-bold text-[var(--text-primary)] hover:text-[var(--blue-600)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              onClick={() =>
                sessionStorage.setItem('bridgecircle:profile-return-focus', profileLinkId)
              }
            >
              {name}
            </Link>
            {relationship.state === 'connected' ? <Tag tone="blue">In your circle</Tag> : null}
            {person.openToHelp ? <Tag tone="green">Open to help</Tag> : null}
            {relationship.state === 'pending_incoming' ||
            relationship.state === 'pending_outgoing' ? (
              <Tag tone="grey">Requested</Tag>
            ) : null}
            {searched && person.matchEvidence.length > 0 ? (
              <span className="text-[11.5px] font-bold text-[var(--blue-600)]">Strong match</span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-xs font-medium text-[var(--grey-600)]">
            {meta || 'Profile details coming soon'}
          </p>
          {person.helperTopics.length > 0 ? (
            <div className="mt-1.5 hidden flex-wrap gap-1.5 sm:flex">
              {person.helperTopics.slice(0, 3).map((topic) => (
                <span
                  key={topic}
                  className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 text-[11.5px] font-semibold text-[var(--text-secondary)]"
                >
                  {topic}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="relative z-10 hidden shrink-0 sm:block">
          <RelationshipAction relationship={relationship} person={person} onConnect={onConnect} />
        </div>
        <ChevronRight
          aria-hidden
          className={cn(
            'relative size-4 shrink-0 text-[var(--grey-400)] transition-transform',
            selected && 'rotate-90 text-[var(--blue-600)]',
          )}
        />
      </div>
      <div className="relative z-10 px-4 pb-3.5 sm:hidden">
        <RelationshipAction
          relationship={relationship}
          person={person}
          onConnect={onConnect}
          full
        />
      </div>
    </article>
  )
}

function RelationshipAction({
  relationship,
  person,
  onConnect,
  full = false,
}: {
  relationship: PeopleRelationship
  person: PeopleDirectoryItem
  onConnect: () => void
  full?: boolean
}) {
  if (relationship.state === 'connected') {
    return (
      <Button
        asChild
        variant="secondary"
        size="sm"
        className={cn('rounded-full', full && 'w-full text-[var(--blue-800)]')}
      >
        <Link href={`/messages/${relationship.conversationId}`}>
          <MessageCircle aria-hidden /> Message
        </Link>
      </Button>
    )
  }
  if (relationship.state === 'pending_incoming' || relationship.state === 'pending_outgoing') {
    return (
      <Button type="button" size="sm" disabled className={cn('rounded-full', full && 'w-full')}>
        Pending
      </Button>
    )
  }
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className={cn('rounded-full', full && 'w-full text-[var(--blue-800)]')}
      onClick={onConnect}
    >
      <UserPlus aria-hidden /> Connect with {firstName(person.preferredName || person.displayName)}
    </Button>
  )
}

function PeoplePreview({
  person,
  relationship,
  state,
  onClose,
  onRetry,
  onConnect,
  sheet = false,
}: {
  person: PeopleDirectoryItem
  relationship: PeopleRelationship
  state: PreviewState
  onClose: () => void
  onRetry: () => void
  onConnect: () => void
  sheet?: boolean
}) {
  const profile = state.status === 'ready' && state.userId === person.userId ? state.profile : null
  const avatarUrl =
    state.status === 'ready' && state.userId === person.userId ? state.avatarUrl : null
  const name = person.preferredName || person.displayName
  const evidence = person.matchEvidence[0]
  return (
    <aside
      aria-label={`Profile preview for ${name}`}
      className={cn(
        'box-border bg-[var(--surface-card)] p-5.5',
        !sheet &&
          'sticky top-5 w-[340px] shrink-0 rounded-[var(--radius-card-xl)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]',
      )}
    >
      <div className="flex items-center">
        <span className="text-xs font-bold text-[var(--text-secondary)]">Profile preview</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="ml-auto rounded-full"
          aria-label="Close profile preview"
          onClick={onClose}
        >
          <X aria-hidden />
        </Button>
      </div>
      <div className="mt-3 flex items-center gap-3.5">
        <Avatar className="size-14 ring-2 ring-[rgb(49_130_246_/_0.28)] ring-offset-2 ring-offset-white">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback className="text-lg">{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h2 className="truncate text-[19px] font-extrabold tracking-[-0.02em]">{name}</h2>
          <p className="mt-0.5 text-xs font-medium text-[var(--grey-700)]">
            {[person.currentTitle, person.currentEmployer, person.city].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {evidence ? (
        <div className="mt-3.5 rounded-[13px] bg-gradient-to-b from-[#f3f8ff] to-[#eef5ff] p-3.5 shadow-[inset_0_0_0_1px_rgb(49_130_246_/_0.14)]">
          <p className="text-[11px] font-bold text-[var(--blue-600)]">◉ Why this match</p>
          <p className="mt-1.5 text-[13px] leading-relaxed font-medium text-[#33404e]">
            {matchEvidenceCopy(evidence)}
          </p>
          <p className="mt-2 text-[10.5px] font-medium text-[var(--text-secondary)]">
            From profile facts you can see
          </p>
        </div>
      ) : null}

      {state.status === 'loading' ? (
        <div
          role="status"
          className="mt-3 grid gap-2 rounded-[13px] bg-[var(--surface-inset)] p-3.5"
        >
          <div className="h-3 w-1/3 animate-pulse rounded-full bg-[var(--grey-200)] motion-reduce:animate-none" />
          <div className="h-3 w-3/4 animate-pulse rounded-full bg-[var(--grey-200)] motion-reduce:animate-none" />
          <span className="sr-only">Loading profile preview</span>
        </div>
      ) : null}
      {state.status === 'unavailable' || state.status === 'error' ? (
        <div className="mt-3 rounded-[13px] bg-[var(--surface-inset)] p-3.5 text-xs text-[var(--text-secondary)]">
          <p>
            {state.status === 'unavailable'
              ? 'This profile is not available.'
              : 'We could not load this preview.'}
          </p>
          {state.status === 'error' ? (
            <Button type="button" variant="link" size="xs" className="mt-1 px-0" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}
      {profile?.sharedContext.length ? (
        <div className="mt-3 rounded-[13px] bg-[var(--surface-inset)] p-3.5">
          <p className="text-[11px] font-bold text-[var(--text-secondary)]">You share</p>
          {profile.sharedContext.map((context) => (
            <p key={`${context.kind}-${context.value}`} className="mt-2 text-xs font-bold">
              {context.kind === 'same_city' ? 'Both in ' : 'Both attended '}
              {context.value}
            </p>
          ))}
        </div>
      ) : null}
      <div className="mt-3 rounded-[13px] bg-[var(--surface-inset)] p-3.5">
        <p className="text-[11px] font-bold text-[var(--text-secondary)]">Career</p>
        <p className="mt-1.5 text-xs font-bold">
          {[
            profile?.current.title || person.currentTitle,
            profile?.current.employer || person.currentEmployer,
          ]
            .filter(Boolean)
            .join(', ') || 'No current role listed'}
        </p>
        {profile?.experiences[0] ? (
          <p className="mt-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
            {formatPeriod(profile.experiences[0])}
          </p>
        ) : null}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {person.openToHelp ? (
          <Button asChild variant="cta" className="px-2">
            <Link href={directHelpHref(person.membershipId)}>Ask for help</Link>
          </Button>
        ) : null}
        <RelationshipAction
          relationship={relationship}
          person={person}
          onConnect={onConnect}
          full
        />
      </div>
      <Button asChild variant="ghost" size="sm" className="mt-2 w-full text-[var(--blue-800)]">
        <a href={`/profile/${person.userId}`}>
          View full profile <ChevronRight aria-hidden />
        </a>
      </Button>
    </aside>
  )
}

function DesktopPagination({
  page,
  pageCount,
  total,
  onPage,
}: {
  page: number
  pageCount: number
  total: number
  onPage: (page: number) => void
}) {
  if (pageCount <= 1) return null
  const start = (page - 1) * DESKTOP_PAGE_SIZE + 1
  const end = Math.min(page * DESKTOP_PAGE_SIZE, total)
  return (
    <nav
      aria-label="People result pages"
      className="flex items-center gap-1.5 bg-[image:var(--surface-card-elevated)] px-5.5 py-3"
    >
      <span className="text-xs font-semibold text-[var(--text-faint)]">
        {start}–{end} of {total}
      </span>
      <div className="ml-auto flex items-center gap-1.5">
        <PageButton label="Previous page" disabled={page === 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft aria-hidden />
        </PageButton>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
          <PageButton
            key={number}
            label={`Page ${number}`}
            current={number === page}
            onClick={() => onPage(number)}
          >
            {number}
          </PageButton>
        ))}
        <PageButton
          label="Next page"
          disabled={page === pageCount}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight aria-hidden />
        </PageButton>
      </div>
    </nav>
  )
}

function PageButton({
  label,
  current = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string
  current?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={current ? 'page' : undefined}
      disabled={disabled}
      className={cn(
        'flex size-[34px] items-center justify-center rounded-[10px] text-xs font-bold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-40',
        current
          ? 'bg-[var(--action-primary)] text-white'
          : 'bg-white text-[var(--grey-600)] shadow-[var(--ring-outline)] hover:bg-[var(--surface-subtle)]',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function PeopleEmpty({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] px-6 py-12 text-center shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
      <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--text-faint)]">
        <Users aria-hidden className="size-5" />
      </span>
      <h2 className="mt-3 text-sm font-bold">
        {hasSearch ? 'No one matches this search yet' : 'No other members are available yet'}
      </h2>
      <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-[var(--text-secondary)]">
        {hasSearch
          ? 'Try a broader phrase, another scope, or fewer filters.'
          : 'People will appear here as members join your circle.'}
      </p>
      {hasSearch ? (
        <Button asChild variant="link" size="sm" className="mt-2">
          <Link href="/people">Clear search and filters</Link>
        </Button>
      ) : null}
    </div>
  )
}

function Tag({ tone, children }: { tone: 'blue' | 'green' | 'grey'; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold',
        tone === 'blue' && 'bg-[var(--blue-50)] text-[var(--blue-600)]',
        tone === 'green' && 'bg-[var(--give-tint-weak)] text-[var(--action-give-text)]',
        tone === 'grey' && 'bg-[var(--surface-subtle)] text-[var(--grey-600)]',
      )}
    >
      {tone === 'green' ? <i className="size-1.5 rounded-full bg-[var(--green-500)]" /> : null}
      {children}
    </span>
  )
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  )
}

function firstName(name: string): string {
  return name.split(/\s+/).filter(Boolean)[0] || 'them'
}

function formatPeriod(item: { startYear: number | null; endYear: number | null }): string {
  if (!item.startYear && !item.endYear) return ''
  return `${item.startYear ?? 'Earlier'} — ${item.endYear ?? 'now'}`
}
