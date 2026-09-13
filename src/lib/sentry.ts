// ponytail: Sentry initialization. Only initializes if SENTRY_DSN is set.
// Self-host or use sentry.io (5K events/month free).
// Source maps uploaded via @sentry/nextjs build plugin (configured in next.config.mjs).

import * as Sentry from "@sentry/nextjs";

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1, // 10% of requests
    replaysSessionSampleRate: 0, // disable session replay (privacy)
    replaysOnErrorSampleRate: 0,
    // ponytail: scrub PII
    beforeSend(event) {
      if (event.user) {
        // never send email addresses to Sentry
        delete event.user.email;
        delete event.user.ip_address;
      }
      // strip auth headers from fetch breadcrumbs
      if (event.breadcrumbs) {
        for (const b of event.breadcrumbs) {
          if (b.data && typeof b.data === "object" && "headers" in b.data) {
            delete b.data.headers;
          }
        }
      }
      return event;
    },
    ignoreErrors: [
      // Browser noise we don't care about
      "ResizeObserver loop limit exceeded",
      "Network request failed",
      "Failed to fetch",
      "AbortError",
      "User aborted",
      // PayPal sandbox
      "PAYMENT_SALE_REFUNDED",
    ],
  });
}

// ponytail: capture an error with context. Use in API route try/catch.
export function reportError(err: unknown, context?: Record<string, unknown>) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.captureException(err, { extra: context });
}
