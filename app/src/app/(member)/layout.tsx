import { redirect } from 'next/navigation'
import { loadMemberContext } from '@/app/_lib/load-member-context'
import { clearMembershipPreference } from '@/app/_lib/membership-cookie'
import { createNotificationRepository } from '@/db/repositories/notifications'
import { requireSession } from '@/lib/auth/session'
import { memberDestination, selectedMembership } from '@/lib/membership/selection'
import { listNotifications } from '@/lib/notifications/listNotifications'
import { MemberHeader } from './member-header'
import { MemberShellHeaderProvider } from './member-shell-header-context'
import { MemberSidebar } from './member-sidebar'
import { MemberTabBar } from './member-tab-bar'
import { UserControlProvider } from './user-control-provider'

export default async function MemberLayout({
  children,
  profileModal,
}: {
  children: React.ReactNode
  profileModal: React.ReactNode
}) {
  const session = await requireSession()
  const { client, context } = await loadMemberContext()

  switch (memberDestination(context)) {
    case 'cancel-delete':
      return redirect('/cancel-delete')
    case 'select-circle':
      return redirect('/select-circle')
    case 'onboarding':
      return redirect('/onboarding')
    case 'pending-approval':
      return redirect('/pending')
    case 'reject-session':
      await client.auth.signOut()
      await clearMembershipPreference()
      return redirect(
        `/sign-in?error=${encodeURIComponent(
          "We couldn't find an available circle for this account. Ask your circle admin for help.",
        )}`,
      )
  }

  const membership = selectedMembership(context)
  if (!membership || membership.status !== 'active') redirect('/pending')

  const notifications = await listNotifications(createNotificationRepository(client), { limit: 15 })
  const avatarUrl = membership.profile.avatarPath
    ? client.storage.from('avatars').getPublicUrl(membership.profile.avatarPath).data.publicUrl
    : null
  const name = membership.profile.preferredName ?? membership.profile.displayName
  const isAdmin = membership.roles.some((role) => role === 'super_admin' || role === 'admin')

  return (
    <div className="min-h-dvh bg-[var(--surface-canvas)]">
      <a
        href="#main-content"
        className="fixed top-2 left-2 z-[60] -translate-y-20 rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <UserControlProvider
        userId={session.userId}
        initialMessagesAttentionCount={context.messagesAttentionCount}
      >
        <div className="flex min-h-dvh w-full">
          <MemberSidebar
            name={name}
            avatarUrl={avatarUrl}
            graduationYear={membership.profile.graduationYear}
            isAdmin={isAdmin}
          />
          <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden md:h-auto md:min-h-dvh md:overflow-visible">
            <MemberShellHeaderProvider>
              <MemberHeader
                userId={session.userId}
                name={name}
                avatarUrl={avatarUrl}
                graduationYear={membership.profile.graduationYear}
                isAdmin={isAdmin}
                notifications={notifications}
                unreadCount={context.unreadNotificationCount}
              />
              <main
                id="main-content"
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(60px+env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch] md:overflow-visible md:pb-0"
              >
                {children}
              </main>
              {profileModal}
            </MemberShellHeaderProvider>
            <MemberTabBar />
          </div>
        </div>
      </UserControlProvider>
    </div>
  )
}
