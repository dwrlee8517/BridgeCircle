import { RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { signOut } from '@/app/(auth)/sign-in/actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { FormSubmitButton } from '@/components/ui/form-submit-button'
import { createHelpRepository } from '@/db/repositories/help'
import { createSettingsRepository } from '@/db/repositories/settings'
import { selectedMembership } from '@/lib/membership/selection'
import { NOTIFICATION_GROUPS } from '@/lib/settings/notification-groups'
import { cn, getInitials } from '@/lib/utils'
import {
  changeEmailAction,
  downloadExportAction,
  requestExportAction,
  saveCommunicationAction,
  saveNotificationGroupAction,
  unblockMemberAction,
} from './actions'
import { DeletionConfirmation } from './deletion-confirmation'
import { HelpPreferencesForm } from './help-preferences-form'
import {
  exportStatusDescription,
  exportStatusTitle,
  settingsSavedMessage,
} from './settings-messages'

type SearchParams = { saved?: string; error?: string }

const CARD_CLASS =
  'overflow-hidden rounded-[var(--radius-card-xl)] bg-[image:var(--surface-card-elevated)] shadow-[var(--ring-card-elevated),var(--shadow-card-elevated)]'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const [{ client, context }, params] = await Promise.all([loadMemberContext(), searchParams])
  const membership = selectedMembership(context)
  const settingsRepository = createSettingsRepository(client)
  const helpRepository = createHelpRepository(client)

  const [authUser, preferences, communication, blocked, accountExport, helpPreferences] =
    await Promise.all([
      client.auth.getUser(),
      settingsRepository.listNotificationPreferences(),
      settingsRepository.getCommunicationPreferences(),
      settingsRepository.listBlockedMembers(),
      settingsRepository.getExport(),
      membership
        ? helpRepository.getHelperPreferences(membership.membershipId)
        : Promise.resolve(null),
    ])

  const currentEmail = authUser.data.user?.email ?? 'Email unavailable'
  const pendingEmail = authUser.data.user?.new_email ?? null
  const savedMessage = settingsSavedMessage(params.saved, currentEmail, pendingEmail)

  return (
    <div className="min-h-full bg-[var(--wash-page)]">
      <div className="mx-auto grid w-full max-w-[720px] gap-3.5 px-4 py-6 sm:px-6 sm:py-7">
        <header className="mb-1">
          <h1 className="text-display-section font-extrabold tracking-tight text-[var(--text-primary)]">
            Settings
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed font-medium text-[var(--grey-600)]">
            One quiet place for your account, helping, notifications, and safety.
          </p>
        </header>

        {savedMessage ? (
          <FormMessage tone="success" className="rounded-xl bg-success-tint px-4 py-3">
            {savedMessage}
          </FormMessage>
        ) : null}
        {params.error ? (
          <FormMessage tone="error" className="rounded-xl bg-danger-tint px-4 py-3">
            {settingsErrorMessage(params.error)}
          </FormMessage>
        ) : null}

        <section aria-labelledby="account-settings" className={CARD_CLASS}>
          <SectionHeading id="account-settings">Account</SectionHeading>

          <details className="group border-t border-[var(--divider-row)]">
            <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3 marker:hidden sm:px-5 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 flex-1">
                <span className="block text-label font-bold text-[var(--text-primary)]">Email</span>
                <span className="mt-0.5 block truncate text-xs font-medium text-[var(--text-faint)]">
                  {pendingEmail ? `${pendingEmail} is awaiting confirmation` : currentEmail}
                </span>
              </span>
              <span className="rounded-full bg-card px-3 py-2 text-xs font-bold text-[var(--text-secondary)] shadow-[var(--ring-outline)] group-open:bg-[var(--surface-subtle)]">
                {pendingEmail ? 'Review' : 'Change'}
              </span>
            </summary>
            <form
              action={changeEmailAction}
              className="flex flex-col gap-2 border-t border-[var(--divider-row)] bg-[var(--surface-inset)] px-4 py-3 sm:flex-row sm:items-end sm:px-5"
            >
              <label className="min-w-0 flex-1 text-xs font-bold text-[var(--text-secondary)]">
                New sign-in email
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={pendingEmail ?? currentEmail}
                  className="mt-1.5 min-h-10 w-full rounded-[var(--radius-box)] border border-[var(--input)] bg-card px-3.5 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)] focus:ring-2 focus:ring-[var(--focus-ring-soft)]"
                />
              </label>
              <FormSubmitButton size="sm" variant="outline" pendingLabel="Sending…">
                Send confirmation
              </FormSubmitButton>
            </form>
            {pendingEmail ? (
              <p className="border-t border-[var(--divider-row)] bg-[var(--surface-inset)] px-4 pb-3 text-xs leading-relaxed font-medium text-[var(--text-faint)] sm:px-5">
                Confirm {pendingEmail} from your inbox. Until then, keep signing in with{' '}
                {currentEmail}.
              </p>
            ) : null}
          </details>

          <SettingsRow
            title="Export your data"
            description={
              accountExport
                ? `${exportStatusTitle(accountExport.status)} — ${exportStatusDescription(accountExport.status)}`
                : 'Request a private archive of your profile, Asks, and messages.'
            }
            control={<ExportControl status={accountExport?.status ?? null} />}
          />

          <SettingsRow
            title="Sign out"
            description="End this session on this device."
            control={
              <form action={signOut}>
                <FormSubmitButton size="sm" variant="outline" pendingLabel="Signing out…">
                  Sign out
                </FormSubmitButton>
              </form>
            }
          />

          <SettingsRow
            title="Delete account"
            titleClassName="text-[var(--state-danger-text)]"
            description="Schedule account deletion with a seven-day window to restore access."
            control={<DeletionConfirmation />}
          />
        </section>

        <section aria-labelledby="notification-settings" className={CARD_CLASS}>
          <div className="flex items-end gap-2 px-4 pt-4 pb-2.5 sm:px-5">
            <h2
              id="notification-settings"
              className="min-w-0 flex-1 text-body-sm font-extrabold tracking-tight text-[var(--text-primary)]"
            >
              Notifications &amp; email
            </h2>
            <span className="hidden w-12 text-center text-overline font-extrabold tracking-label text-[var(--text-faint)] uppercase sm:block">
              Bell
            </span>
            <span className="hidden w-12 text-center text-overline font-extrabold tracking-label text-[var(--text-faint)] uppercase sm:block">
              Email
            </span>
            <span aria-hidden className="hidden w-14 sm:block" />
          </div>

          {NOTIFICATION_GROUPS.map((group) => {
            const rows = group.types.map((type) => preferences.find((item) => item.type === type))
            const inApp = rows.every((row) => row?.inAppEnabled ?? true)
            const email = rows.every((row) => row?.emailEnabled ?? true)
            return (
              <form
                key={group.id}
                action={saveNotificationGroupAction}
                className="flex flex-col gap-3 border-t border-[var(--divider-row)] px-4 py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_48px_48px_56px] sm:items-center sm:gap-2 sm:px-5"
              >
                <input type="hidden" name="group" value={group.id} />
                <span className="min-w-0">
                  <span className="block text-label font-bold text-[var(--text-primary)]">
                    {group.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed font-medium text-[var(--text-faint)]">
                    {group.description}
                  </span>
                </span>
                <div className="flex items-center gap-5 sm:contents">
                  <PreferenceSwitch
                    name="inApp"
                    label={`${group.label} in the bell`}
                    mobileLabel="Bell"
                    defaultChecked={inApp}
                  />
                  <PreferenceSwitch
                    name="email"
                    label={`${group.label} by email`}
                    mobileLabel="Email"
                    defaultChecked={email}
                  />
                  <FormSubmitButton size="xs" variant="outline" pendingLabel="Saving…">
                    Save
                  </FormSubmitButton>
                </div>
              </form>
            )
          })}

          <form
            action={saveCommunicationAction}
            className="flex flex-col gap-3 border-t border-[var(--divider-row)] px-4 py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_48px_48px_56px] sm:items-center sm:gap-2 sm:px-5"
          >
            <span className="min-w-0">
              <span className="block text-label font-bold text-[var(--text-primary)]">
                School newsletter
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed font-medium text-[var(--text-faint)]">
                Receive each issue by email. The archive stays on School either way.
              </span>
            </span>
            <span aria-hidden className="hidden sm:block" />
            <div className="flex items-center gap-5 sm:contents">
              <PreferenceSwitch
                name="newsletter"
                label="School newsletter by email"
                mobileLabel="Email"
                defaultChecked={communication.schoolNewsletterEmailEnabled}
              />
              <FormSubmitButton size="xs" variant="outline" pendingLabel="Saving…">
                Save
              </FormSubmitButton>
            </div>
          </form>

          <p className="border-t border-[var(--divider-row)] px-4 py-3 text-xs leading-relaxed font-medium text-[var(--text-faint)] sm:px-5">
            These are transactional updates from your circle. BridgeCircle does not send a weekly
            activity digest or promotional email.
          </p>
        </section>

        <section id="helping" aria-labelledby="helping-settings" className={CARD_CLASS}>
          <SectionHeading id="helping-settings">Helping</SectionHeading>
          {helpPreferences ? (
            <HelpPreferencesForm
              key={`${helpPreferences.openToHelp}:${helpPreferences.pausedAt}:${helpPreferences.topics.join('|')}`}
              defaults={{
                openToHelp: helpPreferences.openToHelp,
                topics: helpPreferences.topics,
              }}
              paused={helpPreferences.pausedAt ? { reason: helpPreferences.pauseReason } : null}
            />
          ) : (
            <p className="border-t border-[var(--divider-row)] px-4 py-4 text-xs font-medium text-[var(--text-faint)] sm:px-5">
              Helping preferences are unavailable until you have an active circle membership.
            </p>
          )}
          <p className="border-t border-[var(--divider-row)] px-4 py-3 text-xs font-medium text-[var(--text-faint)] sm:px-5">
            Help · Give shows this same availability as a compact summary.
          </p>
        </section>

        <section aria-labelledby="blocked-settings" className={CARD_CLASS}>
          <SectionHeading id="blocked-settings">Blocked members</SectionHeading>
          {blocked.length === 0 ? (
            <p className="border-t border-[var(--divider-row)] px-4 py-4 text-xs font-medium text-[var(--text-faint)] sm:px-5">
              No one is blocked. If you block someone, you can restore contact here.
            </p>
          ) : (
            <ul>
              {blocked.map((person) => {
                const avatarUrl = person.avatarPath
                  ? client.storage.from('avatars').getPublicUrl(person.avatarPath).data.publicUrl
                  : null
                return (
                  <li
                    key={person.userId}
                    className="flex items-center gap-3 border-t border-[var(--divider-row)] px-4 py-3 sm:px-5"
                  >
                    <Avatar className="size-9">
                      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                      <AvatarFallback className="bg-[image:var(--gradient-avatar)] text-xs font-bold text-white">
                        {getInitials(person.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-label font-bold text-[var(--text-primary)]">
                        {person.displayName}
                      </span>
                      <span className="mt-0.5 block text-xs font-medium text-[var(--text-faint)]">
                        They cannot see your profile or contact you. They were not notified.
                      </span>
                    </span>
                    <form action={unblockMemberAction}>
                      <input type="hidden" name="userId" value={person.userId} />
                      <FormSubmitButton size="xs" variant="outline" pendingLabel="Restoring…">
                        Unblock
                      </FormSubmitButton>
                    </form>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="px-4 pt-4 pb-2.5 text-body-sm font-extrabold tracking-tight text-[var(--text-primary)] sm:px-5"
    >
      {children}
    </h2>
  )
}

function SettingsRow({
  title,
  description,
  control,
  titleClassName,
}: {
  title: string
  description: string
  control: React.ReactNode
  titleClassName?: string
}) {
  return (
    <div className="flex min-h-16 flex-col gap-3 border-t border-[var(--divider-row)] px-4 py-3 sm:flex-row sm:items-center sm:px-5">
      <span className="min-w-0 flex-1">
        <span
          className={cn('block text-label font-bold text-[var(--text-primary)]', titleClassName)}
        >
          {title}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed font-medium text-[var(--text-faint)]">
          {description}
        </span>
      </span>
      <span className="shrink-0 self-start sm:self-auto">{control}</span>
    </div>
  )
}

function PreferenceSwitch({
  name,
  label,
  mobileLabel,
  defaultChecked,
}: {
  name: string
  label: string
  mobileLabel: string
  defaultChecked: boolean
}) {
  return (
    <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 sm:justify-center">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        aria-label={label}
        className="peer sr-only"
      />
      <span className="relative h-5 w-[34px] rounded-full bg-[var(--icon-muted)] transition-colors after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-[var(--action-primary)] peer-checked:after:translate-x-3.5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:after:transition-none" />
      <span className="text-xs font-bold text-[var(--text-secondary)] sm:sr-only">
        {mobileLabel}
      </span>
    </label>
  )
}

function ExportControl({
  status,
}: {
  status: 'queued' | 'processing' | 'ready' | 'failed' | 'expired' | null
}) {
  if (status === 'ready') {
    return (
      <form action={downloadExportAction}>
        <FormSubmitButton size="sm" variant="outline" pendingLabel="Preparing…">
          Download
        </FormSubmitButton>
      </form>
    )
  }
  if (status === 'queued' || status === 'processing') {
    return (
      <Button asChild size="sm" variant="outline">
        <Link href="/settings">
          <RefreshCw aria-hidden />
          Refresh
        </Link>
      </Button>
    )
  }
  return (
    <form action={requestExportAction}>
      <FormSubmitButton size="sm" variant="outline" pendingLabel="Requesting…">
        Request export
      </FormSubmitButton>
    </form>
  )
}

function settingsErrorMessage(error: string) {
  switch (error) {
    case 'invalid_email':
      return 'Enter a valid email address and try again.'
    case 'email_change':
      return 'We could not start that email change. Your current sign-in email is unchanged.'
    case 'export_unavailable':
      return 'That export is not ready to download. Refresh its status or request a new archive.'
    case 'export_request':
      return 'We could not start an export. No account data was changed.'
    case 'notifications':
      return 'Those notification preferences could not all be saved. Refresh to see the current choices.'
    case 'communication':
      return 'That newsletter preference could not be saved. Refresh to see the current choice.'
    case 'deletion':
      return 'Account deletion could not be scheduled. Your account is still active.'
    case 'invalid_member':
      return 'That blocked member could not be found. Nothing changed.'
    default:
      return 'That change could not be saved. Nothing else was changed.'
  }
}
