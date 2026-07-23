import { createAvatarStorageRepository } from '@/db/repositories/avatar-storage'
import { createMessagesRepository } from '@/db/repositories/messages'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import type {
  MessageConversationPage,
  MessagesCounts,
  MessagesWaitingItem,
} from '@/lib/messages/contracts'
import { listMessageConversations, loadMessagesOverview } from '@/lib/messages/operations'
import { MessagesWorkspace } from './messages-workspace'

const EMPTY_COUNTS: MessagesCounts = {
  all: 0,
  unread: 0,
  myCircle: 0,
  openAsks: 0,
  waiting: 0,
  attention: 0,
}
const EMPTY_PAGE: MessageConversationPage = { items: [], nextCursor: null }

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const [session, client] = await Promise.all([requireSession('/messages'), createClient()])
  const repository = createMessagesRepository(client)
  let initialPage = EMPTY_PAGE
  let initialWaiting: MessagesWaitingItem[] = []
  let initialCounts = EMPTY_COUNTS
  let initialLoadError = false

  try {
    const [listResult, overview] = await Promise.all([
      listMessageConversations({ limit: 30 }, repository),
      loadMessagesOverview(repository),
    ])
    if (listResult.status === 'invalid_input') throw new Error('Messages initial query rejected')
    initialPage = listResult.page
    initialWaiting = overview.waiting
    initialCounts = overview.counts
  } catch {
    initialLoadError = true
  }

  const avatarStorage = createAvatarStorageRepository(client)
  const avatarPaths = [
    ...initialPage.items.map((item) => item.counterpart.avatarPath),
    ...initialWaiting.map((item) => item.counterpart.avatarPath),
  ].filter((path): path is string => Boolean(path))
  const avatarUrls = Object.fromEntries(
    [...new Set(avatarPaths)].map((path) => [path, avatarStorage.publicUrl(path)]),
  )

  return (
    <MessagesWorkspace
      userId={session.userId}
      initialPage={initialPage}
      initialWaiting={initialWaiting}
      initialCounts={initialCounts}
      initialAvatarUrls={avatarUrls}
      initialLoadError={initialLoadError}
    >
      {children}
    </MessagesWorkspace>
  )
}
