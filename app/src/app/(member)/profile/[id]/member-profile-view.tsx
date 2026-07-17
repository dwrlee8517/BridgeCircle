'use client'

import {
  BriefcaseBusiness,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Link2,
  LoaderCircle,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  ShieldAlert,
  UserMinus,
  UserPlus,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useMemberShellHeader } from '@/app/(member)/member-shell-header-context'
import { ConnectionComposer } from '@/app/(member)/people/connection-composer'
import { SafetyReportDialog } from '@/components/safety-report-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { MemberProfile, MemberProfileRelationship } from '@/lib/people/contracts'
import { cn, directHelpHref } from '@/lib/utils'

type ConfirmAction = 'block' | 'disconnect' | null

export function MemberProfileView({
  profile,
  avatarUrl,
  organizationId,
  organizationName,
  presentation,
}: {
  profile: MemberProfile
  avatarUrl: string | null
  organizationId: string
  organizationName: string
  presentation: 'page' | 'overlay'
}) {
  const router = useRouter()
  const [relationship, setRelationship] = useState<MemberProfileRelationship>(profile.relationship)
  const [reportOpen, setReportOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [connectOpen, setConnectOpen] = useState(false)
  const [actionStatus, setActionStatus] = useState<'idle' | 'pending' | 'error'>('idle')
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const [clientRequestId, setClientRequestId] = useState(() => crypto.randomUUID())
  const name = profile.identity.preferredName || profile.identity.displayName
  const shortName = firstName(name)
  useMemberShellHeader(
    presentation === 'page'
      ? {
          title: 'Profile',
          meta: `People › ${name}`,
          backHref: '/people',
          backLabel: 'Back to People',
        }
      : null,
  )

  async function sendConnection(note: string) {
    if (actionStatus === 'pending') return
    setActionStatus('pending')
    try {
      const response = await fetch('/api/connections/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientUserId: profile.userId,
          originOrganizationId: organizationId,
          introMessage: note,
          clientRequestId,
        }),
      })
      const result = (await response.json()) as { status?: string; requestId?: string }
      if (
        response.ok &&
        result.requestId &&
        (result.status === 'created' ||
          result.status === 'existing' ||
          result.status === 'incoming_pending')
      ) {
        setRelationship({
          state: result.status === 'incoming_pending' ? 'pending_incoming' : 'pending_outgoing',
          requestId: result.requestId,
          conversationId: null,
        })
        setActionNotice(`Request sent. ${shortName} will see it in Waiting on you.`)
        setConnectOpen(false)
        setActionStatus('idle')
        return
      }
      if (result.status === 'already_connected') {
        router.refresh()
        setConnectOpen(false)
        return
      }
      throw new Error('connection request unavailable')
    } catch {
      setActionStatus('error')
    }
  }

  async function confirmSafetyAction() {
    if (!confirmAction || actionStatus === 'pending') return
    setActionStatus('pending')
    const endpoint =
      confirmAction === 'block'
        ? `/api/members/${profile.userId}/block`
        : `/api/connections/${profile.userId}/disconnect`
    try {
      const response = await fetch(endpoint, { method: 'POST', cache: 'no-store' })
      if (!response.ok) throw new Error('safety action unavailable')
      if (confirmAction === 'block') {
        router.replace('/people')
        router.refresh()
        return
      }
      setRelationship({ state: 'none', requestId: null, conversationId: null })
      setActionNotice(
        `You and ${name} are no longer connected. Your messages are still in Messages.`,
      )
      setConfirmAction(null)
      setActionStatus('idle')
    } catch {
      setActionStatus('error')
    }
  }

  return (
    <div
      className={cn(
        'min-h-full bg-[var(--surface-canvas)]',
        presentation === 'page' ? 'px-4 py-5 sm:px-6 lg:px-8 lg:py-7' : 'p-3 sm:p-4',
      )}
    >
      <div className={cn('mx-auto max-w-[1180px]', presentation === 'overlay' && 'max-w-none')}>
        <article className="overflow-hidden rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]">
          <header
            className={cn(
              'flex flex-col gap-5 px-5 py-6 sm:px-7',
              presentation === 'page'
                ? 'lg:flex-row lg:items-start lg:px-8.5 lg:py-7.5'
                : 'lg:items-stretch lg:px-7 lg:py-6',
            )}
          >
            <Avatar className="size-20 ring-2 ring-[rgb(49_130_246_/_0.28)] ring-offset-2 ring-offset-white sm:size-[84px]">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-2xl">{initials(name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-display-large leading-tight font-extrabold tracking-display">
                  {name}
                </h1>
                {relationship.state === 'connected' ? (
                  <ProfileTag tone="blue">In your circle</ProfileTag>
                ) : null}
                {profile.help.openToHelp ? (
                  <ProfileTag tone="green">Open to help</ProfileTag>
                ) : null}
                {relationship.state === 'pending_incoming' ||
                relationship.state === 'pending_outgoing' ? (
                  <ProfileTag tone="grey">Requested</ProfileTag>
                ) : null}
              </div>
              <p className="mt-1.5 text-sm font-medium text-[var(--grey-600)]">
                {[
                  profile.current.title,
                  profile.current.employer,
                  profile.current.city,
                  profile.identity.graduationYear
                    ? `Class of ’${String(profile.identity.graduationYear).slice(-2)}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Profile details coming soon'}
              </p>
              {profile.help.topics.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profile.help.topics.slice(0, 5).map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 text-chip font-semibold text-[var(--text-secondary)]"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div
              className={cn('flex flex-wrap gap-2', presentation === 'page' && 'lg:justify-end')}
            >
              {profile.help.openToHelp ? (
                <Button asChild variant="cta">
                  <Link href={directHelpHref(profile.membershipId)}>Ask for help</Link>
                </Button>
              ) : null}
              <ProfileRelationshipAction
                relationship={relationship}
                onConnect={() => {
                  setClientRequestId(crypto.randomUUID())
                  setActionStatus('idle')
                  setConnectOpen(true)
                }}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="More profile actions">
                    <MoreHorizontal aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {relationship.state === 'connected' ? (
                    <>
                      <DropdownMenuItem onSelect={() => setConfirmAction('disconnect')}>
                        <UserMinus aria-hidden /> Disconnect
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  ) : null}
                  <DropdownMenuItem onSelect={() => setReportOpen(true)}>
                    <ShieldAlert aria-hidden /> Report {shortName}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setConfirmAction('block')}
                  >
                    <ShieldAlert aria-hidden /> Block {shortName}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {actionNotice ? (
            <div
              role="status"
              className="mx-5 mb-5 flex items-center gap-3 rounded-xl bg-[var(--blue-50)] px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] sm:mx-7 lg:mx-8.5"
            >
              <span className="min-w-0 flex-1">{actionNotice}</span>
              <button
                type="button"
                className="shrink-0 rounded-md px-2 py-1 text-[var(--blue-600)] hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                onClick={() => setActionNotice(null)}
              >
                Dismiss
              </button>
            </div>
          ) : null}

          <div className="mx-5 h-px bg-[var(--divider-row)] sm:mx-7 lg:mx-8.5" />
          {presentation === 'overlay' ? (
            <div className="space-y-6 px-5 py-6 sm:px-7">
              <ProfileSection title="About">
                <p className="text-sm leading-[1.7] font-medium text-[var(--text-secondary)]">
                  {profile.about || 'No about details have been shared yet.'}
                </p>
              </ProfileSection>

              {profile.help.topics.length ? (
                <ProfileSection title="Can help with" divided>
                  <div className="grid gap-2">
                    {profile.help.topics.slice(0, 4).map((topic) => (
                      <Link
                        key={topic}
                        href={`${directHelpHref(profile.membershipId)}?topic=${encodeURIComponent(topic)}`}
                        className="flex min-h-11 items-center justify-between rounded-xl bg-[var(--surface-inset)] px-3.5 text-body-sm font-bold outline-none hover:bg-[var(--row-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                      >
                        <span>{topic}</span>
                        <span className="text-xs text-[var(--blue-800)]">Ask</span>
                      </Link>
                    ))}
                  </div>
                </ProfileSection>
              ) : null}

              {profile.sharedContext.length ? (
                <ProfileSection title="You share" divided>
                  <div className="grid gap-2">
                    {profile.sharedContext.map((context) => (
                      <div
                        key={`${context.kind}-${context.value}`}
                        className="flex items-start gap-2.5 rounded-xl bg-[var(--surface-inset)] p-3.5"
                      >
                        <MapPin
                          aria-hidden
                          className="mt-0.5 size-4 shrink-0 text-[var(--blue-600)]"
                        />
                        <div>
                          <p className="text-xs font-bold">{context.value}</p>
                          <p className="mt-0.5 text-overline font-medium text-[var(--text-faint)]">
                            {context.kind === 'same_city'
                              ? 'You both list this location'
                              : 'You both list this school'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ProfileSection>
              ) : null}

              <div className="border-t border-[var(--divider-row)] pt-5">
                <Button asChild variant="secondary" className="w-full">
                  <a href={`/profile/${profile.userId}`}>
                    Open full profile <ChevronRight aria-hidden />
                  </a>
                </Button>
                <p className="mt-3 text-center text-fine font-medium text-[var(--text-faint)]">
                  Updated {formatUpdated(profile.updatedAt)}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8.5 lg:py-7">
              <div className="min-w-0 space-y-7">
                <ProfileSection title="About">
                  <p className="max-w-[64ch] text-sm leading-[1.7] font-medium text-[var(--text-secondary)]">
                    {profile.about || 'No about details have been shared yet.'}
                  </p>
                </ProfileSection>

                <ProfileSection title="Career" divided>
                  {profile.experiences.length ? (
                    <ProfileTimeline
                      items={profile.experiences.map((experience) => ({
                        id: experience.id,
                        period: period(experience),
                        title: `${experience.title} · ${experience.employer}`,
                        description: experience.description,
                      }))}
                    />
                  ) : (
                    <QuietEmpty icon={BriefcaseBusiness}>No career history is visible.</QuietEmpty>
                  )}
                </ProfileSection>

                <ProfileSection title="Education" divided>
                  {profile.education.length ? (
                    <ProfileTimeline
                      items={profile.education.map((education) => ({
                        id: education.id,
                        period: period(education),
                        title: [education.school, education.degree, education.field]
                          .filter(Boolean)
                          .join(' · '),
                        description: education.description,
                      }))}
                    />
                  ) : (
                    <QuietEmpty icon={GraduationCap}>No education history is visible.</QuietEmpty>
                  )}
                </ProfileSection>

                {profile.help.openToHelp ? (
                  <ProfileSection title="Can help with" divided>
                    {profile.help.topics.length ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {profile.help.topics.map((topic) => (
                          <Link
                            key={topic}
                            href={`${directHelpHref(profile.membershipId)}?topic=${encodeURIComponent(topic)}`}
                            className="flex min-h-11 items-start gap-2.5 rounded-xl p-2 text-control font-bold hover:bg-[var(--row-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                          >
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--action-primary)]" />
                            {topic}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <QuietEmpty icon={UserPlus}>No helping topics are listed.</QuietEmpty>
                    )}
                  </ProfileSection>
                ) : null}

                {profile.skills.length ? (
                  <ProfileSection title="Skills" divided>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-[var(--surface-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </ProfileSection>
                ) : null}
              </div>

              <aside
                className={cn(
                  'space-y-3 border-t border-[var(--divider-row)] pt-6',
                  presentation === 'page' && 'lg:border-t-0 lg:border-l lg:pt-0 lg:pl-7',
                )}
              >
                {profile.sharedContext.length ? (
                  <RailCard title="You share">
                    {profile.sharedContext.map((context) => (
                      <div key={`${context.kind}-${context.value}`} className="mt-3 flex gap-2.5">
                        <MapPin
                          aria-hidden
                          className="mt-0.5 size-4 shrink-0 text-[var(--blue-600)]"
                        />
                        <div>
                          <p className="text-xs font-bold">{context.value}</p>
                          <p className="mt-0.5 text-overline font-medium text-[var(--text-faint)]">
                            {context.kind === 'same_city'
                              ? 'You both list this location'
                              : 'You both list this school'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </RailCard>
                ) : null}
                {profile.links.length ? (
                  <RailCard title="Links & contact">
                    {profile.links.map((link) => (
                      <a
                        key={link.id}
                        href={link.kind === 'email' ? `mailto:${link.value}` : link.value}
                        target={link.kind === 'email' ? undefined : '_blank'}
                        rel={link.kind === 'email' ? undefined : 'noreferrer'}
                        className="mt-2.5 flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs font-bold text-[var(--blue-600)] hover:bg-[var(--blue-50)]"
                      >
                        <Link2 aria-hidden className="size-3.5" />
                        {link.label || linkLabel(link.kind)}
                        {link.kind !== 'email' ? (
                          <ExternalLink aria-hidden className="ml-auto size-3" />
                        ) : null}
                      </a>
                    ))}
                  </RailCard>
                ) : null}
                <RailCard title="Profile">
                  <p className="mt-2 text-overline leading-relaxed font-medium text-[var(--text-faint)]">
                    Updated {formatUpdated(profile.updatedAt)}
                  </p>
                </RailCard>
              </aside>
            </div>
          )}
        </article>
      </div>

      <SafetyReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        endpoint={`/api/members/${profile.userId}/report`}
        subject="profile"
      />

      <Dialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null)
            setActionStatus('idle')
          }
        }}
      >
        {confirmAction ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {confirmAction === 'block' ? `Block ${name}?` : `Disconnect from ${name}?`}
              </DialogTitle>
              <DialogDescription>
                {confirmAction === 'block'
                  ? `You won’t see each other’s asks or messages, and neither of you can reach the other. You can undo this in Settings.`
                  : `You’ll both leave each other’s circle. Your messages stay, and neither of you is notified.`}
              </DialogDescription>
            </DialogHeader>
            {actionStatus === 'error' ? (
              <p role="alert" className="text-xs font-semibold text-[var(--state-danger)]">
                That did not go through. Please try again.
              </p>
            ) : null}
            <DialogFooter>
              <Button autoFocus variant="outline" onClick={() => setConfirmAction(null)}>
                Cancel
              </Button>
              <Button
                variant={confirmAction === 'block' ? 'destructive' : 'outline'}
                className={
                  confirmAction === 'disconnect'
                    ? 'border-[var(--red-200)] text-[var(--state-danger)]'
                    : undefined
                }
                aria-busy={actionStatus === 'pending'}
                onClick={confirmSafetyAction}
              >
                {actionStatus === 'pending' ? (
                  <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />
                ) : null}
                {confirmAction === 'block' ? 'Block' : 'Disconnect'}
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>

      <ConnectionComposer
        key={connectOpen ? clientRequestId : 'closed-profile-connection-composer'}
        open={connectOpen}
        recipient={{ userId: profile.userId, name }}
        organizationName={organizationName}
        sharedContext={profile.sharedContext.map((context) => context.value)}
        status={
          actionStatus === 'pending' ? 'sending' : actionStatus === 'error' ? 'error' : 'editing'
        }
        onOpenChange={(open) => {
          setConnectOpen(open)
          if (!open) setActionStatus('idle')
        }}
        onSend={sendConnection}
      />
    </div>
  )
}

function ProfileRelationshipAction({
  relationship,
  onConnect,
}: {
  relationship: MemberProfileRelationship
  onConnect: () => void
}) {
  if (relationship.state === 'connected')
    return (
      <Button asChild variant="secondary">
        <Link href={`/messages/${relationship.conversationId}`}>
          <MessageCircle aria-hidden /> Message
        </Link>
      </Button>
    )
  if (relationship.state === 'pending_incoming' || relationship.state === 'pending_outgoing')
    return <Button disabled>Pending</Button>
  return (
    <Button variant="secondary" onClick={onConnect}>
      <UserPlus aria-hidden /> Connect
    </Button>
  )
}

function ProfileSection({
  title,
  divided = false,
  children,
}: {
  title: string
  divided?: boolean
  children: React.ReactNode
}) {
  return (
    <section className={cn(divided && 'border-t border-[var(--divider-row)] pt-7')}>
      <h2 className="text-nav font-extrabold tracking-title">{title}</h2>
      <div className="mt-3.5">{children}</div>
    </section>
  )
}

function ProfileTimeline({
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
              <p className="mt-2 text-body-sm leading-relaxed font-medium text-[var(--text-secondary)]">
                {item.description}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}

function RailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[13px] bg-[var(--surface-inset)] p-3.5">
      <h2 className="text-overline font-bold text-[var(--text-faint)]">{title}</h2>
      {children}
    </section>
  )
}

function QuietEmpty({
  icon: Icon,
  children,
}: {
  icon: typeof BriefcaseBusiness
  children: React.ReactNode
}) {
  return (
    <p className="flex items-center gap-2 text-xs font-medium text-[var(--text-faint)]">
      <Icon aria-hidden className="size-4" />
      {children}
    </p>
  )
}

function ProfileTag({
  tone,
  children,
}: {
  tone: 'blue' | 'green' | 'grey'
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-chip font-bold',
        tone === 'blue' && 'bg-[var(--blue-50)] text-[var(--blue-600)]',
        tone === 'green' && 'bg-[var(--give-tint-weak)] text-[var(--action-give-text)]',
        tone === 'grey' && 'bg-[var(--surface-subtle)] text-[var(--text-secondary)]',
      )}
    >
      {tone === 'green' ? <i className="size-1.5 rounded-full bg-[var(--green-500)]" /> : null}
      {children}
    </span>
  )
}

function period(item: { startYear: number | null; endYear: number | null }): string {
  if (!item.startYear && !item.endYear) return 'Dates not listed'
  return `${item.startYear ?? 'Earlier'} — ${item.endYear ?? 'now'}`
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
function formatUpdated(value: string): string {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(value))
}
function linkLabel(kind: MemberProfile['links'][number]['kind']): string {
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
            : 'Link'
}
