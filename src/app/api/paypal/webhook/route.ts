// ponytail: PayPal webhook. Handles the full subscription lifecycle so we can claim "fully automated".
// Events we care about:
//   BILLING.SUBSCRIPTION.ACTIVATED       → pro
//   BILLING.SUBSCRIPTION.RENEWED         → pro + extend expires_at
//   BILLING.SUBSCRIPTION.CANCELLED       → free (immediate)
//   BILLING.SUBSCRIPTION.SUSPENDED       → grace period (3 days), then free
//   BILLING.SUBSCRIPTION.EXPIRED         → free
//   BILLING.SUBSCRIPTION.PAYMENT.FAILED  → grace period
//   PAYMENT.SALE.COMPLETED               → ignore (covered by sub events)
//   PAYMENT.SALE.REFUNDED                → free

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { verifyWebhookSignature } from "@/lib/paypal";
import { sendTemplatedEmail } from "@/lib/email";
import { reportError } from "@/lib/sentry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GRACE_DAYS = 3;

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function POST(req: Request) {
  const raw = await req.text();
  const headers = Object.fromEntries(req.headers);
  const ok = await verifyWebhookSignature(headers, raw).catch((e) => {
    reportError(e, { route: "paypal/webhook", headers: Object.keys(headers) });
    return false;
  });
  if (!ok) return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });

  let event: {
    event_type?: string;
    resource?: {
      id?: string;
      status?: string;
      subscriber?: { payer_id?: string; email_address?: string };
      billing_info?: { next_billing_time?: string; outstanding_balance?: { value?: string } };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Admin client missing" }, { status: 503 });

  const subId = event.resource?.id;
  const type = event.event_type;
  const email = event.resource?.subscriber?.email_address;

  if (!subId || !type) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // find user by paypal_subscription_id
  const { data: billing } = await admin
    .from("user_billing")
    .select("user_id")
    .eq("paypal_subscription_id", subId)
    .single();

  if (!billing) {
    // ponytail: race — subscription just created, row not yet committed. ignore.
    return NextResponse.json({ ok: true, queued: "no user yet" });
  }

  const userId = billing.user_id;
  const now = new Date();
  let update: Record<string, unknown> = { updated_at: now.toISOString() };
  let userMessage: { subject: string; body: string; templateKey?: "welcome_pro" | "welcome_lifetime" | "subscription_cancelled" | "subscription_suspended" | "payment_failed" | "refund_processed" } | null = null;

  switch (type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED":
    case "BILLING.SUBSCRIPTION.RE-ACTIVATED":
      update = {
        ...update,
        plan: "pro",
        expires_at: event.resource?.billing_info?.next_billing_time || addDays(now, 31).toISOString(),
        paid_at: now.toISOString(),
      };
      userMessage = { subject: "Welcome to Shotshot Pro", body: "Your subscription is active. Unlimited projects unlocked.", templateKey: "welcome_pro" as const };
      break;
    case "BILLING.SUBSCRIPTION.RENEWED":
    case "PAYMENT.SALE.COMPLETED": {
      const captureId = (event.resource as { id?: string })?.id || null; // for PAYMENT.SALE.COMPLETED, resource.id is the transaction id
      const amount = (event.resource as { amount?: { value?: string; currency_code?: string } })?.amount;
      update = {
        ...update,
        plan: "pro",
        expires_at: event.resource?.billing_info?.next_billing_time || addDays(now, 31).toISOString(),
        paid_at: now.toISOString(),
        ...(captureId ? { paypal_capture_id: captureId } : {}),
      };
      // ponytail: log to ledger for refund eligibility.
      if (captureId && type === "PAYMENT.SALE.COMPLETED") {
        await admin.from("payments").insert({
          user_id: userId,
          paypal_capture_id: captureId,
          paypal_subscription_id: subId,
          amount: amount?.value || "0.00",
          currency: amount?.currency_code || "USD",
          plan: "pro",
        });
      }
      break;
    }
    case "BILLING.SUBSCRIPTION.CANCELLED":
    case "BILLING.SUBSCRIPTION.EXPIRED":
      update = { ...update, plan: "free", expires_at: null };
      userMessage = { subject: "Your Pro plan has ended", body: "Your Pro access has been removed.", templateKey: "subscription_cancelled" as const };
      break;
    case "BILLING.SUBSCRIPTION.SUSPENDED":
    case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
      // grace period — keep pro visible for GRACE_DAYS
      update = {
        ...update,
        plan: "pro",
        expires_at: addDays(now, GRACE_DAYS).toISOString(),
      };
      userMessage = {
        subject: "Payment failed — 3-day grace period",
        body: "Update PayPal billing to keep Pro.",
        templateKey: (type === "BILLING.SUBSCRIPTION.PAYMENT.FAILED" ? "payment_failed" : "subscription_suspended") as "payment_failed",
      };
      break;
    case "PAYMENT.SALE.REFUNDED":
      update = { ...update, plan: "free", expires_at: null };
      userMessage = { subject: "Refund processed", body: "Your refund was processed.", templateKey: "refund_processed" as const };
      break;
    default:
      return NextResponse.json({ ok: true, ignored: type });
  }

  const { error } = await admin.from("user_billing").update(update).eq("user_id", userId);
  if (error) {
    // ponytail: alert operator. PayPal will retry on 5xx, but we want to know.
    if (email) {
      const { sendTemplatedEmail } = await import("@/lib/email");
      void sendTemplatedEmail(
        process.env.ADMIN_EMAIL || email,
        "webhook_failed",
        {
          eventType: type || "?",
          subscriptionId: subId || "?",
          userId: userId || "?",
          error: error.message || "?",
        },
      ).catch(() => {});
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // ponytail: email is best-effort. failure must not block webhook.
  if (userMessage && email) {
    const { templateKey, ...rest } = userMessage as { subject: string; body: string; templateKey?: "welcome_pro" | "welcome_lifetime" | "subscription_cancelled" | "subscription_suspended" | "payment_failed" | "refund_processed" };
    if (templateKey) {
      void sendTemplatedEmail(email, templateKey, { graceEnd: addDays(now, GRACE_DAYS).toLocaleDateString() }).catch((e) =>
        console.error("email failed:", e),
      );
    } else {
      void sendTemplatedEmail(email, "welcome_pro").catch((e) => console.error("email failed:", e));
    }
  }

  return NextResponse.json({ ok: true, applied: type, userId });
}
