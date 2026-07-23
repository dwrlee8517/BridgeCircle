import type {
  ListMessageConversationsInput,
  MessageConversationPage,
  MessageConversationSummary,
  MessagesCounts,
  MessagesCursor,
  MessagesFilter,
  MessagesRepository,
  MessagesWaitingItem,
} from './contracts'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const FILTERS = new Set<MessagesFilter>(['all', 'unread', 'my_circle', 'open_asks'])

function isValidTimestamp(value: string): boolean {
  return Number.isFinite(Date.parse(value))
}

function normalizeLimit(value: number | undefined): number | null {
  if (value === undefined) return 30
  if (!Number.isInteger(value) || value < 1 || value > 50) return null
  return value
}

function normalizeQuery(value: string | null | undefined): string | null | undefined {
  if (value === null || value === undefined) return null
  const query = value.trim()
  if (query.length > 100) return undefined
  return query || null
}

function validCursor(cursor: MessagesCursor): boolean {
  return (
    (cursor.priority === 1 || cursor.priority === 2 || cursor.priority === 3) &&
    isValidTimestamp(cursor.activityAt) &&
    UUID_PATTERN.test(cursor.conversationId)
  )
}

export async function listMessageConversations(
  input: ListMessageConversationsInput,
  repository: Pick<MessagesRepository, 'listConversations'>,
): Promise<{ status: 'ok'; page: MessageConversationPage } | { status: 'invalid_input' }> {
  const filter = input.filter ?? 'all'
  const query = normalizeQuery(input.query)
  const limit = normalizeLimit(input.limit)
  const cursor = input.cursor ?? null
  if (
    !FILTERS.has(filter) ||
    query === undefined ||
    limit === null ||
    (cursor && !validCursor(cursor))
  ) {
    return { status: 'invalid_input' }
  }

  const items = await repository.listConversations({ filter, query, cursor, limit })
  const last = items.at(-1)
  return {
    status: 'ok',
    page: {
      items,
      nextCursor:
        items.length === limit && last
          ? {
              priority: last.priority,
              activityAt: last.activityAt,
              conversationId: last.conversationId,
            }
          : null,
    },
  }
}

export async function loadMessagesOverview(
  repository: Pick<MessagesRepository, 'listWaiting' | 'getCounts'>,
): Promise<{ waiting: MessagesWaitingItem[]; counts: MessagesCounts }> {
  const [waiting, counts] = await Promise.all([repository.listWaiting(), repository.getCounts()])
  return { waiting, counts }
}

export async function listMessagesWaiting(
  repository: Pick<MessagesRepository, 'listWaiting'>,
): Promise<MessagesWaitingItem[]> {
  return repository.listWaiting()
}

export async function getMessagesCounts(
  repository: Pick<MessagesRepository, 'getCounts'>,
): Promise<MessagesCounts> {
  return repository.getCounts()
}

function compareSummaries(a: MessageConversationSummary, b: MessageConversationSummary): number {
  if (a.priority !== b.priority) return a.priority - b.priority
  const activity = Date.parse(b.activityAt) - Date.parse(a.activityAt)
  if (activity !== 0) return activity
  return b.conversationId.localeCompare(a.conversationId)
}

export function mergeConversationPages(
  current: MessageConversationSummary[],
  incoming: MessageConversationSummary[],
): MessageConversationSummary[] {
  const byId = new Map(current.map((item) => [item.conversationId, item]))
  for (const item of incoming) byId.set(item.conversationId, item)
  return [...byId.values()].sort(compareSummaries)
}
