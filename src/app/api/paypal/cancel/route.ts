import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 503 });
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });

  const { data: billing } = await supabase
    .from("user_billing")
    .select("paypal_subscription_id")
    .eq("user_id", sess.session.user.id)
    .single();
  const subId = billing?.paypal_subscription_id;
  if (!subId) return NextResponse.json({ ok: false, error: "No active subscription" }, { status: 400 });

  // ponytail: cancel via PayPal. User keeps pro until period end (PayPal handles).
  const ENV = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
  const BASE = ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) return NextResponse.json({ ok: false, error: "PayPal not configured" }, { status: 500 });

  const tokenRes = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const { access_token } = await tokenRes.json();

  const r = await fetch(`${BASE}/v1/billing/subscriptions/${subId}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ reason: "User cancelled from dashboard" }),
  });
  if (!r.ok) {
    return NextResponse.json({ ok: false, error: `PayPal cancel: ${r.status}` }, { status: 502 });
  }

  return NextResponse.json({ ok: true, message: "Subscription cancelled. Pro stays active until period end." });
}
