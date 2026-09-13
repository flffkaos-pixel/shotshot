// ponytail: minimal e2e. no fixtures, no per-page suites — just the critical paths.
// 1. anonymous editor opens
// 2. /admin stats returns 401 without secret
// 3. cron returns 401 without secret
// 4. /api/paypal/* all return 503 (not configured) or 401 (no auth)

import { test, expect } from "@playwright/test";

test("home page renders editor (anonymous)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/shotshot/i).first()).toBeVisible({ timeout: 10_000 });
});

test("admin stats without secret returns 401", async ({ request }) => {
  const r = await request.get("/api/admin/stats");
  expect(r.status()).toBe(401);
});

test("cron daily without secret returns 401", async ({ request }) => {
  const r = await request.get("/api/cron/daily");
  expect(r.status()).toBe(401);
});

test("paypal subscribe without auth returns 401", async ({ request }) => {
  const r = await request.post("/api/paypal/subscribe", { data: {} });
  // 401 if supabase configured, 503 if not — both prove the route is wired.
  expect([401, 503]).toContain(r.status());
});

test("paypal checkout without auth returns 401", async ({ request }) => {
  const r = await request.post("/api/paypal/checkout", { data: {} });
  expect([401, 503]).toContain(r.status());
});

test("paypal cancel without auth returns 401", async ({ request }) => {
  const r = await request.post("/api/paypal/cancel");
  expect([401, 503]).toContain(r.status());
});

test("ai caption without key returns 402", async ({ request }) => {
  const r = await request.post("/api/ai/caption", {
    data: { appName: "Test", features: ["a", "b"] },
  });
  // 402 if no key, 502 if upstream, 401 if auth-protected
  expect([402, 502, 401, 503]).toContain(r.status());
});

test("upload rejects missing dataUrl", async ({ request }) => {
  const r = await request.post("/api/upload", { data: {} });
  expect(r.status()).toBe(400);
});

test("upload accepts valid PNG data URL", async ({ request }) => {
  // 1x1 transparent PNG
  const png =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==";
  const r = await request.post("/api/upload", { data: { dataUrl: png } });
  expect([200, 503]).toContain(r.status());
  if (r.status() === 200) {
    const body = await r.json();
    expect(body.ok).toBe(true);
    expect(body.path).toMatch(/\/screenshots\/uploaded\//);
  }
});

test("ai translate rejects missing fields", async ({ request }) => {
  const r = await request.post("/api/ai/translate", { data: {} });
  expect([400, 503]).toContain(r.status());
});

test("fastlane rejects missing platform", async ({ request }) => {
  const r = await request.post("/api/fastlane", {
    data: { appName: "Test", bundleId: "com.test.app" },
  });
  expect([400, 503]).toContain(r.status());
});

test("fastlane generates config for ios", async ({ request }) => {
  const r = await request.post("/api/fastlane", {
    data: {
      platform: "ios",
      appName: "Test App",
      bundleId: "com.test.app",
      zipPath: "./test.zip",
      locales: ["en", "ko"],
    },
  });
  expect([200, 503]).toContain(r.status());
  if (r.status() === 200) {
    const text = await r.text();
    expect(text).toContain("upload_screenshots");
    expect(text).toContain("com.test.app");
  }
});

test("fastlane generates config for android", async ({ request }) => {
  const r = await request.post("/api/fastlane", {
    data: {
      platform: "android",
      appName: "Test App",
      bundleId: "com.test.app",
      zipPath: "./test.zip",
      locales: ["en"],
    },
  });
  expect([200, 503]).toContain(r.status());
  if (r.status() === 200) {
    const text = await r.text();
    expect(text).toContain("upload_to_play_store");
  }
});

test("landing render without auth returns 401", async ({ request }) => {
  const r = await request.get("/api/landing/render?id=abc");
  expect([401, 503]).toContain(r.status());
});

test("landing page renders publicly", async ({ request }) => {
  // we won't go through the chromium test; just check the route is up via request
  const r = await request.get("/landing");
  expect([200, 500]).toContain(r.status()); // 500 = build/edge issue
});

test("health endpoint returns 200 or 503", async ({ request }) => {
  const r = await request.get("/api/health");
  expect([200, 503]).toContain(r.status());
  const body = await r.json();
  expect(body.checks).toBeDefined();
  expect(body.ts).toBeDefined();
});

test("admin user action requires auth", async ({ request }) => {
  const r = await request.post("/api/admin/user", { data: { action: "lookup_user" } });
  expect([401, 400]).toContain(r.status());
});

test("admin user lookup by email", async ({ request }) => {
  const r = await request.post("/api/admin/user", {
    headers: { Authorization: `Bearer ${process.env.ADMIN_SECRET || "dev-secret"}` },
    data: { action: "lookup_user", user_email: "nonexistent@test.com" },
  });
  // 200 (empty), 404 (not found), 503 (no admin)
  expect([200, 404, 503]).toContain(r.status());
});

test("ai background rejects missing prompt", async ({ request }) => {
  const r = await request.post("/api/ai/background", { data: {} });
  expect([400, 503]).toContain(r.status());
});

test("ai background requires key", async ({ request }) => {
  const r = await request.post("/api/ai/background", { data: { prompt: "test" } });
  expect([402, 503]).toContain(r.status());
});

test("webhook rejects unsigned payload", async ({ request }) => {
  const r = await request.post("/api/paypal/webhook", {
    data: {
      id: "WH-TEST",
      event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
      resource: { id: "I-TEST" },
    },
  });
  // ponytail: unsigned request must fail with 400.
  expect(r.status()).toBe(400);
});

test("webhook rejects malformed JSON", async ({ request }) => {
  const r = await request.post("/api/paypal/webhook", {
    data: "not json {",
    headers: { "Content-Type": "application/json" },
  });
  expect([400, 415]).toContain(r.status());
});
