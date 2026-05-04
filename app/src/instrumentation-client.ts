// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://5ba4657888cd18f9461740621b9bab4d@o4511277419134976.ingest.us.sentry.io/4511277428572160',

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  sendDefaultPii: false,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
