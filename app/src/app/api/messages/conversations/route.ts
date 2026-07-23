import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAvatarStorageRepository } from '@/db/repositories/avatar-storage'
import { createMessagesRepository } from '@/db/repositories/messages'
import { createClient } from '@/db/server'
import { listMessageConversations } from '@/lib/messages/operations'

export const dynamic = 'force-dynamic'
const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' }

const querySchema = z
  .object({
    filter: z.enum(['all', 'unread', 'my_circle', 'open_asks']).default('all'),
    query: z.string().optional(),
    beforePriority: z
      .union([z.literal('1'), z.literal('2'), z.literal('3')])
      .transform(Number)
      .pipe(z.union([z.literal(1), z.literal(2), z.literal(3)]))
      .optional(),
    beforeActivityAt: z.string().datetime({ offset: true }).optional(),
    beforeConversationId: z.uuid().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(30),
  })
  .strict()
  .refine(
    (value) =>
      [value.beforePriority, value.beforeActivityAt, value.beforeConversationId].every(
        (part) => part === undefined,
      ) ||
      [value.beforePriority, value.beforeActivityAt, value.beforeConversationId].every(
        (part) => part !== undefined,
      ),
  )

export async function GET(request: Request) {
  const client = await createClient()
  const { data: auth, error: authError } = await client.auth.getUser()
  if (authError || !auth.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
  }

  const url = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()))
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_query' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  try {
    const cursor =
      parsed.data.beforePriority && parsed.data.beforeActivityAt && parsed.data.beforeConversationId
        ? {
            priority: parsed.data.beforePriority,
            activityAt: parsed.data.beforeActivityAt,
            conversationId: parsed.data.beforeConversationId,
          }
        : null
    const result = await listMessageConversations(
      {
        filter: parsed.data.filter,
        query: parsed.data.query,
        cursor,
        limit: parsed.data.limit,
      },
      createMessagesRepository(client),
    )
    if (result.status === 'invalid_input') {
      return NextResponse.json(
        { error: 'invalid_query' },
        { status: 400, headers: NO_STORE_HEADERS },
      )
    }
    const avatarStorage = createAvatarStorageRepository(client)
    const avatarUrls = Object.fromEntries(
      result.page.items.flatMap((item) =>
        item.counterpart.avatarPath
          ? [[item.counterpart.avatarPath, avatarStorage.publicUrl(item.counterpart.avatarPath)]]
          : [],
      ),
    )
    return NextResponse.json({ ...result.page, avatarUrls }, { headers: NO_STORE_HEADERS })
  } catch {
    Sentry.captureException(new Error('Messages conversation list failed'), {
      tags: { scope: 'messages-conversation-list' },
    })
    return NextResponse.json(
      { error: 'messages_unavailable' },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}
