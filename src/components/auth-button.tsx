"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, LogOut, Mail } from "lucide-react";
import { getSupabase } from "@/lib/supabase-client";

type Session = { email: string; plan: string } | null;

export function AuthButton() {
  const [session, setSession] = React.useState<Session>(null);
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.auth.getSession();
    if (!data.session) {
      setSession(null);
      return;
    }
    const { data: billing } = await sb.from("user_billing").select("plan").eq("user_id", data.session.user.id).single();
    setSession({
      email: data.session.user.email || "",
      plan: billing?.plan || "free",
    });
  }, []);

  React.useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    void refresh();
    const { data: sub } = sb.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const signIn = async () => {
    setErr(null);
    setBusy(true);
    try {
      const sb = getSupabase();
      if (!sb) throw new Error("Supabase not configured");
      if (!email) throw new Error("Enter your email");
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setSent(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signOut();
    setSession(null);
  };

  if (session) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">
          {session.email} · <span className={session.plan === "free" ? "text-foreground" : "text-green-600"}>{session.plan}</span>
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={signOut} title="Sign out">
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  if (sent) {
    return (
      <span className="text-xs text-green-600" title="Check your email">
        <Mail className="mr-1 inline h-3.5 w-3.5" />
        Magic link sent
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="h-7 w-40 text-xs"
      />
      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={signIn} disabled={busy}>
        <LogIn className="h-3.5 w-3.5" />
        {busy ? "…" : "Sign in"}
      </Button>
      {err && <span className="text-xs text-destructive">{err}</span>}
    </div>
  );
}
