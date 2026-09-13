// ponytail: minimal admin dashboard. /api/admin/stats returns MRR + active subs + recent signups.
// Protected by CRON_SECRET (reuse — same audience: site operator). Anyone with the secret can read.

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PRO_PRICE = Number(process.env.PRO_PRICE_USD || 5);
const LIFETIME_PRICE = Number(process.env.LIFETIME_PRICE_USD || 49);

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.ADMIN_SECRET || process.env.CRON_SECRET || "dev-secret"}`;
  if (auth !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Admin missing" }, { status: 503 });

  const [billing, totalUsers, proCount, lifetimeCount] = await Promise.all([
    admin.from("user_billing").select("plan, expires_at, paid_at, paypal_subscription_id, paypal_payer_id"),
    admin.auth.admin.listUsers({ perPage: 1 }),
    admin.from("user_billing").select("*", { count: "exact", head: true }).eq("plan", "pro").gt("expires_at", new Date().toISOString()),
    admin.from("user_billing").select("*", { count: "exact", head: true }).eq("plan", "lifetime"),
  ]);

  const activeSubs = (billing.data || []).filter(
    (b) => b.plan === "pro" && b.expires_at && new Date(b.expires_at) > new Date(),
  );
  const mrr = activeSubs.length * PRO_PRICE;
  const ltv = (lifetimeCount.count || 0) * LIFETIME_PRICE;

  const recent = (billing.data || [])
    .filter((b) => b.paid_at)
    .sort((a, b) => new Date(b.paid_at!).getTime() - new Date(a.paid_at!).getTime())
    .slice(0, 10)
    .map((b) => ({ plan: b.plan, paid_at: b.paid_at }));

  return NextResponse.json({
    ok: true,
    mrr,
    arr: mrr * 12 + ltv,
    pro_active: proCount.count || 0,
    lifetime: lifetimeCount.count || 0,
    total_users: (totalUsers.data && "users" in totalUsers.data ? totalUsers.data.users.length : 0) || 0,
    recent_payments: recent,
  });
}
