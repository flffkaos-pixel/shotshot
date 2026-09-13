// ponytail: PayPal helpers — get access token, create subscription, create order.
// Sandbox vs live toggled by PAYPAL_ENV. No SDK dep — fetch() only.

const ENV = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
const BASE = ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

let _tokenCache: { token: string; exp: number } | null = null;

async function getToken(): Promise<string> {
  if (_tokenCache && Date.now() < _tokenCache.exp - 60_000) return _tokenCache.token;
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET missing");
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!r.ok) throw new Error(`PayPal token: ${r.status}`);
  const data = await r.json();
  _tokenCache = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export type PaypalApproval = { approvalUrl: string; id: string };

export async function createSubscription(planId: string, returnUrl: string, cancelUrl: string): Promise<PaypalApproval> {
  const token = await getToken();
  const r = await fetch(`${BASE}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      plan_id: planId,
      application_context: {
        brand_name: "Shotshot",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  });
  if (!r.ok) throw new Error(`PayPal subscribe: ${r.status} ${await r.text()}`);
  const sub = await r.json();
  const link = sub.links.find((l: { rel: string }) => l.rel === "approve");
  if (!link) throw new Error("No approval link in subscription response");
  return { approvalUrl: link.href, id: sub.id };
}

export async function createOrder(amount: string, currency: string, returnUrl: string, cancelUrl: string): Promise<PaypalApproval> {
  const token = await getToken();
  const r = await fetch(`${BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: currency, value: amount },
          description: "Shotshot Pro Lifetime",
        },
      ],
      application_context: {
        brand_name: "Shotshot",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  });
  if (!r.ok) throw new Error(`PayPal order: ${r.status} ${await r.text()}`);
  const order = await r.json();
  const link = order.links.find((l: { rel: string }) => l.rel === "approve");
  if (!link) throw new Error("No approval link in order response");
  return { approvalUrl: link.href, id: order.id };
}

export async function captureOrder(orderId: string): Promise<{ status: string; payerId?: string; email?: string }> {
  const token = await getToken();
  const r = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!r.ok) throw new Error(`PayPal capture: ${r.status} ${await r.text()}`);
  const data = await r.json();
  return {
    status: data.status,
    payerId: data.payer?.payer_id,
    email: data.payer?.email_address,
  };
}

export async function getSubscription(subId: string): Promise<{ status: string; subscriber?: { payer_id?: string; email_address?: string } }> {
  const token = await getToken();
  const r = await fetch(`${BASE}/v1/billing/subscriptions/${subId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`PayPal getSub: ${r.status}`);
  return r.json();
}

export async function verifyWebhookSignature(headers: Record<string, string>, body: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;
  const token = await getToken();
  const r = await fetch(`${BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_algo: headers["paypal-auth-algo"],
      cert_url: headers["paypal-cert-url"],
      transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    }),
  });
  if (!r.ok) return false;
  const data = await r.json();
  return data.verification_status === "SUCCESS";
}
