import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const conversationId = process.env.CONVERSATION_TEST_ID
const richardId = process.env.CONVERSATION_TEST_RICHARD_ID
const meiId = process.env.CONVERSATION_TEST_MEI_ID

if (!url || !publishableKey || !conversationId || !richardId || !meiId) {
  throw new Error('missing local Conversation Realtime test configuration')
}
if (!/^https?:\/\/(localhost|127\.0\.0\.1)/.test(url)) {
  throw new Error(`Realtime contract refuses non-local Supabase URL: ${url}`)
}

const topic = `conversation:${conversationId}`
const richardControlTopic = `user:${richardId}`
const meiControlTopic = `user:${meiId}`
const timeoutMs = 10_000
const clients = []
const channels = []

function client() {
  const value = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { timeout: timeoutMs },
  })
  clients.push(value)
  return value
}

async function signIn(email, password) {
  const value = client()
  const { data, error } = await value.auth.signInWithPassword({ email, password })
  if (error || !data.session) {
    throw new Error(`local sign-in failed for ${email}: ${error?.message ?? 'no session'}`)
  }
  await value.realtime.setAuth(data.session.access_token)
  return value
}

function withTimeout(promise, label, milliseconds = timeoutMs) {
  let timer
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`timed out waiting for ${label}`)), milliseconds)
    }),
  ]).finally(() => clearTimeout(timer))
}

function eventCollector(channel) {
  const events = []
  const eventNames = new Set([
    'message.created',
    'read.advanced',
    'conversation.permissions_changed',
    'conversation.revoked',
    'typing.changed',
  ])
  channel.on('broadcast', { event: '*' }, (message) => {
    if (eventNames.has(message.event)) {
      events.push({ event: message.event, payload: message.payload })
    }
  })
  return events
}

function waitForEvent(events, event, predicate = () => true) {
  return withTimeout(
    new Promise((resolve) => {
      const poll = setInterval(() => {
        const match = events.find((item) => item.event === event && predicate(item.payload))
        if (match) {
          clearInterval(poll)
          resolve(match.payload)
        }
      }, 20)
    }),
    event,
  ).catch((error) => {
    throw new Error(`${error.message}; observed events=${events.map((item) => item.event).join(',')}`)
  })
}

function subscribe(channel) {
  return withTimeout(
    new Promise((resolve) => {
      channel.subscribe((status, error) => {
        if (status === 'SUBSCRIBED') resolve({ status, error })
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') resolve({ status, error })
      })
    }),
    `subscription to ${channel.topic}`,
  )
}

async function removeTrackedChannel(value, channel) {
  await value.removeChannel(channel)
  const index = channels.findIndex(([candidate, tracked]) => candidate === value && tracked === channel)
  if (index >= 0) channels.splice(index, 1)
}

function commandRow(data, label) {
  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') {
    throw new Error(`${label} returned no result row`)
  }
  return row
}

async function rpc(value, name, args) {
  const { data, error } = await value.schema('api').rpc(name, args)
  if (error) {
    throw new Error(
      `${name} failed unexpectedly: ${error.message}; code=${error.code ?? 'none'}; ` +
        `details=${error.details ?? 'none'}; hint=${error.hint ?? 'none'}`,
    )
  }
  return commandRow(data, name)
}

function assertMinimalPayload(payload, requiredKeys) {
  assert.equal(typeof payload, 'object')
  for (const key of requiredKeys) assert.ok(key in payload, `missing Realtime payload key ${key}`)
  const serialized = JSON.stringify(payload).toLowerCase()
  for (const forbidden of ['body', 'messagebody', 'clientnonce', 'question', 'requestmessage', 'blockeruserid']) {
    assert.equal(serialized.includes(forbidden), false, `Realtime payload leaks ${forbidden}`)
  }
}

