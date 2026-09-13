// ponytail: admin-only refund via PayPal + downgrade.
// Also lets admin grant/revoke Pro manually (support cases).

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  action: "refund" | "grant_pro" | "grant_lifetime" | "revoke" | "lookup_user";
  user_email?: string;
  user_id?: string;
  amount?: string; // for refund
  reason?: string;
};

async function paypalRefund(captureId: string, amount?: string, reason?: string) {
  const ENV = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
  const BASE = ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PayPal not configured");
  const tokenRes = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const { access_token } = await tokenRes.json();

  const body: Record<string, unknown> = {};
  if (amount) body.amount = { value: amount, currency_code: process.env.PAYPAL_CURRENCY || "USD" };
  if (reason) body.reason = reason;

  const r = await fetch(`${BASE}/v2/payments/captures/${captureId}/refund`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PayPal refund: ${r.status} ${await r.text()}`);
  return r.json();
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.ADMIN_SECRET || process.env.CRON_SECRET || "dev-secret"}`;
  if (auth !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Admin missing" }, { status: 503 });

  // resolve user
  let userId = body.user_id;
  if (!userId && body.user_email) {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    const u = data?.users?.find((x) => x.email === body.user_email);
    if (!u) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    userId = u.id;
  }
  if (!userId) return NextResponse.json({ ok: false, error: "user_email or user_id required" }, { status: 400 });

  if (body.action === "lookup_user") {
    const { data: billing } = await admin.from("user_billing").select("*").eq("user_id", userId).single();
    const { data: projects } = await admin.from("projects").select("id, name, created_at, updated_at").eq("user_id", userId).order("updated_at", { ascending: false });
    const { data: u } = await admin.auth.admin.getUserById(userId);
    return NextResponse.json({ ok: true, user: { id: userId, email: u?.user?.email }, billing, projects });
  }

  if (body.action === "grant_pro" || body.action === "grant_lifetime") {
    const plan = body.action === "grant_pro" ? "pro" : "lifetime";
    const expires = plan === "pro" ? new Date(Date.now() + 31 * 24 * 3600 * 1000).toISOString() : null;
    const { error } = await admin.from("user_billing").upsert(
      { user_id: userId, plan, paid_at: new Date().toISOString(), expires_at: expires, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: body.action, plan });
  }

  if (body.action === "revoke") {
    const { error } = await admin
      .from("user_billing")
      .update({ plan: "free", expires_at: null, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "revoke" });
  }

  if (body.action === "refund") {
    const { data: billing } = await admin
      .from("user_billing")
      .select("paypal_subscription_id, paypal_payer_id, paypal_capture_id, plan")
      .eq("user_id", userId)
      .single();

    if (!billing) {
      return NextResponse.json({ ok: false, error: "No billing record" }, { status: 404 });
    }

    // ponytail: full refund for lifetime (one-time, has capture id).
    // For Pro subscriptions, cancel the subscription instead.
    let paypalAction: string | null = null;
    let paypalResult: unknown = null;

    if (billing.plan === "lifetime" && billing.paypal_capture_id) {
      try {
        const refundAmount = body.amount || undefined;
        paypalResult = await paypalRefund(billing.paypal_capture_id, refundAmount, body.reason || "Admin refund");
        paypalAction = "refunded";
        // Mark payment as refunded
        await admin
          .from("payments")
          .update({ refunded_at: new Date().toISOString(), refunded_amount: body.amount || null })
          .eq("paypal_capture_id", billing.paypal_capture_id);
      } catch (e) {
        return NextResponse.json({ ok: false, error: `PayPal refund failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 502 });
      }
    } else if (billing.paypal_subscription_id) {
      // ponytail: cancel subscription. The webhook will mark user as free.
      const ENV = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
      const BASE = ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
      const id = process.env.PAYPAL_CLIENT_ID;
      const secret = process.env.PAYPAL_CLIENT_SECRET;
      if (id && secret) {
        const tokenRes = await fetch(`${BASE}/v1/oauth2/token`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "grant_type=client_credentials",
        });
        const { access_token } = await tokenRes.json();
        const r = await fetch(`${BASE}/v1/billing/subscriptions/${billing.paypal_subscription_id}/cancel`, {
          method: "POST",
          headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ reason: body.reason || "Admin refund" }),
        });
        paypalResult = { status: r.status, ok: r.ok };
        paypalAction = "subscription_cancelled";
      }
    }

    // Downgrade user immediately
    const { error } = await admin
      .from("user_billing")
      .update({ plan: "free", expires_at: null, paypal_capture_id: null, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, action: "refund", paypalAction, paypalResult });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
