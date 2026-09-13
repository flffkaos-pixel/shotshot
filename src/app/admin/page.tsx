"use client";
// ponytail: operator-only dashboard. Reads /api/admin/stats with a shared secret.
// Vercel Hobby 비호출 (no users), 가장 단순.

import * as React from "react";
import Link from "next/link";

type Stats = {
  ok: boolean;
  mrr: number;
  arr: number;
  pro_active: number;
  lifetime: number;
  total_users: number;
  recent_payments: { plan: string; paid_at: string }[];
};

export default function AdminPage() {
  const [secret, setSecret] = React.useState("");
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  // user action panel
  const [targetEmail, setTargetEmail] = React.useState("");
  const [actionResult, setActionResult] = React.useState<string | null>(null);

  const callApi = React.useCallback(
    async (path: string, data: unknown) => {
      const r = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
        body: JSON.stringify(data),
      });
      return r.json();
    },
    [secret],
  );

  const load = async () => {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${secret}` } });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || "Failed");
      setStats(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (action: "grant_pro" | "grant_lifetime" | "revoke" | "refund" | "lookup_user") => {
    if (!targetEmail) return;
    setActionResult(null);
    setBusy(true);
    try {
      const data = await callApi("/api/admin/user", { action, user_email: targetEmail });
      setActionResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setActionResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Shotshot admin</h1>
        <Link href="/landing" className="text-sm text-muted-foreground underline hover:text-foreground">
          View public site →
        </Link>
      </div>

      {!stats && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Enter your CRON_SECRET to load stats.</p>
          <div className="flex gap-2">
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="flex-1 rounded border bg-background px-3 py-2 text-sm"
              placeholder="CRON_SECRET"
            />
            <button
              onClick={load}
              disabled={busy || !secret}
              className="rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
            >
              {busy ? "Loading…" : "Load"}
            </button>
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
        </div>
      )}

      {stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="MRR" value={`$${stats.mrr}`} />
            <Stat label="ARR" value={`$${stats.arr}`} />
            <Stat label="Pro" value={stats.pro_active} />
            <Stat label="Lifetime" value={stats.lifetime} />
            <Stat label="Total users" value={stats.total_users} />
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold">Recent payments</h2>
            <div className="rounded border bg-card">
              {(stats.recent_payments || []).length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No payments yet.</p>
              ) : (
                stats.recent_payments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between border-b p-3 text-sm last:border-0">
                    <span className="font-medium">{p.plan}</span>
                    <span className="text-muted-foreground">{new Date(p.paid_at).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">User actions</h2>
            <div className="mb-2 flex gap-2">
              <input
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="user@email.com"
                className="flex-1 rounded border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => runAction("lookup_user")} disabled={busy || !targetEmail} className="rounded border bg-background px-3 py-1.5 text-xs hover:bg-muted">
                Lookup
              </button>
              <button onClick={() => runAction("grant_pro")} disabled={busy || !targetEmail} className="rounded border border-green-300 bg-green-50 px-3 py-1.5 text-xs text-green-700 hover:bg-green-100">
                Grant Pro (30d)
              </button>
              <button onClick={() => runAction("grant_lifetime")} disabled={busy || !targetEmail} className="rounded border border-purple-300 bg-purple-50 px-3 py-1.5 text-xs text-purple-700 hover:bg-purple-100">
                Grant Lifetime
              </button>
              <button onClick={() => runAction("revoke")} disabled={busy || !targetEmail} className="rounded border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-100">
                Revoke
              </button>
              <button onClick={() => runAction("refund")} disabled={busy || !targetEmail} className="rounded border border-red-300 bg-red-50 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100">
                Revoke + Refund note
              </button>
            </div>
            {actionResult && (
              <pre className="mt-3 max-h-60 overflow-auto rounded bg-muted/50 p-3 text-[10px]">{actionResult}</pre>
            )}
          </div>

          <div className="rounded border bg-card p-4 text-sm">
            <h2 className="mb-2 font-semibold">Automation</h2>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>✓ PayPal webhooks: 7 event types auto-handled</li>
              <li>✓ Daily cron at 03:00 UTC: expiry + 3-day renewal warning</li>
              <li>✓ Resend email: 7 transactional templates</li>
              <li>✓ Auto grace period (3 days) on payment failure</li>
              <li>📊 Health check: <a href="/api/health" className="text-foreground underline">/api/health</a></li>
            </ul>
          </div>

          <button
            onClick={() => setStats(null)}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border bg-card p-3">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
