"use client";
// ponytail: Paywall modal. Two CTAs:
//   - Subscribe $5/mo  → POST /api/paypal/subscribe
//   - One-time $49      → POST /api/paypal/checkout
// Both return a PayPal approval URL we redirect to.

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, X } from "lucide-react";
import { getSupabase } from "@/lib/supabase-client";

export function PaywallModal({
  open,
  onClose,
  reason,
}: {
  open: boolean;
  onClose: () => void;
  reason: string;
}) {
  const [busy, setBusy] = React.useState<"sub" | "once" | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  if (!open) return null;

  const start = async (kind: "sub" | "once") => {
    setErr(null);
    setBusy(kind);
    try {
      const sb = getSupabase();
      if (!sb) throw new Error("Sign in first");
      const { data: sess } = await sb.auth.getSession();
      if (!sess.session) throw new Error("Sign in first");
      const r = await fetch(`/api/paypal/${kind === "sub" ? "subscribe" : "checkout"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (!data.ok || !data.approvalUrl) throw new Error(data.error || "PayPal init failed");
      window.location.href = data.approvalUrl;
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h2 className="text-lg font-semibold">Upgrade to Pro</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">{reason}</p>

        <ul className="mb-4 space-y-1 text-sm">
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-green-500" /> Unlimited projects
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-green-500" /> Unlimited AI captions (no BYOK needed)
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-green-500" /> 80+ locales with one-click translation
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-green-500" /> Cloud sync across devices
          </li>
        </ul>

        <div className="space-y-2">
          <Button className="w-full" disabled={!!busy} onClick={() => start("sub")}>
            {busy === "sub" ? "Redirecting…" : "Pro $5 / month"}
          </Button>
          <Button variant="outline" className="w-full" disabled={!!busy} onClick={() => start("once")}>
            {busy === "once" ? "Redirecting…" : "Lifetime $49 (one-time)"}
          </Button>
        </div>

        {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
        <p className="mt-3 text-[10px] text-muted-foreground">
          Payment processed by PayPal. Cancel anytime from your PayPal account.
        </p>
      </div>
    </div>
  );
}
