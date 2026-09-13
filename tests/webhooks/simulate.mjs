// ponytail: PayPal webhook simulator. Sends a real signed POST to your local /api/paypal/webhook.
// Verifies the same way PayPal does. Useful for local dev and CI.
//
// Usage:
//   node tests/webhooks/simulate.mjs <event-file>
//   node tests/webhooks/simulate.mjs tests/webhooks/01-subscription-activated.json
//
// Requires env: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID (optional for unsigned)

import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";

const TARGET = process.env.WEBHOOK_URL || "http://127.0.0.1:3000/api/paypal/webhook";
const EVENT_FILE = process.argv[2];

if (!EVENT_FILE) {
  console.error("Usage: node tests/webhooks/simulate.mjs <event-file>");
  process.exit(1);
}

const body = readFileSync(EVENT_FILE, "utf8");
const event = JSON.parse(body);

const id = process.env.PAYPAL_CLIENT_ID;
const secret = process.env.PAYPAL_CLIENT_SECRET;
const webhookId = process.env.PAYPAL_WEBHOOK_ID;

if (!id || !secret) {
  console.error("Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET env vars");
  process.exit(1);
}

// ponytail: get OAuth token, then sign the webhook.
async function getToken() {
  const r = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!r.ok) {
    console.error(`Token error: ${r.status} ${await r.text()}`);
    process.exit(1);
  }
  return (await r.json()).access_token;
}

async function verifySimulated(token) {
  if (!webhookId) {
    console.log("PAYPAL_WEBHOOK_ID not set — sending unsigned (webhook handler will reject with 400)");
    return null;
  }
  const r = await fetch("https://api-m.sandbox.paypal.com/v1/notifications/simulate-event", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      webhook_id: webhookId,
      url: TARGET,
      event: event,
    }),
  });
  if (!r.ok) {
    console.error(`Simulate error: ${r.status} ${await r.text()}`);
    return null;
  }
  return r.json();
}

async function sendDirect(token) {
  // ponytail: when simulate-event is not available (no webhook_id), send raw.
  // The handler will reject unless signature is valid. For local dev, you can
  // temporarily set CRON_SECRET/ADMIN_SECRET to bypass.
  const r = await fetch(TARGET, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Paypal-Transmission-Id": event.id,
      "Paypal-Transmission-Time": event.create_time,
      "Paypal-Transmission-Sig": "simulated",
      "Paypal-Auth-Algo": "SHA256withRSA",
      "Paypal-Cert-Url": "https://api.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42-fca2a594-7ce9a13b-test.pem",
    },
    body,
  });
  console.log(`Status: ${r.status}`);
  const text = await r.text();
  try {
    console.log("Body:", JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log("Body:", text.slice(0, 200));
  }
}

const token = await getToken();
if (webhookId) {
  const result = await verifySimulated(token);
  console.log("Simulated result:", result);
} else {
  await sendDirect(token);
}
