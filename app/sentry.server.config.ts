// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://5ba4657888cd18f9461740621b9bab4d@o4511277419134976.ingest.us.sentry.io/4511277428572160",

  // Sample 100% of traces in dev for debugging, 10% in production to stay within free-tier quota.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,

  // Disabled to avoid sending private content (mentor messages, profile data) to Sentry on errors.
  // Attach user.id explicitly via Sentry.setUser() in auth helpers instead.
  sendDefaultPii: false,
});
