import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  // Legacy route redirects after the /mentorship/request/* → /ask/*
  // promotion. Permanent (308) so any stale email links and bookmarks
  // route the user to the renamed page.
  async redirects() {
    return [
      {
        source: '/mentorship/request/new',
        destination: '/ask/new',
        permanent: true,
      },
      {
        source: '/mentorship/request/:id',
        destination: '/ask/:id',
        permanent: true,
      },
      {
        source: '/mentorship/thread/:id',
        destination: '/ask/thread/:id',
        permanent: true,
      },
      // /search → /discover rename. The directory page still does
      // search internally (a query string ?q= still works); the URL
      // just leads with the verb the brand prefers.
      {
        source: '/search',
        destination: '/discover',
        permanent: true,
      },
      // /friends folded into /discover (with a "People I know" filter)
      // and /inbox (where incoming requests now live). The 308 here
      // catches stale email links and bookmarks; we send root /friends
      // to Discover with the filter pre-applied so the user lands on
      // their friends list, the closest analog to the old page.
      {
        source: '/friends',
        destination: '/discover?peopleIKnow=on',
        permanent: true,
      },
      // /messages list page folded into /inbox — the inbox now shows
      // DM threads alongside asks and friend requests. /messages/:id
      // (the conversation viewer) keeps working; only the root list
      // URL redirects.
      {
        source: '/messages',
        destination: '/inbox',
        permanent: true,
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'bridgecircle',

  project: 'bridgecircle',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
})
