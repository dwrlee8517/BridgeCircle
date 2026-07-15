import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const requestKey = process.env.MESSAGES_TEST_REQUEST_KEY
const messageNonce = process.env.MESSAGES_TEST_MESSAGE_NONCE

if (!url || !publishableKey || !requestKey || !messageNonce) {
  throw new Error('missing local Messages Realtime test configuration')
}
if (!/^https?:\/\/(localhost|127\.0\.0\.1)/.test(url)) {
  throw new Error(`Messages Realtime contract refuses non-local Supabase URL: ${url}`)
}

const conversationId = '50000000-0000-4000-8000-000000000001'
const richardId = '10000000-0000-4000-8000-000000000002'
const markId = '10000000-0000-4000-8000-000000000003'
const meiId = '10000000-0000-4000-8000-000000000004'
const samId = '10000000-0000-4000-8000-000000000005'
const organizationId = '11111111-1111-4111-8111-111111111111'
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

function subscribe(channel) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out subscribing to ${channel.topic}`)), timeoutMs)
    channel.subscribe((status, error) => {
      if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(timer)
        resolve({ status, error })
      }
    })
  })
}

function collect(channel, event) {
  const payloads = []
  channel.on('broadcast', { event }, (message) => payloads.push(message.payload))
  return payloads
}

async function rpc(value, name, args) {
  const { data, error } = await value.schema('api').rpc(name, args)
  if (error) throw new Error(`${name} failed unexpectedly: ${error.message}`)
  return data
}

function assertIdsOnly(payload, requiredKey) {
  assert.equal(typeof payload.id, 'string')
  assert.equal(typeof payload[requiredKey], 'string')
  const allowed = new Set(['id', 'conversationId', 'requestId'])
  for (const key of Object.keys(payload)) assert.equal(allowed.has(key), true, `unexpected key ${key}`)
}

async function main() {
  const [richard, mark, mei, sam] = await Promise.all([
    signIn('richard@example.com', 'devseed-password-richard'),
    signIn('mark@example.com', 'devseed-password-mark'),
    signIn('mei@example.com', 'devseed-password-mei'),
    signIn('sam@example.com', 'devseed-password-sam'),
  ])

  const owners = [
    [richard, richardId],
    [mark, markId],
    [mei, meiId],
    [sam, samId],
  ].map(([value, userId]) => {
    const channel = value.channel(`user:${userId}`, { config: { private: true } })
    channels.push([value, channel])
    return { value, channel, messages: collect(channel, 'messages.changed'), connections: collect(channel, 'connections.changed') }
  })
  for (const owner of owners) assert.equal((await subscribe(owner.channel)).status, 'SUBSCRIBED')

  const outsiderChannel = richard.channel(`user:${markId}`, { config: { private: true } })
  channels.push([richard, outsiderChannel])
  assert.notEqual((await subscribe(outsiderChannel)).status, 'SUBSCRIBED', 'a user cannot join another owner topic')

  await Promise.all([
    rpc(mei, 'send_message', {
      p_conversation_id: conversationId,
      p_body: 'Owner-topic Messages integration fixture.',
      p_client_nonce: messageNonce,
    }),
    rpc(sam, 'send_connection_request', {
      p_recipient_user_id: markId,
      p_origin_organization_id: organizationId,
      p_intro_message: 'Owner-topic Connection integration fixture.',
      p_client_request_id: requestKey,
    }),
  ])

  await new Promise((resolve) => setTimeout(resolve, 750))
  const missing = []
  for (const [label, values] of [
    ['Richard messages.changed', owners[0].messages],
    ['Mei messages.changed', owners[2].messages],
    ['Mark connections.changed', owners[1].connections],
    ['Sam connections.changed', owners[3].connections],
  ]) {
    if (values.length === 0) missing.push(label)
  }
  assert.deepEqual(missing, [], `missing approved owner invalidations: ${missing.join(', ')}`)

  assertIdsOnly(owners[0].messages[0], 'conversationId')
  assertIdsOnly(owners[2].messages[0], 'conversationId')
  assertIdsOnly(owners[1].connections[0], 'requestId')
  assertIdsOnly(owners[3].connections[0], 'requestId')
  console.log('Messages owner-topic authorization, IDs-only delivery, and cleanup passed')
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
