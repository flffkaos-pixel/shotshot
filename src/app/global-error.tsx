"use client";
// ponytail: Next.js 15 root error boundary. Catches errors in the root layout.
// Required to be a client component. Shows minimal fallback to avoid layout issues.

import * as React from "react";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ fontFamily: "system-ui, sans-serif", padding: 40, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ color: "#666", marginBottom: 20 }}>
            {error.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={reset}
            style={{
              padding: "10px 20px",
              background: "#0a0a0a",
              color: "#fff",
              border: 0,
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
