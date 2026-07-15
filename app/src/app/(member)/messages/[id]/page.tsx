import { notFound } from 'next/navigation'
import { z } from 'zod'
import { createAvatarStorageRepository } from '@/db/repositories/avatar-storage'
import { createConversationRepository } from '@/db/repositories/conversations'
import { createHelpRepository } from '@/db/repositories/help'
import { createClient } from '@/db/server'
import { requireSession } from '@/lib/auth/session'
import { ConversationThread } from './conversation-thread'

type Params = { id: string }

export default async function MessageThreadPage({ params }: { params: Promise<Params> }) {
  const [session, { id }] = await Promise.all([requireSession(), params])
  if (!z.uuid().safeParse(id).success) notFound()

  const client = await createClient()
  const repository = createConversationRepository(client)
  const conversation = await repository.getDetail(id)
  if (!conversation) notFound()

  const [messagesDescending, askDetail] = await Promise.all([
    repository.listBefore({ conversationId: id, beforeMessageId: null, limit: 50 }),
    conversation.askId ? createHelpRepository(client).getAskDetail(conversation.askId) : null,
  ])
  const avatarUrl = conversation.counterpart.avatarPath
    ? createAvatarStorageRepository(client).publicUrl(conversation.counterpart.avatarPath)
    : null

  return (
    <ConversationThread
      conversation={conversation}
      initialMessages={[...messagesDescending].reverse()}
      askDetail={askDetail}
      avatarUrl={avatarUrl}
      viewerUserId={session.userId}
      hasEarlier={messagesDescending.length === 50}
    />
  )
}
