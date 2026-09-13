// ponytail: PayPal redirect-back. Captures the order (one-time) or marks subscription active.
// Uses custom param `type=sub|once` to branch.

import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase-server";
import { captureOrder, getSubscription } from "@/lib/paypal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token"); // subscription id or order id
  const type = url.searchParams.get("type");
  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.redirect(new URL("/?paywall=error", url.origin));
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) return NextResponse.redirect(new URL("/?paywall=signin", url.origin));

  try {
    let plan: "pro" | "lifetime" = type === "sub" ? "pro" : "lifetime";
    let paypalId: string | null = null;
    let payerId: string | null = null;
    let captureId: string | null = null;
    let captureAmount: string | null = null;

    if (type === "sub") {
      paypalId = token;
      const sub = await getSubscription(token!);
      payerId = sub.subscriber?.payer_id || null;
      if (sub.status !== "ACTIVE" && sub.status !== "APPROVED") {
        return NextResponse.redirect(new URL(`/?paywall=sub_${sub.status.toLowerCase()}`, url.origin));
      }
    } else {
      const cap = await captureOrder(token!);
      paypalId = token;
      payerId = cap.payerId || null;
      if (cap.status !== "COMPLETED") {
        return NextResponse.redirect(new URL(`/?paywall=capture_${cap.status.toLowerCase()}`, url.origin));
      }
      // ponytail: captureOrder didn't return capture id in our shim. Fetch it.
      const token2 = process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
        ? await (async () => {
            const ENV = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
            const BASE = ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
            const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
            const r = await fetch(`${BASE}/v1/oauth2/token`, {
              method: "POST",
              headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
              body: "grant_type=client_credentials",
            });
            const data = await r.json();
            return data.access_token as string;
          })()
        : null;
      if (token2) {
        const detail = await fetch(`https://api-${process.env.PAYPAL_ENV === "live" ? "m" : "m"}.paypal.com/v2/checkout/orders/${token}`, {
          headers: { Authorization: `Bearer ${token2}` },
        });
        if (detail.ok) {
          const d = await detail.json();
          const purchase = d.purchase_units?.[0];
          const cap = purchase?.payments?.captures?.[0];
          captureId = cap?.id || null;
          captureAmount = cap?.amount?.value || null;
        }
      }
    }

    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.redirect(new URL("/?paywall=admin", url.origin));
    // ponytail: lifetime never expires; pro expires 31 days from now (renewal handled by webhook).
    const expires = plan === "pro" ? new Date(Date.now() + 31 * 24 * 3600 * 1000).toISOString() : null;
    const updatePayload: Record<string, unknown> = {
      user_id: sess.session.user.id,
      plan,
      paypal_subscription_id: plan === "pro" ? paypalId : null,
      paypal_payer_id: payerId,
      paypal_capture_id: captureId,
      paid_at: new Date().toISOString(),
      expires_at: expires,
      updated_at: new Date().toISOString(),
    };
    const { error } = await admin.from("user_billing").upsert(updatePayload, { onConflict: "user_id" });
    if (error) throw error;

    // ponytail: ledger row for refunds/accounting.
    if (captureId && plan === "lifetime") {
      await admin.from("payments").insert({
        user_id: sess.session.user.id,
        paypal_order_id: token,
        paypal_capture_id: captureId,
        amount: captureAmount || process.env.PAYPAL_LIFETIME_PRICE || "49.00",
        currency: process.env.PAYPAL_CURRENCY || "USD",
        plan,
      });
    }

    // ponytail: email receipt (best-effort).
    const { data: u } = await admin.auth.admin.getUserById(sess.session.user.id);
    if (u?.user?.email) {
      const { sendTemplatedEmail } = await import("@/lib/email");
      void sendTemplatedEmail(u.user.email, plan === "pro" ? "welcome_pro" : "welcome_lifetime", {
        amount: captureAmount || "49.00",
        date: new Date().toLocaleDateString(),
        renewalDate: plan === "pro" ? new Date(Date.now() + 31 * 24 * 3600 * 1000).toLocaleDateString() : "never",
      }).catch((e) => console.error("email failed:", e));
    }

    return NextResponse.redirect(new URL(`/?paywall=ok&plan=${plan}`, url.origin));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.redirect(new URL(`/?paywall=error&msg=${encodeURIComponent(msg)}`, url.origin));
  }
}
