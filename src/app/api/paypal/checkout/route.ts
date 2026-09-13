import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { createOrder } from "@/lib/paypal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 503 });
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });

    const amount = process.env.PAYPAL_LIFETIME_PRICE || "49.00";
    const currency = process.env.PAYPAL_CURRENCY || "USD";
    const origin = new URL(req.url).origin;
    const order = await createOrder(amount, currency, `${origin}/api/paypal/return?type=once`, `${origin}/?paywall=cancel`);
    return NextResponse.json({ ok: true, approvalUrl: order.approvalUrl, id: order.id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
