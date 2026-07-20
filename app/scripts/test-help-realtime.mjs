import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const requestId = process.env.HELP_TEST_REQUEST_ID

if (!url || !publishableKey || !requestId) {
  throw new Error('missing local Help Realtime test configuration')
}
if (!/^https?:\/\/(localhost|127\.0\.0\.1)/.test(url)) {
  throw new Error(`Help Realtime contract refuses non-local Supabase URL: ${url}`)
}

const askerUserId = '10000000-0000-4000-8000-000000000005'
const askerMembershipId = '20000000-0000-4000-8000-000000000005'
const recipientUserId = '10000000-0000-4000-8000-000000000003'
const recipientMembershipId = '20000000-0000-4000-8000-000000000003'
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

function withTimeout(promise, label) {
  let timer
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`timed out waiting for ${label}`)), timeoutMs)
    }),
  ]).finally(() => clearTimeout(timer))
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

function collectHelpEvents(channel) {
  const events = []
  channel.on('broadcast', { event: 'help.changed' }, (message) => {
    events.push(message.payload)
  })
  return events
}

function waitForAsk(events, askId, predicate = () => true) {
  return withTimeout(
    new Promise((resolve) => {
      const poll = setInterval(() => {
        const event = events.find((item) => item.askId === askId && predicate(item))
        if (event) {
          clearInterval(poll)
          resolve(event)
        }
      }, 20)
    }),
    `help.changed for Ask ${askId}`,
  )
}

function assertIdsOnly(payload, askId) {
  assert.equal(payload.askId, askId)
  assert.equal(typeof payload.id, 'string')
  assert.deepEqual(Object.keys(payload).sort(), ['askId', 'id'])
  const serialized = JSON.stringify(payload).toLowerCase()
  for (const forbidden of [
    'question',
    'requestmessage',
    'offernote',
    'declinenote',
    'displayname',
    'status',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `Help Realtime payload leaks ${forbidden}`)
  }
}

function commandRow(data, label) {
  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') throw new Error(`${label} returned no result row`)
  return row
}

async function rpc(value, name, args) {
  const { data, error } = await value.schema('api').rpc(name, args)
  if (error) throw new Error(`${name} failed unexpectedly: ${error.message}`)
  return commandRow(data, name)
}

async function removeTrackedChannel(value, channel) {
  await value.removeChannel(channel)
  const index = channels.findIndex(([candidate, tracked]) => candidate === value && tracked === channel)
  if (index >= 0) channels.splice(index, 1)
}

async function main() {
  const asker = await signIn('sam@example.com', 'devseed-password-sam')
  const recipient = await signIn('mark@example.com', 'devseed-password-mark')
  const outsider = await signIn('richard@example.com', 'devseed-password-richard')

  const askerChannel = asker.channel(`user:${askerUserId}`, { config: { private: true } })
  let recipientChannel = recipient.channel(`user:${recipientUserId}`, { config: { private: true } })
  const outsiderChannel = outsider.channel(`user:${recipientUserId}`, { config: { private: true } })
  channels.push(
    [asker, askerChannel],
    [recipient, recipientChannel],
    [outsider, outsiderChannel],
  )

  const askerEvents = collectHelpEvents(askerChannel)
  let recipientEvents = collectHelpEvents(recipientChannel)
  assert.equal((await subscribe(askerChannel)).status, 'SUBSCRIBED')
  assert.equal((await subscribe(recipientChannel)).status, 'SUBSCRIBED')
  assert.notEqual(
    (await subscribe(outsiderChannel)).status,
    'SUBSCRIBED',
    'a member cannot join another user control topic',
  )
  await removeTrackedChannel(outsider, outsiderChannel)

  const created = await rpc(asker, 'create_direct_ask', {
    p_asker_membership_id: askerMembershipId,
    p_recipient_membership_id: recipientMembershipId,
    p_question: 'Can you review this local Realtime contract?',
    p_request_message: 'This request exists only for an isolated local integration test.',
    p_client_request_id: requestId,
  })
  assert.equal(created.result_code, 'created')
  const askId = created.ask_id
  const createdAskerPayload = await waitForAsk(askerEvents, askId)
  assertIdsOnly(createdAskerPayload, askId)
  assertIdsOnly(await waitForAsk(recipientEvents, askId), askId)

  const askerCount = askerEvents.length
  const recipientCount = recipientEvents.length
  const retried = await rpc(asker, 'create_direct_ask', {
    p_asker_membership_id: askerMembershipId,
    p_recipient_membership_id: recipientMembershipId,
    p_question: 'Can you review this local Realtime contract?',
    p_request_message: 'This request exists only for an isolated local integration test.',
    p_client_request_id: requestId,
  })
  assert.equal(retried.result_code, 'existing')
  assert.equal(retried.ask_id, askId)
  await new Promise((resolve) => setTimeout(resolve, 300))
  assert.equal(askerEvents.length, askerCount, 'idempotent retry must not rebroadcast')
  assert.equal(recipientEvents.length, recipientCount, 'idempotent retry must not rebroadcast')

  await removeTrackedChannel(recipient, recipientChannel)
  const retractedEvent = waitForAsk(
    askerEvents,
    askId,
    (payload) => payload.id !== createdAskerPayload.id,
  )
  const retracted = await rpc(asker, 'retract_ask', { p_ask_id: askId })
  assert.equal(retracted.result_code, 'retracted')
  assertIdsOnly(await retractedEvent, askId)

  recipientChannel = recipient.channel(`user:${recipientUserId}`, { config: { private: true } })
  channels.push([recipient, recipientChannel])
  recipientEvents = collectHelpEvents(recipientChannel)
  assert.equal((await subscribe(recipientChannel)).status, 'SUBSCRIBED')

  const { data: giveRows, error: giveError } = await recipient.schema('api').rpc('list_give_help', {
    p_membership_id: recipientMembershipId,
    p_arm: 'direct',
    p_query: null,
    p_before_created_at: null,
    p_before_id: null,
    p_limit: 50,
  })
  if (giveError) throw new Error(`durable Help refetch failed: ${giveError.message}`)
  assert.equal(
    giveRows.some((row) => row.ask_id === askId),
    false,
    'reconnect refetch recovers a deliberately missed retraction',
  )
  assert.equal(recipientEvents.length, 0, 'reconnect does not replay stale payload state')

  console.log('Help Realtime authorization, IDs-only delivery, dedupe, recovery, and cleanup passed')
}

try {
  await main()
} finally {
  for (const [value, channel] of channels) await value.removeChannel(channel)
  for (const value of clients) {
    await value.removeAllChannels()
    await value.auth.signOut({ scope: 'local' })
  }
  assert.equal(clients.every((value) => value.getChannels().length === 0), true)
}
