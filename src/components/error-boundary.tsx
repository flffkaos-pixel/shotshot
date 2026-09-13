"use client";
// ponytail: top-level error boundary. Catches uncaught React errors.
// Reports to Sentry, shows friendly fallback. Next.js 15 has `app/global-error.tsx`
// for the root case; this handles segment-level errors.

import * as React from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // ponytail: report to Sentry if configured.
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="max-w-md rounded-lg border bg-card p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {this.state.error.message || "An unexpected error occurred. We've been notified and will fix it."}
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Button
                onClick={() => {
                  this.setState({ error: null });
                  window.location.reload();
                }}
              >
                Reload
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  this.setState({ error: null });
                  window.location.href = "/landing";
                }}
              >
                Go to homepage
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Your work is saved locally. Reload to continue.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