async function main() {
  const richard = await signIn('richard@example.com', 'devseed-password-richard')
  const mei = await signIn('mei@example.com', 'devseed-password-mei')
  const sam = await signIn('sam@example.com', 'devseed-password-sam')

  const richardChannel = richard.channel(topic, { config: { private: true } })
  let meiChannel = mei.channel(topic, { config: { private: true } })
  const outsiderChannel = sam.channel(topic, { config: { private: true } })
  const richardControlChannel = richard.channel(richardControlTopic, { config: { private: true } })
  const meiControlChannel = mei.channel(meiControlTopic, { config: { private: true } })
  const outsiderControlChannel = sam.channel(meiControlTopic, { config: { private: true } })
  channels.push(
    [richard, richardChannel],
    [mei, meiChannel],
    [sam, outsiderChannel],
    [richard, richardControlChannel],
    [mei, meiControlChannel],
    [sam, outsiderControlChannel],
  )

  const richardEvents = eventCollector(richardChannel)
  let meiEvents = eventCollector(meiChannel)
  const meiControlEvents = eventCollector(meiControlChannel)

  assert.equal((await subscribe(richardChannel)).status, 'SUBSCRIBED', 'participant Richard must join')
  assert.equal((await subscribe(meiChannel)).status, 'SUBSCRIBED', 'participant Mei must join')
  assert.notEqual((await subscribe(outsiderChannel)).status, 'SUBSCRIBED', 'outsider must be denied')
  await removeTrackedChannel(sam, outsiderChannel)
  assert.equal(
    (await subscribe(richardControlChannel)).status,
    'SUBSCRIBED',
    'Richard must join his own control topic',
  )
  assert.equal(
    (await subscribe(meiControlChannel)).status,
    'SUBSCRIBED',
    'Mei must join her own control topic',
  )
  assert.notEqual(
    (await subscribe(outsiderControlChannel)).status,
    'SUBSCRIBED',
    'outsider must not join another member control topic',
  )
  await removeTrackedChannel(sam, outsiderControlChannel)

  const firstNonce = '92000000-0000-4000-8000-000000000001'
  const firstMessageEvent = waitForEvent(
    meiEvents,
    'message.created',
    (payload) => payload.conversationId === conversationId,
  )
  const first = await rpc(richard, 'send_message', {
    p_conversation_id: conversationId,
    p_body: 'Realtime contract message',
    p_client_nonce: firstNonce,
  })
  assert.equal(first.result_code, 'sent')
  const firstPayload = await firstMessageEvent
  assertMinimalPayload(firstPayload, ['conversationId', 'messageId'])
  assert.equal(String(firstPayload.messageId), String(first.message_id))

  const eventCount = meiEvents.length
  const duplicate = await rpc(richard, 'send_message', {
    p_conversation_id: conversationId,
    p_body: 'Ignored duplicate body',
    p_client_nonce: firstNonce,
  })
  assert.equal(duplicate.result_code, 'duplicate')
  assert.equal(String(duplicate.message_id), String(first.message_id))
  await new Promise((resolve) => setTimeout(resolve, 300))
  assert.equal(meiEvents.length, eventCount, 'duplicate nonce must not rebroadcast')

  await removeTrackedChannel(mei, meiChannel)
  const second = await rpc(richard, 'send_message', {
    p_conversation_id: conversationId,
    p_body: 'Deliberately ignored Broadcast',
    p_client_nonce: '92000000-0000-4000-8000-000000000002',
  })
  assert.equal(second.result_code, 'sent')

  meiChannel = mei.channel(topic, { config: { private: true } })
  channels.push([mei, meiChannel])
  meiEvents = eventCollector(meiChannel)
  assert.equal((await subscribe(meiChannel)).status, 'SUBSCRIBED', 'participant reconnect must succeed')

  const { data: gapRows, error: gapError } = await mei.schema('api').rpc('list_conversation_messages_after', {
    p_conversation_id: conversationId,
    p_after_id: first.message_id,
    p_limit: 100,
  })
  if (gapError) throw new Error(`gap recovery failed: ${gapError.message}`)
  assert.ok(gapRows.some((row) => String(row.id) === String(second.message_id)), 'gap query recovers missed message')

  const typingEvent = waitForEvent(
    meiEvents,
    'typing.changed',
    (payload) => payload.actorUserId === richardId && payload.isTyping === true,
  )
  const typing = await rpc(richard, 'publish_conversation_typing', {
    p_conversation_id: conversationId,
    p_is_typing: true,
  })
  assert.equal(typing.result_code, 'published')
  assertMinimalPayload(await typingEvent, ['conversationId', 'actorUserId', 'isTyping', 'expiresAt'])
  const throttled = await rpc(richard, 'publish_conversation_typing', {
    p_conversation_id: conversationId,
    p_is_typing: true,
  })
  assert.equal(throttled.result_code, 'throttled')

  const readEvent = waitForEvent(
    richardEvents,
    'read.advanced',
    (payload) => payload.readerUserId === meiId,
  )
  const read = await rpc(mei, 'mark_conversation_read', {
    p_conversation_id: conversationId,
    p_message_id: second.message_id,
  })
  assert.equal(read.result_code, 'advanced')
  assertMinimalPayload(await readEvent, ['conversationId', 'readerUserId', 'messageId'])

  const readEventCount = richardEvents.length
  const unchangedRead = await rpc(mei, 'mark_conversation_read', {
    p_conversation_id: conversationId,
    p_message_id: second.message_id,
  })
  assert.equal(unchangedRead.result_code, 'unchanged')
  await new Promise((resolve) => setTimeout(resolve, 300))
  assert.equal(richardEvents.length, readEventCount, 'unchanged read cursor must not rebroadcast')

  const permissionsEvent = waitForEvent(
    meiControlEvents,
    'conversation.permissions_changed',
    (payload) => payload.conversationId === conversationId,
  )
  const { error: disconnectError } = await richard.schema('api').rpc('disconnect', {
    p_other_user_id: meiId,
  })
  if (disconnectError) throw new Error(`disconnect failed: ${disconnectError.message}`)
  assertMinimalPayload(await permissionsEvent, ['conversationId'])

  const disconnectedSend = await rpc(mei, 'send_message', {
    p_conversation_id: conversationId,
    p_body: 'Must not persist after disconnect',
    p_client_nonce: '92000000-0000-4000-8000-000000000003',
  })
  assert.equal(disconnectedSend.result_code, 'connection_required')

  const revokedEvent = waitForEvent(
    meiControlEvents,
    'conversation.revoked',
    (payload) => payload.conversationId === conversationId,
  )
  const { error: blockError } = await richard.schema('api').rpc('block_member', { p_blocked_user_id: meiId })
  if (blockError) throw new Error(`block failed: ${blockError.message}`)
  assertMinimalPayload(await revokedEvent, ['conversationId'])

  const denied = await rpc(mei, 'send_message', {
    p_conversation_id: conversationId,
    p_body: 'Must not persist after block',
    p_client_nonce: '92000000-0000-4000-8000-000000000004',
  })
  assert.equal(denied.result_code, 'not_available')

  const deniedTyping = await rpc(mei, 'publish_conversation_typing', {
    p_conversation_id: conversationId,
    p_is_typing: true,
  })
  assert.equal(deniedTyping.result_code, 'not_available')

  const blockedMei = await signIn('mei@example.com', 'devseed-password-mei')
  const blockedChannel = blockedMei.channel(topic, { config: { private: true } })
  channels.push([blockedMei, blockedChannel])
  assert.notEqual(
    (await subscribe(blockedChannel)).status,
    'SUBSCRIBED',
    'blocked participant must be denied a new topic join',
  )

  const { error: unblockError } = await richard.schema('api').rpc('unblock_member', { p_blocked_user_id: meiId })
  if (unblockError) throw new Error(`unblock failed: ${unblockError.message}`)

  console.log('Conversation Realtime authorization, delivery, recovery, revocation, and cleanup passed')
}

try {
  await main()
} finally {
  for (const [value, channel] of channels) {
    await value.removeChannel(channel)
  }
  for (const value of clients) {
    await value.removeAllChannels()
    await value.auth.signOut({ scope: 'local' })
  }
  assert.equal(clients.every((value) => value.getChannels().length === 0), true, 'all channels must be removed')
}
