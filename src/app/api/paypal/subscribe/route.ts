import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { createSubscription } from "@/lib/paypal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 503 });
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });

    const planId = process.env.PAYPAL_SUBSCRIPTION_PLAN_ID;
    if (!planId) return NextResponse.json({ ok: false, error: "PAYPAL_SUBSCRIPTION_PLAN_ID not set" }, { status: 500 });

    const origin = new URL(req.url).origin;
    const sub = await createSubscription(planId, `${origin}/api/paypal/return?type=sub`, `${origin}/?paywall=cancel`);
    return NextResponse.json({ ok: true, approvalUrl: sub.approvalUrl, id: sub.id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
