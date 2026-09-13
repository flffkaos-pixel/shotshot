"use client";
// ponytail: PostHog analytics. Only loads if NEXT_PUBLIC_POSTHOG_KEY is set.
// 1M events/month free, EU self-host available. Disable by removing the env var.

import * as React from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

let initialized = false;

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
    if (!key || initialized) return;

    posthog.init(key, {
      api_host: host,
      capture_pageview: true, // auto-capture page views
      capture_pageleave: true, // engagement metric
      autocapture: false, // don't capture every click by default
      // ponytail: respect Do-Not-Track
      respect_dnt: true,
      // privacy: don't capture form fields
      mask_all_text: false,
      // session recording (off by default for performance)
      disable_session_recording: true,
    });
    initialized = true;
  }, []);

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return <>{children}</>;
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

// ponytail: typed event helpers. Use these instead of posthog.capture() directly.
export function trackEvent(name: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(name, props);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.identify(userId, traits);
}

export function resetUser() {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.reset();
}

// Pre-defined events for consistency
export const Events = {
  EditorOpened: "editor_opened",
  ProjectCreated: "project_created",
  ProjectExported: "project_exported",
  AICaptionGenerated: "ai_caption_generated",
  OCRVerified: "ocr_verified",
  TranslationGenerated: "translation_generated",
  BackgroundGenerated: "background_generated",
  PaywallShown: "paywall_shown",
  CheckoutStarted: "checkout_started",
  SubscriptionCompleted: "subscription_completed",
  LandingPageVisited: "landing_page_visited",
} as const;
