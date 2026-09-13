"use client";
// ponytail: 3-state shell. anonymous = local JSON (current behavior).
// signed-in 1 project = free (DB).
// signed-in 2nd+ = paywall unless pro/lifetime.

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FolderOpen, Sparkles, Trash2 } from "lucide-react";
import { ScreenshotEditor } from "./editor/screenshot-editor";
import { PaywallModal } from "./paywall-modal";
import { LandingGenerator } from "./landing-generator";
import { useProjects, type DbProject } from "@/lib/use-projects";
import { getSupabase } from "@/lib/supabase-client";
import { DEFAULT_PROJECT } from "@/lib/defaults";
import { toast } from "sonner";

type View = "anonymous" | "loading" | "list" | "editor";

export function ProjectShell() {
  const [view, setView] = React.useState<View>("loading");
  const [active, setActive] = React.useState<DbProject | null>(null);
  const [paywall, setPaywall] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const projects = useProjects();

  React.useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setView("anonymous");
      return;
    }
    sb.auth.getSession().then(({ data }: { data: { session: unknown } }) => {
      setView(data.session ? "list" : "anonymous");
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e: unknown, sess: { user: { id: string } } | null) => {
      setView(sess ? "list" : "anonymous");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // ponytail: handle ?paywall=... query after PayPal redirect
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("paywall");
    if (!p) return;
    if (p === "ok") {
      const plan = new URLSearchParams(window.location.search).get("plan") || "pro";
      toast.success(`Welcome to ${plan}! Unlimited projects unlocked.`);
    } else if (p === "cancel") {
      toast.message("PayPal checkout cancelled");
    } else if (p === "error") {
      const msg = new URLSearchParams(window.location.search).get("msg") || "Unknown error";
      toast.error(`Payment failed: ${msg}`);
    } else if (p !== "signin") {
      toast.error(`PayPal: ${p}`);
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("paywall");
    url.searchParams.delete("plan");
    url.searchParams.delete("msg");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const startNew = async () => {
    if (!getSupabase()) {
      // anonymous: just open editor with defaults
      setActive(null);
      setView("editor");
      return;
    }
    if (projects.plan === "free" && (projects.projects?.length || 0) >= 1) {
      setPaywall("Free plan = 1 project. Upgrade to Pro for unlimited projects.");
      return;
    }
    const projectName = name.trim() || `Project ${(projects.projects?.length || 0) + 1}`;
    const created = await projects.create(projectName, DEFAULT_PROJECT as never);
    if (created) {
      setActive(created);
      setView("editor");
    }
  };

  const open = (p: DbProject) => {
    setActive(p);
    // ponytail: seed localStorage so ScreenshotEditor's useProject() picks it up.
    try {
      localStorage.setItem("app-store-screenshots:project:v1", JSON.stringify(p.state));
    } catch {
      // ignore quota errors
    }
    setView("editor");
  };

  if (view === "loading") {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>
    );
  }

  if (view === "anonymous") {
    return (
      <div className="flex h-screen flex-col">
        <div className="flex items-center justify-between border-b bg-card/40 px-4 py-2">
          <span className="text-sm font-semibold">Shotshot</span>
          <span className="text-xs text-muted-foreground">Anonymous mode · sign in to sync</span>
        </div>
        <div className="flex-1">
          <ScreenshotEditor />
        </div>
      </div>
    );
  }

  if (view === "list") {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Your projects</h1>
            <p className="text-sm text-muted-foreground">
              {projects.plan === "free" ? "Free plan: 1 project" : `${projects.plan} plan`}
            </p>
          </div>
          {projects.plan !== "free" && (
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
              <Sparkles className="mr-1 inline h-3 w-3" />
              {projects.plan}
            </span>
          )}
        </div>

        <div className="mb-6 flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">New project name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My new app" className="mt-1" />
          </div>
          <Button onClick={startNew} className="gap-1">
            <Plus className="h-4 w-4" />
            New project
          </Button>
        </div>

        <div className="space-y-2">
          {(projects.projects || []).map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded border bg-card p-3 hover:border-foreground/30"
            >
              <button onClick={() => open(p)} className="flex-1 text-left">
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  Updated {new Date(p.updated_at).toLocaleString()}
                </div>
              </button>
              <LandingGenerator
                projectId={p.id}
                projectName={p.name}
                hasSupabase={!!getSupabase()}
              />
              <Button variant="ghost" size="icon" onClick={() => projects.remove(p.id)} title="Delete">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {projects.projects?.length === 0 && (
            <p className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
              No projects yet. Start one above.
            </p>
          )}
        </div>

        {projects.error && (
          <p className="mt-3 text-sm text-destructive">{projects.error}</p>
        )}

        <PaywallModal open={!!paywall} onClose={() => setPaywall(null)} reason={paywall || ""} />
      </div>
    );
  }

  // editor
  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b bg-card/40 px-4 py-2 text-xs">
        <button onClick={() => setView("list")} className="text-muted-foreground hover:text-foreground">
          ← Back to projects
        </button>
        <span className="font-medium">{active?.name}</span>
        <span className="text-muted-foreground">{projects.plan}</span>
      </div>
      <div className="flex-1">
        <SupabaseAutosave id={active?.id ?? null} />
        <ScreenshotEditor />
      </div>
    </div>
  );
}

// ponytail: 5s polling — read the editor's localStorage mirror and push to Supabase.
// Saves us wiring onChange through the editor. lossy on tab close but simple.
function SupabaseAutosave({ id }: { id: string | null }) {
  React.useEffect(() => {
    if (!id) return;
    let last = "";
    const t = setInterval(async () => {
      const raw = localStorage.getItem("app-store-screenshots:project:v1");
      if (!raw || raw === last) return;
      last = raw;
      try {
        const state = JSON.parse(raw);
        const sb = getSupabase();
        if (!sb) return;
        await sb.from("projects").update({ state, updated_at: new Date().toISOString() }).eq("id", id);
      } catch {
        // ignore parse errors
      }
    }, 5000);
    return () => clearInterval(t);
  }, [id]);
  return null;
}
