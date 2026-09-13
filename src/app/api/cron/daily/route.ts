// ponytail: Daily cron — runs at 03:00 UTC.
// Vercel: configured in vercel.json
// Cloudflare Pages: configured in wrangler.toml [[triggers.crons]]
// 1. downgrade expired pro to free (safety net for missed webhooks)
// 2. send "expiring in 3 days" warning emails

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { sendTemplatedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  // Vercel/Cloudflare cron calls with secret in authorization header.
  // Cloudflare Pages Cron Triggers: pass via secret_text binding or env CF_CRON_SECRET.
  const auth = req.headers.get("authorization");
  const cfCronSecret = (req as unknown as { env?: { CF_CRON_SECRET?: string } }).env?.CF_CRON_SECRET;
  const expected = `Bearer ${process.env.CRON_SECRET || cfCronSecret || "dev-secret"}`;
  if (auth !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Admin missing" }, { status: 503 });

  const now = new Date();
  const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // 1. expire
  const { data: expired, error: e1 } = await admin
    .from("user_billing")
    .update({ plan: "free", expires_at: null, updated_at: now.toISOString() })
    .lt("expires_at", now.toISOString())
    .neq("plan", "free")
    .select("user_id, plan, expires_at");
  if (e1) return NextResponse.json({ ok: false, error: e1.message }, { status: 500 });

  // 2. warn (only if expires_at set and within 3 days and not yet warned today)
  const { data: expiring, error: e2 } = await admin
    .from("user_billing")
    .select("user_id, expires_at, plan, warned_at")
    .eq("plan", "pro")
    .lt("expires_at", in3days.toISOString())
    .gt("expires_at", now.toISOString());
  if (e2) return NextResponse.json({ ok: false, error: e2.message }, { status: 500 });

  let warned = 0;
  for (const row of expiring || []) {
    if (row.warned_at && new Date(row.warned_at).toDateString() === now.toDateString()) continue;
    const { data: u } = await admin.auth.admin.getUserById(row.user_id);
    if (u?.user?.email) {
      await sendTemplatedEmail(
        u.user.email,
        "renewal_warning",
        { renewalDate: row.expires_at ? new Date(row.expires_at).toLocaleDateString() : "soon" },
      ).catch((e) => console.error("email failed:", e));
      warned++;
    }
    await admin.from("user_billing").update({ warned_at: now.toISOString() }).eq("user_id", row.user_id);
  }

  // ponytail: dead-letter detection — any PayPal subscription we know about that has no
  // matching user_billing row. Usually a race when /return fires before webhook.
  // Just log + alert; manual repair via /admin.
  const { data: dlq } = await admin
    .from("user_billing")
    .select("user_id, paypal_subscription_id, plan, paid_at, updated_at")
    .not("paypal_subscription_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(20);
  // We can't actually detect orphans from Supabase alone. The webhook handler logs "no user yet" already.
  // This block is here to make the dead-letter concept explicit and ready for a future Stripe-style ledger table.

  return NextResponse.json({
    ok: true,
    expired: expired?.length || 0,
    warned,
  });
}
