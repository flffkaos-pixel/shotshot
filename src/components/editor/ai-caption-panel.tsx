"use client";
// ponytail: AI caption generator — calls /api/ai/caption with user's BYOK key (sessionStorage).
// zero server cost when BYOK is used; OpenRouter free models as fallback when server key is set.

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, KeyRound, ExternalLink } from "lucide-react";

type SlidePatch = { label?: string; headline?: string };
type ApiResp = { ok: true; slides: { slides?: SlidePatch[] } & SlidePatch; model: string } | { ok: false; error: string };

function getKey(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("shotshot:openai_key") || "";
}
function setKey(v: string) {
  if (typeof window === "undefined") return;
  if (v) sessionStorage.setItem("shotshot:openai_key", v);
  else sessionStorage.removeItem("shotshot:openai_key");
}

export function AICaptionPanel({
  appName,
  onApply,
}: {
  appName: string;
  onApply: (patches: SlidePatch[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [key, setKeyState] = React.useState("");
  const [features, setFeatures] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [tone, setTone] = React.useState("short, punchy, one-idea-per-line");

  React.useEffect(() => {
    setKeyState(getKey());
  }, []);

  const run = async () => {
    setBusy(true);
    setErr(null);
    try {
      const list = features.split(/\n+/).map((s) => s.trim()).filter(Boolean);
      if (list.length === 0) throw new Error("Add at least one feature");
      const r = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appName, features: list, tone, userKey: key || undefined }),
      });
      const data = (await r.json()) as ApiResp;
      if (!data.ok) throw new Error(data.error);
      const slides = Array.isArray(data.slides.slides) ? data.slides.slides : [];
      if (slides.length === 0) throw new Error("Model returned no slides");
      onApply(slides);
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => setOpen(true)}>
        <Sparkles className="h-3.5 w-3.5" /> AI captions
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded border bg-card p-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold">AI captions</span>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          ×
        </button>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px]">OpenAI API key (optional, BYOK)</Label>
        <div className="flex gap-1">
          <Input
            type="password"
            value={key}
            onChange={(e) => {
              setKeyState(e.target.value);
              setKey(e.target.value);
            }}
            placeholder="sk-…"
            className="h-7 text-xs"
          />
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noreferrer"
            className="flex h-7 items-center text-muted-foreground hover:text-foreground"
            title="Get an OpenAI key"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <p className="text-[10px] text-muted-foreground">
          <KeyRound className="inline h-3 w-3" /> Saved in sessionStorage only. No server cost when you bring your own key.
        </p>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px]">Features (one per line, priority order)</Label>
        <textarea
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
          rows={4}
          placeholder="Track habits\nGet daily nudges\nSync across devices"
          className="w-full rounded border bg-background px-2 py-1 text-xs"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-[10px]">Tone</Label>
        <Input value={tone} onChange={(e) => setTone(e.target.value)} className="h-7 text-xs" />
      </div>

      {err && <p className="text-[10px] text-destructive">{err}</p>}

      <Button size="sm" className="h-7 w-full text-xs" disabled={busy} onClick={run}>
        {busy ? "Generating…" : "Generate headlines"}
      </Button>
    </div>
  );
}
