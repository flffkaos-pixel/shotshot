"use client";
// ponytail: generate a slide background with DALL-E 3 (BYOK). The image becomes the
// slide's background layer; the user keeps the device + caption on top.

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, KeyRound, ExternalLink, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

type ApiResp = { ok: true; path?: string; url?: string; revised_prompt?: string } | { ok: false; error: string };

function getKey(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("shotshot:openai_key") || "";
}
function setKey(v: string) {
  if (typeof window === "undefined") return;
  if (v) sessionStorage.setItem("shotshot:openai_key", v);
  else sessionStorage.removeItem("shotshot:openai_key");
}

const PRESETS = [
  "Soft sunrise gradient, warm cream to coral, App Store style",
  "Deep navy night sky with subtle stars, premium SaaS feel",
  "Pastel pink and purple mesh gradient, Gen-Z friendly",
  "Minimal off-white textured paper, editorial magazine",
  "Saturated golden hour with sun flare, productivity app",
  "Dark forest green with golden accents, premium wellness",
];

export function BackgroundGenerator({
  onApply,
  defaultPrompt,
}: {
  onApply: (path: string) => void;
  defaultPrompt?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [key, setKeyState] = React.useState("");
  const [prompt, setPrompt] = React.useState(defaultPrompt || PRESETS[0]);
  const [size, setSize] = React.useState<"1024x1024" | "1024x1792" | "1792x1024">("1024x1792");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    setKeyState(getKey());
  }, []);

  const run = async () => {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/ai/background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, size, userKey: key || undefined }),
      });
      const data = (await r.json()) as ApiResp;
      if (!data.ok) throw new Error(data.error);
      const path = data.path || data.url;
      if (!path) throw new Error("No image returned");
      onApply(path);
      toast.success("Background applied. Adjust opacity in the theme.");
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setOpen(true)}>
        <ImageIcon className="h-3.5 w-3.5" /> Generate background
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded border bg-card p-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 font-semibold">
          <Sparkles className="h-3.5 w-3.5" /> AI background (DALL-E 3)
        </span>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">×</button>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px]">OpenAI API key (BYOK)</Label>
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
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="flex h-7 items-center text-muted-foreground hover:text-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <p className="text-[10px] text-muted-foreground">
          <KeyRound className="inline h-3 w-3" /> DALL-E 3 standard quality: $0.04/image. Your bill, your data.
        </p>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px]">Prompt</Label>
        <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} className="h-7 text-xs" />
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((p) => (
            <button key={p} onClick={() => setPrompt(p)} className="rounded border border-dashed px-1.5 py-0.5 text-[10px] hover:border-solid text-left">
              {p.split(",")[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px]">Size</Label>
        <div className="flex gap-1">
          {(["1024x1024", "1024x1792", "1792x1024"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`flex-1 rounded border px-2 py-1 text-[10px] ${size === s ? "border-foreground bg-foreground/5" : "border-dashed"}`}
            >
              {s === "1024x1792" ? "Portrait" : s === "1792x1024" ? "Landscape" : "Square"}
            </button>
          ))}
        </div>
      </div>

      {err && <p className="text-[10px] text-destructive">{err}</p>}

      <Button size="sm" className="h-7 w-full text-xs" disabled={busy || !prompt} onClick={run}>
        {busy ? (
          <>
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Generating…
          </>
        ) : (
          "Generate ($0.04)"
        )}
      </Button>
    </div>
  );
}
