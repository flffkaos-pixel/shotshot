// ponytail: liveness + dependency check. UptimeRobot / Vercel / healthchecks.io poll this.
// Returns 200 only when critical deps respond. Use to alert via Resend on chronic failure.

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const checks: Record<string, "ok" | "fail" | "skip"> = {
    app: "ok",
  };

  // Supabase ping
  try {
    const sb = getSupabaseServer();
    if (sb) {
      const { error } = await sb.from("user_billing").select("user_id").limit(1);
      checks.supabase = error ? "fail" : "ok";
    } else {
      checks.supabase = "skip";
    }
  } catch {
    checks.supabase = "fail";
  }

  // PayPal token fetch (light probe)
  if (process.env.PAYPAL_CLIENT_ID) {
    try {
      const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
      const ENV = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
      const BASE = ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
      const r = await fetch(`${BASE}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
        signal: AbortSignal.timeout(5000),
      });
      checks.paypal = r.ok ? "ok" : "fail";
    } catch {
      checks.paypal = "fail";
    }
  } else {
    checks.paypal = "skip";
  }

  // Resend
  if (process.env.RESEND_API_KEY) {
    try {
      const r = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        signal: AbortSignal.timeout(5000),
      });
      checks.resend = r.ok ? "ok" : "fail";
    } catch {
      checks.resend = "fail";
    }
  } else {
    checks.resend = "skip";
  }

  const allOk = Object.values(checks).every((v) => v === "ok" || v === "skip");
  return NextResponse.json(
    { ok: allOk, checks, ts: new Date().toISOString() },
    { status: allOk ? 200 : 503 },
  );
}
